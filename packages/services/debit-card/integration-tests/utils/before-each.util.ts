import { TestingModule, Test } from '@nestjs/testing'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { INestApplication } from '@nestjs/common'
import { EntityManager, getConnection } from 'typeorm'
import { User } from '@abx/ke-auth-lib'

import { AppModule } from '../../src/app/app.module'
import { ContisEndpointPath, ContisClientStub } from '../../src/shared-components/providers/contis-integration'
import { RedisFacade, QueueGatewayStub } from '../../src/shared-components/providers'
import {
  DEBIT_CARD_TABLE,
  CARD_ORDER_REQUEST_TABLE,
  IntegrationTestsConfig,
  TOP_UP_REQUEST_TABLE,
  CARD_ACTIVATION_ATTEMPT_TABLE,
} from '../../src/shared-components/models'
import { defaultTestUser, defaultContisStubbedEndpoints } from './test-data'
import { wireInTestDependencies } from './test-dependency-helper'

interface BeforeEachParams {
  integrationTestsConfig?: IntegrationTestsConfig
  contisStubbedEndpoints?: Map<ContisEndpointPath, any>
  testUser?: User
}

const defaultBeforeEachParams: BeforeEachParams = {
  integrationTestsConfig: {},
  contisStubbedEndpoints: defaultContisStubbedEndpoints,
  testUser: defaultTestUser,
}

let contisStub: ContisClientStub

/**
 * Creates the test fixture, bootstrapping the root {@link AppModule}.
 * Initializes the {@link INestApplication} allowing tests to execute HTTP requests against it.
 */
export const setUp = async ({
  integrationTestsConfig,
  contisStubbedEndpoints,
  testUser,
}: BeforeEachParams = defaultBeforeEachParams): Promise<{
  app: INestApplication
  moduleFixture: TestingModule
  contisClientStub: ContisClientStub
  queueGatewayStub: QueueGatewayStub
}> => {
  const { moduleFixture, contisClientStub, queueGatewayStub } = await wireInTestDependencies(
    await Test.createTestingModule({
      imports: [AppModule],
    }),
    integrationTestsConfig,
    contisStubbedEndpoints,
    testUser,
  )
  contisStub = contisClientStub

  const app = moduleFixture.createNestApplication(new FastifyAdapter())
  await app.init()
  await app
    .getHttpAdapter()
    .getInstance()
    .ready()

  await moduleFixture.get<RedisFacade>(RedisFacade).flush()

  return { app, moduleFixture, contisClientStub, queueGatewayStub }
}

export const tearDown = async (app: INestApplication, fixture: TestingModule) => {
  const entityManager = fixture.get<EntityManager>(EntityManager)
  await entityManager.connection.runMigrations()
  await cleanDatabase()
  await app.close()
}

export const cleanDatabase = async () => {
  const connenction = getConnection()
  await connenction.query(tablesToTruncate.map(table => `DELETE FROM ${table}`).join(';'))

  contisStub.cleanCallRecord()
}

const tablesToTruncate = [TOP_UP_REQUEST_TABLE, CARD_ORDER_REQUEST_TABLE, DEBIT_CARD_TABLE, CARD_ACTIVATION_ATTEMPT_TABLE]
