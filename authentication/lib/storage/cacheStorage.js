'use strict';

const table = process.env.CACHE_DB_NAME;
const config = { region: process.env.SERVERLESS_REGION };

if (process.env.LOCAL_DDB_ENDPOINT) config.endpoint = process.env.LOCAL_DDB_ENDPOINT;

// Common
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient(config);
const crypto = require('crypto');
const Promise = require('bluebird');

function hash() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Creates OAuth State
 */
const createState = () => new Promise((resolve, reject) => {
  const state = hash();
  const params = {
    TableName: table,
    Item: {
      Token: state,
      Type: 'STATE',
      Expired: false
    }
  };

  dynamodb.put(params, (error) => {
    if (error) {
      reject(error);
    } else {
      resolve(state);
    }
  });
});

/**
 * Revokes OAuth State
 * @param state
 */
const revokeState = (state) => new Promise((resolve, reject) => {
  const queryToken = () => new Promise((_resolve, _reject) => {
    const params = {
      TableName: table,
      ProjectionExpression: '#token, #type, Expired',
      KeyConditionExpression: '#token = :token and #type = :type',
      ExpressionAttributeNames: {
        '#token': 'Token',
        '#type': 'Type'
      },
      ExpressionAttributeValues: {
        ':token': state,
        ':type': 'STATE'
      }
    };

    dynamodb.query(params, (err, data) => {
      if (err) {
        _reject(err);
      } else {
        _resolve(data);
      }
    });
  });

  const insertToken = (data) => new Promise((_resolve, _reject) => {
    const item = data.Items[0];
    if (item.Expired) {
      _reject('State expired'); // @todo move to query, e.g. filter?
    } else {
      const params = {
        TableName: table,
        Item: {
          Token: state,
          Type: 'STATE',
          Expired: true
        }
      };

      dynamodb.put(params, (error) => {
        if (!error) {
          _resolve(item.Token);
        } else {
          _reject(error);
        }
      });
    }
  });

  queryToken()
    .then(insertToken)
    .then((token) => {
      if (state !== token) {
        reject('State mismatch');
      }
      resolve(token);
    })
    .catch((error) => reject(error));
});

/**
 * Creates and saves refresh token
 * @param user
 */
const saveRefreshToken = (user) => new Promise((resolve, reject) => {
  const token = hash();
  const params = {
    TableName: table,
    Item: {
      Token: token,
      Type: 'REFRESH',
      Expired: false,
      UserId: user
    }
  };

  dynamodb.put(params, (error) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
});

/**
 * Revokes old refresh token and creates new
 * @param oldToken
 */
const revokeRefreshToken = (oldToken) => new Promise((resolve, reject) => {
  if (oldToken.match(/[A-Fa-f0-9]{64}/)) {
    const token = hash();

    const queryToken = () => new Promise((_resolve, _reject) => {
      const params = {
        TableName: table,
        ProjectionExpression: '#token, #type, #userId',
        KeyConditionExpression: '#token = :token and #type = :type',
        ExpressionAttributeNames: {
          '#token': 'Token',
          '#type': 'Type',
          '#userId': 'UserId'
        },
        ExpressionAttributeValues: {
          ':token': oldToken,
          ':type': 'REFRESH'
        }
      };
      dynamodb.query(params, (err, data) => {
        if (err) {
          _reject(err);
        } else {
          _resolve(data);
        }
      });
    });

    const newRefreshToken = (data) => new Promise((_resolve, _reject) => {
      const UserId = data.Items[0].UserId;
      const params = {
        TableName: table,
        Item: {
          Token: token,
          Type: 'REFRESH',
          Expired: false,
          UserId
        }
      };
      dynamodb.put(params, (error) => {
        if (error) {
          _reject(error);
        } else {
          _resolve(UserId);
        }
      });
    });

    const expireRefreshToken = (UserId) => new Promise((_resolve, _reject) => {
      const params = {
        TableName: table,
        Item: {
          Token: oldToken,
          Type: 'REFRESH',
          Expired: true,
          UserId
        }
      };
      dynamodb.put(params, (error) => {
        if (error) {
          _reject(error);
        } else {
          _resolve(UserId);
        }
      });
    });

    queryToken()
      .then(newRefreshToken)
      .then(expireRefreshToken)
      .then((id) => {
        resolve({ id, token });
      })
      .catch((error) => reject(error));
  } else {
    reject('Invalid token');
  }
});

exports = module.exports = {
  createState,
  revokeState,
  saveRefreshToken,
  revokeRefreshToken
};
