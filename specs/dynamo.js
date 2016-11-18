'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const env = yaml.safeLoad(fs.readFileSync('./authentication/serverless.yml').toString());
const resources = env.resources.Resources;
const async = require('async');
const DynamoDB = require('aws-sdk').DynamoDB;

let ready = false;

function init(cb) {
  const endpoint = process.env.LOCAL_DDB_ENDPOINT;
  const region = process.env.REGION;
  const db = new DynamoDB({ endpoint, region });
  resources.CacheDynamoDbTable.Properties.TableName = process.env.CACHE_DB_NAME;
  async.waterfall([
    (callback) => {
      db.listTables({}, callback);
    },
    (data, callback) => {
      const tables = data.TableNames;
      if (tables.indexOf(process.env.CACHE_DB_NAME) < 0) {
        db.createTable(resources.CacheDynamoDbTable.Properties, (err, created) => {
          if (!err) {
            callback(null, `table ${created.TableDescription.TableName} created`);
          } else {
            callback(err);
          }
        });
      } else {
        callback(null, `${process.env.CACHE_DB_NAME} already exists`);
      }
    }
  ], (err) => {
    if (!err) {
      ready = true;
    }
    if (cb) {
      cb(err);
    }
  });
}

function isReady() {
  return ready;
}

exports = module.exports = {
  init,
  isReady
};
