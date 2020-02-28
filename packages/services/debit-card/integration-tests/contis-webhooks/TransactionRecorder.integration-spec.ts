import { INestApplication } from '@nestjs/common'

import { cleanDatabase, setUp } from '../utils/before-each.util'
import { CardRepository } from '../../src/shared-components/repositories'
import {
  DebitCardProvider,
  CurrencyCode,
  TransactionType,
  Transaction,
  ContisAccountDetails,
} from '../../src/shared-components/models'
import { EntityManager } from 'typeorm'
import { TransactionRequest } from '../../src/app/contis-webhooks/models/TransactionRequest'
import { QueueGatewayStub, TEST_CONTIS_QUEUE_URL, QUEUE_GATEWAY } from '../../src/shared-components/providers'
import { ContisNotificationName } from '../../src/app/contis-webhooks/models'
import { dbChangeRecorded } from '../utils/waiting-utils'

describe('integration:ContisNotificationQueueProcessor:Transaction', () => {
  let app: INestApplication
  let cardRepository: CardRepository
  let queueGateway: QueueGatewayStub
  let entityManager: EntityManager
  jest.setTimeout(60_000)

  const cardId = 12

  const transaction: TransactionRequest = {
    CardID: cardId,
    TransactionType: '021',
    Description: 'Description',
    AuthoriseAmount: 100,
    TransactionID: 12,
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

  it('should record transaction notification from Contis', async () => {
    const savedCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })

    queueGateway.addMessageToQueue(TEST_CONTIS_QUEUE_URL, {
      name: ContisNotificationName.transaction,
      payload: transaction,
    })

    let savedTransaction: Transaction | undefined

    await dbChangeRecorded(async () => {
      savedTransaction = await entityManager.findOne(Transaction, {
        amount: transaction.AuthoriseAmount,
        type: TransactionType.incoming,
        debitCard: savedCard,
      })
      return !!savedTransaction
    })

    expect(savedTransaction!.amount).toEqual(100)
    expect(savedTransaction!.type).toEqual(TransactionType.incoming)
  })

  afterAll(async () => await app.close())
})
