import { EntityManager } from 'typeorm'

import { TransactionRepository } from '../../src/shared-components/repositories/TransactionRepository'
import { CardRepository } from '../../src/shared-components/repositories/CardRepository'
import { DebitCard } from '../../src/shared-components/models/card/DebitCard.entity'
import { setUp, tearDown } from '../utils/before-each.util'
import { CurrencyCode, DebitCardProvider, TransactionType } from '../../src/shared-components/models'

describe('integration:TransactionRepository', () => {
  let app
  let cardRepository: CardRepository
  let transactionRepository: TransactionRepository
  let entityManager: EntityManager

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture
    transactionRepository = appAndFixture.moduleFixture.get<TransactionRepository>(TransactionRepository)
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
  })

  it('testing incoming transaction repository create', async () => {
    await entityManager.transaction(async manager => {
      const debitCard: DebitCard = await cardRepository.createNewCard({
        accountId: '1',
        provider: DebitCardProvider.contis,
        providerAccountDetails: {} as any,
        currency: CurrencyCode.GBP,
        balance: 0,
        entityManager: manager,
      })

      const record = await transactionRepository.recordTransaction(
        {
          debitCard,
          type: TransactionType.incoming,
          description: 'some description',
          amount: 100,
          providerTransactionIdentifier: 10,
        },
        manager,
      )

      expect(record.debitCard!.id).toEqual(debitCard.id)
      expect(record.amount).toEqual(100)
    })
  })

  it('should create a withdrawal transaction', async () => {
    await entityManager.transaction(async manager => {
      const debitCard: DebitCard = await cardRepository.createNewCard({
        accountId: '1',
        provider: DebitCardProvider.contis,
        providerAccountDetails: {} as any,
        currency: CurrencyCode.GBP,
        balance: 0,
        entityManager: manager,
      })
      const amount = 100
      const fee = 5

      const record = await transactionRepository.createWithdrawalTransaction(debitCard, amount, fee, 10, manager)

      expect(record.debitCard!.id).toEqual(debitCard.id)
      expect(record.amount).toEqual(100)
    })
  })

  afterAll(async () => await tearDown(app.app, app.moduleFixture))
})
