# This repository houses all exchange service modules and some shared exchange libs used across kinesis

## Structure:

This repository utilizes Lerna to manage inter-service dependencies and the following structure is used:

### All the shared libs are put in 3 categories

1. Model (`/packages/libs/model`) stores all the @types for each service (e.g account, balance, order).
2. Internal Clients (`/packages/libs/internal-clients`) - contains a service-specific logic for invoking internal endpoints exposed by the service. These endpoints can be:

   - `request-response` - executed over HTTP. There is a `InternalApiRequestDispatcher` class in `@abx-utils/internal-api-tools` which encapsulates the logic of creating the HTTP call, using axios. Example use:

   ```typescript
   const internalApiRequestDispatcher = new InternalApiRequestDispatcher(3001)

   export function findAccountById(accountId: string): Promise<Account> {
     return internalApiRequestDispatcher.fireRequestToInternalApi<Account>('accounts/findAccountById' { accountId })
   }
   ```

   - `async-based` - requests are pushed to AWS SQS or redis topics(when run locally). Here we also have a function that abstracts that logic (where to push the message) - `sendAsyncChangeMessage` in `@abx-utils/async-message-publisher`.

   ```typescript
   export function releaseReserve(payload: BasicBalanceAsyncRequestPayload) {
     return sendAsyncChangeMessage<BalanceChangeAsyncRequestContainer>({
       id: `releaseReserve-${payload.sourceEventId}`,
       type: 'releaseReserve',
       target: {
         local: localRedisBalanceChangeTopic,
         deployedEnvironment: process.env.BALANCE_CHANGE_QUEUE_URL!,
       },
       payload: {
         requestedChanges: [
           {
             type: BalanceAsyncRequestType.releaseReserve,
             payload,
           },
         ],
       },
     })
   }
   ```

   The preference going forward should be that any change triggering request should use the `async` mode while any data-retrieval should be done through `HTTP` (request-response).
   That being said, that approach couldn't be applied for all the pre-existing endpoints as they were implemented in the old monolith repo with no consideration over inter-service communication.

3. Util (`/packages/libs/util`) stores all the packages which contain non-functional(non-business logic related) logic which is reused across services (e.g. `db-connector` store all db (Postgress/redis) connector logic , `logging` contains the `Logger` used for managing logging across the services)

All of these packages are versioned and release to the org npm account and could be used by repositories/projects outside of this monorepo (e.g. Yield engine/Front-end)

## All the services (deployed as separate containers when executed in aws) are stored in /packages/services

---

### **!!!!!!!!!** Something to have in mind is that each folder in `packages/services` should be considered a functional area. There are big functional areas where we have multiple services/containers each with a separate responsibility.

---

### For functional areas with a single service the following structure is followed

- `src/core` stores all the core business logic for the service
- `src/core/model` stores all the ORM(`sequelize`) models specific to the service
- `src/internal-api` stores all the API endpoints exposed internally (currently with epicurus) allowing other services to query for data or request data changes. Here we can define endpoints handlers for both `request-response` and `async` based types of communication. Examples are shown below.
- `src/migrations` stores all the db-migrations specific to the service, ideally all the migration template files should start with the name of the service - (e.g `notification-01-create-table.ts`) and be placed in `templates` folder
- `src/rest-api` stores all the `tsoa` controllers exposing public REST endpoints

### For functional areas with multiple services the following structure is followed

- `src/core` stores all the core business logic for the all services, usually data retrieval/change operations
- `src/migrations` stores all the db-migrations specific to the service, ideally all the migration template files should start with the name of the service - (e.g `notification-01-create-table.ts`) and be placed in `templates` folder
- `src/service-wrappers` contains the actual services - one folder per service.
  - each service would usually have some service-specific logic which is contained in `core` folder
  - each service can have an `internal-api` exposed (either `request-response` or `async` request endpoints)
  - each service can expose a public `rest-api` which is defined in `rest-api` folder in the shape of `tsoa` annotated controllers
  - each service has its own `Dockerfile` which is used to build the image that will eventually be deployed in aws
  - the bootstrap logic for each service is contained in `service_starter.ts` and invoked from `bootstrap.ts`. The `service_starter.ts` is exported from the package allowing `_local-service-starter` which bootstraps the whole platform (there is a separate section on that)

### Defining request-response type endpoints on the service side

The definition of `request-response` endpoints is common for all services therefore the logic for creating them has been implemented in `setupInternalApi` in the `@abx-utils/async-message-publisher`.
The public (`rest-api`) and private endpoints are both exposed on the same port using the same `express` http connector.
Here is an example of how to create a set of internal endpoints for a service:

```typescript
import { createQueryEndpointHandlers } from './query_endpoints'
import express from 'express'
import { setupInternalApi } from '@abx-utils/internal-api-tools'
import { createChangeEndpointHandlers } from './change_endpoints'
import { User, Account } from '@abx-types/account'

export function bootstrapInternalApi(app: express.Express) {
  setupInternalApi(app, createQueryEndpointHandlers())
}

export function createQueryEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: AccountQueryEndpoints.findAccountById,
      handler: ({ accountId }) => findAccountById(accountId),
    } as InternalRoute<{ accountId: string }, Account | null>,
    {
      path: AccountQueryEndpoints.findUserByAccountId,
      handler: ({ accountId }) => findUserByAccountId(accountId),
    } as InternalRoute<{ accountId: string }, User | null>,
  ]
}
```

### Defining async endpoints on the service side

Async endpoints are ideally suited for data change types of requests and could be implemented
in all services that wish to expose a queue-based interface. Because of that, the mechanism for creating an async queue subscription has been placed in `@abx-utils/async-message-consumer`.

Here is an example of how to create such a consumer:

```typescript
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { consumeQueueMessage } from './queued_message_consumer'

interface RequestBody {
  foo: string
}

const queueUrl = process.env.QUEUE_URL || 'local-redis-topi'

export function bootstrapQueueDrivenApi() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages(queueUrl, consumeQueueMessage)
}

export async function consumeQueueMessage(request: RequestBody) {
  logger.debug(`Consuming message ${JSON.stringify(balanceChangeRequest)}`)

  try {
    // Execute logic here
  } catch (e) {
    // Not catching the exception will break the subscription
    logger.error(`Error encountered while consuming balance change request: ${JSON.stringify(e)}`)
  }
}
```

### Starting all services locally

In order to be able to start and debug all the services locally a `@abx/local-service-starter` service has been implemented in `packages/services`.
It uses the `bootstrap` function for each service to bootstrap it in the same node process which allows for easy debugging (implemented in `services_starter.ts`).
Since a lot of services expose APIs (internal and public) on specific ports, a reverse proxy mechanism(`http-proxy`) has been implemented which delegates the requests to the specific services based on the request route (implemented in `request_handler.ts`).

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
3. Run `npm run run-migrations:dev`
4. Run `npm run start-api-debug`

#### Branches

Branch naming should follow the git-flow branching model. A good overview on this can be found [here](https://danielkummer.github.io/git-flow-cheatsheet/). Our branch names are as follows:

| Branch type | Format                         | Notes                                                                                                                                                             |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| develop     | -                              | Base development branch                                                                                                                                           |
| feature     | /feature/[JIRA ID]-branch-name | Used for developing new features. Almost all new code will reside within a feature branch. When completed, feature branches are merged back into develop          |
| hotfix      | /hotfix/[JIRA ID]-branch-name  | Used for developing hotfixes to the production environment. These changes are merged straight to `master` and then merged back down through to existing branches. |
| support     | /support/[JIRA ID]-branch-name | Used for doing support work that doesn't need to be reintegrated                                                                                                  |

Please always remember to use the JIRA ID in your branches so that other developers will always have visibility over how that work fits into project plans.

#### Object and file naming

Object and file names should be descriptive as to the purpose of the code within it.

| Object type | Object naming pattern   |
| ----------- | ----------------------- |
| Enum        | [Object Name]Enum       |
| Service     | [Object Name]Service    |
| Controller  | [Object Name]Controller |
| Config      | [Object Name]Config     |
| Util        | [Object Name]Util       |
| Type        | [Object Name]Type       |

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

#### CI Pipeline

The CI pipeline utilizes Lerna in order to release only the service where changes have ocurred.

For each change that is pushed to develop branch (on PR merge) the CI flow publishes a new docker image tag for the services that have changed to `ECR`.

**!!!** It has been previously agreed that the `COMMIT_HASH` is not the best candidate for the docker image tag, so in order to be able to more easily link the change to the requirement that it implements the CI flow looks for a JIRA number in the commit message (the logic can be found in `createDockerImageTag` function in `_scripts/travis/travis-build-tag-creation-helpers.sh` ).

### That is why when merging PR it is best if the default commit message is edited and the ticket number is added to the commit message

Each push to develop(e.g. PR merge) triggers integration environment release of the changed services.

In order to carry out deployment of specific services to UAT or any other environment [kbe-service-versions](https://github.com/bullioncapital/kbe-service-versions) repo should be used to promote the new ECR images. (Documentations on how to use and how it works have been added to the repo README)

#### Coding methodology

Functions should be kept succinct and aim to achieve a single purpose. This is to aid in the creation of unit tests and reduce the complexity required in producing tests.

#### Unit testing

All new code must have matching unit tests which adequately cover a range of input scenarios.
