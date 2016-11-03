'use strict';

const signinHandler = require('../authentication/lib/handlers/signinHandler');
const expect = require('chai').expect;
const defaultEvent = require('./event.json');

describe('Authentication', () => {
  describe('Signin', () => {
    it('should fail to return token for invalid provider', (done) => {
      const event = Object.assign({}, defaultEvent, {
        pathParameters: { provider: 'invalid' }
      });

      signinHandler(event, { succeed: (data) => {
        expect(data.statusCode).to.equal(302);
        expect(data.headers.Location).to.equal('http://127.0.0.1:3000/?error=Invalid provider: invalid');
        done(null);
      } });
    });
  });
});
