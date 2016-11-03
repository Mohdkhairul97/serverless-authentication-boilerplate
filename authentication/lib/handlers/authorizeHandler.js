'use strict';

// Config
require('dotenv').config();
const slsAuth = require('serverless-authentication');
const config = slsAuth.config;
const utils = slsAuth.utils;


// Authorize
//
// event.methodArn: "arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/<method>/<resourcePath>/<userId>/<function>"
// ...will be parsed as...
// const resource = "arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/*/<resourcePath>/<userId>/*"

const authorize = (event, callback) => {
  const resourceParts = event.methodArn.split('/');
  const stage = resourceParts[1];
  let resource = `${resourceParts[0]}/${stage}/*/${resourceParts[3]}/${resourceParts[4]}`;
  if (resourceParts.length > 5) {
    resource += '/*';
  }
  let error = null;
  let policy;
  const authorizationToken = event.authorizationToken;
  if (authorizationToken) {
    try {
      // this example uses simple expiration time validation
      const providerConfig = config({ provider: '', stage });
      const data = utils.readToken(authorizationToken, providerConfig.token_secret);
      policy = utils.generatePolicy(data.id, 'Allow', resource);
    } catch (err) {
      error = 'Unauthorized';
    }
  } else {
    error = 'Unauthorized';
  }
  callback(error, policy);
};


exports = module.exports = authorize;
