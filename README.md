# This repository houses all exchange service modules and some shared exchange libs used across kinesis

## Structure:

This repository utilizes Lerna to manage inter-service dependencies and the following structure is used:

### All the shared libs are put in 3 categories

1. Model (`/packages/libs/model`) stores all the types/models for each service/bounded-context (e.g account, balance, order).
2. Query (`/packages/libs/model`) houses packages that allow clients to run common queries for a given model. All the sequelize models are stored there along with some common query functions.
   **!!!** There should be no functions exported here which mutate (insert/update/delete) the underlying model (datastore).
3. Util (`/packages/libs/util`) stores all the packages which contain non-functional(non-business logic related) logic which is reused across services (e.g. `db-connector` store all db (Postgress/redis) connector logic , `logging`)

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

Steps to set the project up locally:

1. Run `docker-compose up -d`
2. Run `npm install`
3. Run `lerna bootstrap`
