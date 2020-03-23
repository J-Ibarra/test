import { EntityManager } from 'typeorm'

import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { DebitCard, ContisAccountDetails, DebitCardStatus } from '../../src/shared-components/models'
import { cardDetails } from '../utils/test-data'
import { QueueGatewayStub, QUEUE_GATEWAY, TEST_CONTIS_QUEUE_URL } from '../../src/shared-components/providers'
import { dbChangeRecorded } from '../utils/waiting-utils'
import { ContisNotificationName } from '../../src/app/contis-webhooks/models'

describe('ContisNotificationQueueProcessor:Hosc_Greylist', () => {
  let app
  let moduleFixture
  let queueGateway: QueueGatewayStub
  let entityManager: EntityManager
  jest.setTimeout(60_000)

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    queueGateway = appAndFixture.moduleFixture.get<QueueGatewayStub>(QUEUE_GATEWAY)
  })

  beforeEach(async () => await entityManager.insert(DebitCard, cardDetails))
  afterEach(async () => await cleanDatabase())

  describe('HoscCheckChangeNotification', () => {
    it('should update card status to hosc_check_failure when status is 04', () => {
      return sendHoscNotificationAndVerifyCardStatus(
        queueGateway,
        entityManager,
        '04',
        DebitCardStatus.hoscCheckFailure,
      )
    })

    it('should update card status to hosc_check_failure when status is 02', () => {
      return sendHoscNotificationAndVerifyCardStatus(
        queueGateway,
        entityManager,
        '02',
        DebitCardStatus.hoscCheckFailure,
      )
    })
  })

  describe('GreylistCheckChangeNotification', () => {
    it('should update card status to greylistCheckFailure when status is 1', () => {
      return sendGreylistNotificationAndVerifyCardStatus(
        queueGateway,
        entityManager,
        1,
        DebitCardStatus.greylistCheckFailure,
      )
    })

    it('should not update card status to hosc_check_failure when status is 0', () => {
      return sendGreylistNotificationAndVerifyCardStatus(queueGateway, entityManager, 0, DebitCardStatus.active)
    })
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})

const sendHoscNotificationAndVerifyCardStatus = async (
  queueGateway: QueueGatewayStub,
  entityManager,
  hoscStatus: string,
  expectedCardStatus: DebitCardStatus,
) => {
  queueGateway.addMessageToQueue(TEST_CONTIS_QUEUE_URL, {
    name: ContisNotificationName.hosc,
    payload: {
      NotificationType: '046',
      HOSCCheckDate: '20161116063343',
      CardHolderId: (cardDetails.providerAccountDetails as ContisAccountDetails).consumerId,
      HOSCStatus: hoscStatus,
    },
  })
  let debitCard: DebitCard

  await dbChangeRecorded(async () => {
    debitCard = await entityManager.findOne(DebitCard, {
      status: expectedCardStatus,
    })

    return !!debitCard
  })

  expect(debitCard!).toBeDefined()
  expect(debitCard!.status).toEqual(expectedCardStatus)
}

const sendGreylistNotificationAndVerifyCardStatus = async (
  queueGateway,
  entityManager,
  greylistNotificationStatus: number,
  expectedCardStatus: DebitCardStatus,
) => {
  queueGateway.addMessageToQueue(TEST_CONTIS_QUEUE_URL, {
    name: ContisNotificationName.greylist,
    payload: {
      NotificationType: '046',
      GreyListCheckDate: '20161116063343',
      CardHolderId: (cardDetails.providerAccountDetails as ContisAccountDetails).consumerId,
      IsGreyAreaPostcode: greylistNotificationStatus,
    },
  })
  let debitCard: DebitCard

  await dbChangeRecorded(async () => {
    debitCard = await entityManager.findOne(DebitCard, {
      status: expectedCardStatus,
    })

    return !!debitCard
  })

  expect(debitCard!).toBeDefined()
  expect(debitCard!.status).toEqual(expectedCardStatus)
}
