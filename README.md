# This repository houses all exchange service modules and some shared exchange libs used across kinesis

## Structure:

This repository utilizes Lerna to manage inter-service dependencies and the following structure is used:

### All the shared libs are put in 3 categories

1. Model (`/packages/libs/model`) stores all the types/models for each service/bounded-context (e.g account, balance, order).
2. Query (`/packages/libs/query`) houses packages that allow clients to run common queries for a given model. At present `account` is the only functional area which this is required for(mainly due to authentication and access control in the REST API for each service). For other functional areas `internal-clients` should be created
   3 Internal Clients (`packages/libs/internal-clients`) contains all the internal api packages to be used for cross-service dependencies. Example:

- The `order` service requires `reference-data` (e.g. symbol,currency, currency boundary data) so it needs to use `@abx-service-clients/reference-data` (`libs/internal-clients/reference-data`

4. Util (`/packages/libs/util`) stores all the packages which contain non-functional(non-business logic related) logic which is reused across services (e.g. `db-connector` store all db (Postgress/redis) connector logic , `logging`)

All of these packages are versioned and release to the org npm account and could be used by repos/projects outside of this monorepo (e.g. Yield engine/Front-end)

There are example `note` model and query packages which can be used as a base when creating new ones.

### All the services (deployed as separate runnables) are stored in /packages/services

Each service packages is further structured in the following way:

- `src/core` stores all the core business logic for the service
- `src/internal-api` stores all the API endpoints exposed internally (currently with epicurus) allowing other services to request data mutation , for querying the data for a given service the service query lib should be used
- `src/migrations` stores all the db-migrations specific to the service, ideally all the migration template/script files should start with the name of the service - (e.g `notification-01-create-table.ts`)
- `src/rest-api` stores all the `tsoa` controllers exposing REST endpoints

These packages are not released to `npm` in their `publish` step, rather theirs docker image is pushed to `AWS ECR`.

There is a example `note` service which contains the structure defined above.

### Common scripts

Scripts required for the setup are placed in `/_scripts`

## Steps to set the project up locally:

1. Run `npm install`
2. Run `npm run link`
3. Run `npm run bootstrap`
4. Run `npm run build`

## Before running tests

1. Run `./_scripts/start_test_dbs_run_migrations.sh`

## API Local execution

1. Run `docker-compose up -d`
2. Run `npm run run-legacy-migrations:dev`
3. Run `npm run start-api-debug`

## Local debug VS Code launch.json config

{
// Use IntelliSense to learn about possible attributes.
// Hover to view descriptions of existing attributes.
// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
"version": "0.2.0",
"configurations": [{
"name": "Launch via npm",
"type": "node",
"request": "launch",
"cwd": "\${workspaceFolder}",
"runtimeExecutable": "npm",
"runtimeArgs": ["run-script", "start-api-debug"],
"port": 9229,
"stopOnEntry": true,
"sourceMaps": true,
}]
}

### Conventions

#### Branches

Branch naming should follow the git-flow branching model. A good overview on this can be found [here](https://danielkummer.github.io/git-flow-cheatsheet/). Our branch names are as follows:

| Branch type | Format                         | Notes                                                                                                                                                             |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| master      | -                              | Production branch                                                                                                                                                 |
| develop     | -                              | Base development branch                                                                                                                                           |
| feature     | /feature/[JIRA ID]-branch-name | Used for developing new features. Almost all new code will reside within a feature branch. When completed, feature branches are merged back into develop          |
| hotfix      | /hotfix/[JIRA ID]-branch-name  | Used for developing hotfixes to the production environment. These changes are merged straight to `master` and then merged back down through to existing branches. |
| release     | /release/[RELEASE ID]          | Used for promoting code from `develop` to `master`                                                                                                                |
| support     | /support/[JIRA ID]-branch-name | Used for doing support work that doesn't need to be reintegrated                                                                                                  |

Please always remember to use the JIRA ID in your branches so that other developers will always have visibility over how that work fits into project plans.

#### Object and file naming

Object and file names should be descriptive as to the purpose of the code within it.

| Object type | File naming pattern         | Object naming pattern   |
| ----------- | --------------------------- | ----------------------- |
| Enum        | [Object Name].enum.ts       | [Object Name]Enum       |
| Service     | [Object Name].service.ts    | [Object Name]Service    |
| Controller  | [Object Name].controller.ts | [Object Name]Controller |
| Config      | [Object Name].config.ts     | [Object Name]Config     |
| Util        | [Object Name].util.ts       | [Object Name]Util       |
| Type        | [Object Name].type.ts       | [Object Name]Type       |
| Interface   | [Object Name].interface.ts  | I[ObjectName]           |

#### Variable and method naming

Variables and methods should be named in `camelCase` and be descriptive enough such that the code is self-documenting. Don't use variables like `x`, as it means nothing to the developer who has to look at your code many months after you write it!

This also applies to loops and iterators, e.g.:

```typescript
// Bad
let i
for (i = 0; i < x; i++) {
    ...
}

// Good
let userIteration
for (userIteration = 0; userIteration < numberOfUsers; userIteration++) {
    ...
}
```

#### Coding methodology

Functions should be kept succinct and aim to achieve a single purpose. This is to aid in the creation of unit tests and reduce the complexity required in producing tests.

#### Unit testing

All new code must have matching unit tests which adequately cover a range of input scenarios.
