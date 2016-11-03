'use strict';

const signinHandler = require('../authentication/lib/handlers/signinHandler');
const callbackHandler = require('../authentication/lib/handlers/callbackHandler');
const refreshHandler = require('../authentication/lib/handlers/refreshHandler');
const slsAuth = require('serverless-authentication');
const utils = slsAuth.utils;
const config = slsAuth.config;
const nock = require('nock');
const expect = require('chai').expect;
const url = require('url');
const defaultEvent = require('./event.json');

describe('Authentication Provider', () => {
  describe('Google', () => {
    before(() => {
      const googleConfig = config(Object.assign({}, defaultEvent, { provider: 'google' }));
      nock('https://www.googleapis.com')
        .post('/oauth2/v4/token')
        .query({
          client_id: googleConfig.id,
          redirect_uri: googleConfig.redirect_uri,
          client_secret: googleConfig.secret,
          code: 'code'
        })
        .reply(200, {
          access_token: 'access-token-123'
        });

      nock('https://www.googleapis.com')
        .get('/plus/v1/people/me')
        .query({ access_token: 'access-token-123' })
        .reply(200, {
          id: 'user-id-1',
          displayName: 'Eetu Tuomala',
          emails: [
            {
              value: 'email@test.com'
            }
          ],
          image: {
            url: 'https://avatars3.githubusercontent.com/u/4726921?v=3&s=460'
          }
        });
    });

    let state = '';
    let refreshToken = '';

    it('should return oauth signin url', (done) => {
      const event = Object.assign({}, defaultEvent, {
        pathParameters: {
          provider: 'google'
        }
      });

      signinHandler(event, { succeed: (data) => {
        const query = url.parse(data.headers.Location, true).query;
        state = query.state;
        expect(data.headers.Location).to.match(/https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?client_id=g-mock-id&redirect_uri=https:\/\/api-id\.execute-api\.us-east-1\.amazonaws\.com\/dev\/authentication\/callback\/google&response_type=code&scope=profile email&state=.{64}/);
        done(null);
      } });
    });

    it('should return local client url', (done) => {
      const event = Object.assign({}, defaultEvent, {
        pathParameters: {
          provider: 'google'
        },
        queryStringParameters: {
          code: 'code',
          state
        }
      });

      const providerConfig = config(event);
      callbackHandler(event, { succeed: (data) => {
        const query = url.parse(data.headers.Location, true).query;
        refreshToken = query.refresh_token;
        expect(query.authorization_token).to.match(/[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?/);
        expect(refreshToken).to.match(/[A-Fa-f0-9]{64}/);
        const tokenData = utils.readToken(query.authorization_token, providerConfig.token_secret);
        expect(tokenData.id)
          .to.equal('59d694734e227742db6b6788bdbfb2e5fb5f866c1811fc4d8704aff012e69623');
        done(null);
      } });
    });

    it('should get new authorization token', () => {
      const event = {
        refresh_token: refreshToken
      };

      refreshHandler(event, (error, data) => {
        expect(error).to.be.null();
        expect(data.authorization_token).to.match(/[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?/);
        expect(data.refresh_token).to.match(/[A-Fa-f0-9]{64}/);
      });
    });
  });
});
