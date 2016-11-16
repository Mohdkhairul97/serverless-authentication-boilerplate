'use strict';

const createResponseData = (id) => {
  // sets 15 seconds expiration time as an example
  const authorizationToken = {
    payload: {
      id
    },
    options: {
      expiresIn: 15
    }
  };

  return { authorizationToken };
};

const redirectProxyCallback = (context, data) => {
  // TODO: Better if utils.tokenResponse returned authorizationToken as a seperate parameter
  // so we don't have to parse it out of the url.
  const url = require('url');
  const query = url.parse(data.url, true).query;

  if (!query.authorization_token) {
    context.succeed({
      statusCode: 302,
      headers: {
        Location: data.url
      }
    });
    return;
  }

  // Authorize before returning auth token to ensure client cannot authorize a different user ID.
  // The user ID becomes part of the API path authorized, ensuring that this user cannot
  // modify another user's data.
  const authUrl = process.env.API_AUTH_ENDPOINT.replace(/{userId}/, query.id);
  const request = require('request');
  const options = {
    url: authUrl,
    headers: {
      Authorization: query.authorization_token
    }
  };
  request(options, (error, response) => {
    if (!error && response.statusCode === 200) {
      context.succeed({
        statusCode: 302,
        headers: {
          Location: data.url
        }
      });
    } else {
      console.log(error);
    }
  });
};

exports = module.exports = {
  createResponseData,
  redirectProxyCallback
};
