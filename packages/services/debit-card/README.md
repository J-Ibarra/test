## Description

The Debit Card API Service

## Dependancy Installation

```bash
$ npm install
```

## Running the app

```bash
# local dev environment
$ npm run db-start // Runs redis and postgres containers
$ npm run start:dev // Starts the API in watch mode, refreshing on any file changes

# production mode
$ npm run start:prod
```

## Test

```bash
# run unit tests (single-run)
$ npm test

# run unit tests with watcher, rerunning tests on each change
$ npm run test:watch

# debug unit tests
$ npm run test:debug

# run integration tests
$ npm run test:integration

# debug integration tests
$ npm run test:integration:debug

# produce test coverage report
$ npm run test:cov
```

## Other useful npm scripts

```bash
# format code
$ npm run format

# lint code
$ npm run lint
```
