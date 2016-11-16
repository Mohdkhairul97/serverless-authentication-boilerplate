'use strict';

// Config
require('dotenv').config();
const slsAuth = require('serverless-authentication');
const config = slsAuth.config;
const utils = slsAuth.utils;

// Providers
const facebook = require('serverless-authentication-facebook');
const google = require('serverless-authentication-google');
const microsoft = require('serverless-authentication-microsoft');
const customGoogle = require('../custom-google');

// Common
const crypto = require('crypto');
const cache = require('../storage/cacheStorage');
const users = require('../storage/usersStorage');
const Promise = require('bluebird');

const helpers = require('../helpers');
const createResponseData = helpers.createResponseData;
const redirectProxyCallback = helpers.redirectProxyCallback;

function createUserId(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Callback Handler
 * @param proxyEvent
 * @param context
 */
function callbackHandler(proxyEvent, context) {
  const event = {
    provider: proxyEvent.pathParameters.provider,
    stage: proxyEvent.requestContext.stage,
    host: proxyEvent.headers.Host,
    code: proxyEvent.queryStringParameters.code,
    state: proxyEvent.queryStringParameters.state
  };

  const providerConfig = config(event);

  /**
   * Error response
   * @param error
   */
  function errorResponse(error) {
    utils.errorResponse(
      error,
      providerConfig,
      (err, response) => redirectProxyCallback(context, response)
    );
  }

  /**
   * Token response
   * @param data
   */
  function tokenResponse(data) {
    utils.tokenResponse(
      data,
      providerConfig,
      (err, response) => redirectProxyCallback(context, response)
    );
  }

  /**
   * Handles the response
   * @param error
   * @param profile
   * @param state
   */
  const handleResponse = (error, profile, state) => {
    if (error) {
      // Error response if something went wrong at the first place
      errorResponse({ error: 'Unauthorized' });
    } else {
      cache.revokeState(state)
        .then(() => {
          const uid = createUserId(`${profile.provider}-${profile.id}`,
            providerConfig.token_secret);
          const data = createResponseData(uid, providerConfig);

          // Return the user's ID as a paramter in the callback URI.
          // The user ID becomes part of the API path authorized, ensuring that this user cannot
          // modify another user's data.
          // e.g. https://<API ID>.execute-api.us-east-1.amazonaws.com/dev/*/todos/<USER ID>/*
          Object.assign(data, { id: uid });

          // map data for db
          Object.assign(profile, { userName: profile.name });
          // remove DynamoDB keyword
          Object.assign(profile, { name: null });
          Object.assign(profile, { providerId: profile.id });
          Object.assign(profile, { id: uid });

          Promise.all([
            cache.saveRefreshToken(uid),
            users.saveUser(profile)
          ])
            .then((results) => tokenResponse(Object.assign(data, { refreshToken: results[0] })))
            .catch((_error) => errorResponse({ error: _error }));
        }).catch((_error) => errorResponse({ error: _error }));
    }
  };

  switch (event.provider) {
    case 'facebook':
      facebook.callbackHandler(event, providerConfig, handleResponse);
      break;
    case 'google':
      google.callbackHandler(event, providerConfig, handleResponse);
      break;
    case 'microsoft':
      microsoft.callbackHandler(event, providerConfig, handleResponse);
      break;
    case 'custom-google':
      customGoogle.callbackHandler(event, providerConfig, handleResponse); // See ./customGoogle.js
      break;
    default:
      errorResponse({ error: 'Invalid provider' });
  }
}

exports = module.exports = callbackHandler;
