import { INestApplication } from '@nestjs/common'

import { cleanDatabase, setUp } from '../utils/before-each.util'
import { CardRepository } from '../../src/shared-components/repositories'
import { DebitCardStatus } from '../../src/shared-components/models/card/DebitCardStatus.enum'
import { DebitCardProvider, CurrencyCode, ContisAccountDetails } from '../../src/shared-components/models'
import { EntityManager } from 'typeorm'
import { DebitCard } from '../../src/shared-components/models/card/DebitCard.entity'
import { QueueGatewayStub, TEST_CONTIS_QUEUE_URL, QUEUE_GATEWAY } from '../../src/shared-components/providers'
import { ContisNotificationName } from '../../src/app/contis-webhooks/models'
import { dbChangeRecorded } from '../utils/waiting-utils'

describe('integration:ContisNotificationQueueProcessor:StatusChange', () => {
  let app: INestApplication
  let cardRepository: CardRepository
  let queueGateway: QueueGatewayStub
  let entityManager: EntityManager
  jest.setTimeout(60_000)
  const consumerId = 1

  const notification = {
    CardHolderID: consumerId,
    NotificationType: '054',
    OldStatus: '01',
    NewStatus: '07',
    StatusChangeDate: '20180927213756',
  }

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = await appAndFixture.app
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
    queueGateway = appAndFixture.moduleFixture.get<QueueGatewayStub>(QUEUE_GATEWAY)
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it('should update card status on status change notification', async () => {
    await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })

    queueGateway.addMessageToQueue(TEST_CONTIS_QUEUE_URL, {
      name: ContisNotificationName.userStatusChange,
      payload: notification,
    })
    let updatedDebitCard: DebitCard | undefined

    await dbChangeRecorded(async () => {
      updatedDebitCard = await entityManager.findOne(DebitCard, {
        status: DebitCardStatus.declined,
      })

      return !!updatedDebitCard
    })

    expect(updatedDebitCard && updatedDebitCard.status).toEqual(DebitCardStatus.declined)
  })

  afterAll(async () => await app.close())
})
