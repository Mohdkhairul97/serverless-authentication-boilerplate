#!/usr/bin/env bash

touch ".env"

docker-machine start default
eval "$(docker-machine env default)"
docker-compose up -d

TEST_LOCAL=true ./node_modules/.bin/mocha specs/

if [ "$1" = "single-run" ]; then
  docker-compose down
  docker-machine stop default
fi

rm ".env"
