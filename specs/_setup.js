'use strict';

const chai = require('chai');
const expect = chai.expect;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const dynamo = require('./dynamo');

process.env.STAGE = 'dev';
process.env.CACHE_DB_NAME = '{stage}-serverless-authentication-cache';
process.env.COGNITO_IDENTITY_POOL_ID = 'cognito-pool-id';
process.env.COGNITO_REGION = 'us-east-1';
process.env.COGNITO_PROVIDER_NAME = 'serverless-authentication-boilerplate';
process.env.REDIRECT_CLIENT_URI = 'http://127.0.0.1:3000/';
process.env.TOKEN_SECRET = 'token-secret-123';
process.env.PROVIDER_FACEBOOK_ID = 'fb-mock-id';
process.env.PROVIDER_FACEBOOK_SECRET = 'fb-mock-secret';
process.env.PROVIDER_GOOGLE_ID = 'g-mock-id';
process.env.PROVIDER_GOOGLE_SECRET = 'g-mock-secret';
process.env.PROVIDER_MICROSOFT_ID = 'ms-mock-id';
process.env.PROVIDER_MICROSOFT_SECRET = 'ms-mock-secret';
process.env.PROVIDER_CUSTOM_GOOGLE_ID = 'cg-mock-id';
process.env.PROVIDER_CUSTOM_GOOGLE_SECRET = 'cg-mock-secret';

chai.config.includeStack = false;

global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;

describe('Setup specs', () => {
  before((done) => dynamo.init(done));

  it('Local DynamoDB should be ready', () => {
    expect(dynamo.isReady()).to.be.true();
  });
});
