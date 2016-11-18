'use strict';

const chai = require('chai');
const expect = chai.expect;
const dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
const dynamo = require('./dynamo');

// Load environment vars from env.yml and replace stage variables within
const fs = require('fs');
const yaml = require('js-yaml');
const loadedEnvVars = yaml.safeLoad(fs.readFileSync('./authentication/env.yml', 'utf8'));
for (const item in loadedEnvVars) {
  if (loadedEnvVars.hasOwnProperty(item)) {
    process.env[item] = String(loadedEnvVars[item])
      .replace('${self:custom.writeEnvVars.STAGE}', loadedEnvVars.STAGE);
  }
}

// We can set these to default values for testing
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
