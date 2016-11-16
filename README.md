# Serverless Authentication

Note by Jeremy Cummins: This fork is meant to work with the `react-authenticate` branch of https://github.com/99xt/serverless-react-boilerplate/.
It will authorize an API endpoint that includes a user ID so that the client cannot modify a different user's data by replacing the user ID in the request. See **redirectProxyCallback** method in **authentication/lib/helpers.js**.

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

This project is aimed to be a generic authentication boilerplate for the [Serverless framework](http://www.serverless.com).

This boilerplate is compatible with the Serverless v.1.0.0, to install Serverless framework run `npm install -g serverless`.

Webapp demo that uses this boilerplate: http://laardee.github.io/serverless-authentication-gh-pages

If you are using Serverless framework v.0.5, see branch https://github.com/laardee/serverless-authentication-boilerplate/tree/serverless-0.5

## Installation

Installation will create one DynamoDB table for OAuth state and refresh tokens.

1. Clone or download the repository https://github.com/jcummins54/serverless-authentication-boilerplate/.
2. Switch to the branch `git checkout -b react-authenticate` and get the latest `git pull origin react-authenticate`.
3. Copy _example-env.yml_ in _authentication_ to _env.yml_ and set [environmental variables](#env-vars).
4. Change directory to `authentication` and run `npm install`.
5. Run `serverless deploy` on the authentication folder to deploy authentication service to AWS. Notice the arn of the authorize function.
6. (optional) Change directory to test-token and insert the arn of the authorizer function to authorizer/arn in serverless.yml. Then run `serverless deploy` to deploy test-token service.

If you wish to change the cache db name, change `CACHE_DB_NAME ` in _env.yml_ file and `TableName` in _serverless.yml_ in Dynamo resource.

## Set up Authentication Provider Application Settings

The redirect URI that needs to be defined in oauth provider's application settings is the callback endpoint of the API. For example if you use facebook login, the redirect URI is **https://API-ID.execute-api.us-east-1.amazonaws.com/dev/authentication/callback/facebook** and for google **https://API-ID.execute-api.us-east-1.amazonaws.com/dev/authentication/callback/google**.

## Services

In this example project authentication and authorization services are separated from content API (test-token).

### Authentication

Authentication service and authorization function for content API. These can also be separated if needed.

Functions:

* authentication/signin
  * endpoint: /authentication/signin/{provider}, redirects to oauth provider login page
  * handler: signin function creates redirect url to oauth provider and saves `state` to DynamoDB
* authentication/callback
  * endpoint: /authentication/callback/{provider}, redirects back to client webapp with token url parameter
  * handler: function is called by oauth provider with `code` and `state` parameters and it creates authorization and refresh tokens
* authentication/refresh
  * endpoint: /authentication/refresh/{refresh_token}, returns new authentication token and refresh token
  * handler: function revokes refresh token
* authentication/authorize
  * endpoint: no end point
  * handler: is used by Api Gateway custom authorizer

### Test-token

Simulates content API.

Functions:

* test-token/test-token
  * endpoint: /test-token
  * handler: test-token function can be used to test custom authorizer, it returns principalId of custom authorizer policy. It is mapped as username in request template.

## <a id="env-vars"></a>Environmental Variables

Open authentication/env.yml, fill in what you use and other ones can be deleted.

```
STAGE: dev
CACHE_DB_NAME: ${self:custom.writeEnvVars.STAGE}-serverless-authentication-cache
USERS_DB_NAME: ${self:custom.writeEnvVars.STAGE}-serverless-authentication-users
COGNITO_IDENTITY_POOL_ID: cognito-pool-id
COGNITO_REGION: us-east-1
COGNITO_PROVIDER_NAME: your-service-name
REDIRECT_CLIENT_URI: http://url-to-frontend-webapp/
API_AUTH_ENDPOINT: https://API-ID.execute-api.us-east-1.amazonaws.com/${self:custom.writeEnvVars.STAGE}/todos/{userId}/register
TOKEN_SECRET: secret-for-json-web-token
PROVIDER_FACEBOOK_ID: fb-mock-id
PROVIDER_FACEBOOK_SECRET: fb-mock-secret
PROVIDER_GOOGLE_ID: g-mock-id
PROVIDER_GOOGLE_SECRET: g-mock-secret
PROVIDER_MICROSOFT_ID: ms-mock-id
PROVIDER_MICROSOFT_SECRET: ms-mock-secret
PROVIDER_CUSTOM_GOOGLE_ID: cg-mock-id
PROVIDER_CUSTOM_GOOGLE_SECRET: cg-mock-secret
```

## Example Provider Packages

* facebook [serverless-authentication-facebook](https://www.npmjs.com/package/serverless-authentication-facebook)
* google [serverless-authentication-google](https://www.npmjs.com/package/serverless-authentication-google)
* windows live [serverless-authentication-microsoft](https://www.npmjs.com/package/serverless-authentication-microsoft)
* more to come

## <a id="custom-provider"></a>Custom Provider

Package contains example [/authentication/lib/custom-google.js](https://github.com/laardee/serverless-authentication-boilerplate/blob/master/authentication/lib/custom-google.js) how to implement custom authentication provider using generic Provider class. To test custom provider go to http://laardee.github.io/serverless-authentication-gh-pages and click 'custom-google' button.

## Running Tests on Mac

* Install Docker and Docker Compose
* Run `npm install` in project root directory 
* Run ./specs-docker.sh
