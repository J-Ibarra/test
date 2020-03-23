import { EntityManager } from 'typeorm'

import { TopUpRequestRepository } from '../../src/shared-components/repositories'
import { CardRepository } from '../../src/shared-components/repositories/CardRepository'
import { DebitCard } from '../../src/shared-components/models/card/DebitCard.entity'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { CurrencyCode, DebitCardProvider, KinesisCryptoCurrency } from '../../src/shared-components/models'

describe.skip('integration:TopUpRequestRepository', () => {
  let app
  let cardRepository: CardRepository
  let topUpRequestRepository: TopUpRequestRepository
  let entityManager: EntityManager

  const soldCurrencyAmount = 100
  const orderId = 4432

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture
    topUpRequestRepository = appAndFixture.moduleFixture.get<TopUpRequestRepository>(TopUpRequestRepository)
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
  })

  it('testing incoming top up request repository create', async () => {
    await entityManager.transaction(async manager => {
      const debitCard: DebitCard = await cardRepository.createNewCard({
        accountId: '1',
        provider: DebitCardProvider.contis,
        providerAccountDetails: {} as any,
        currency: CurrencyCode.GBP,
        balance: 0,
        entityManager: manager,
      })

      const topUpRequest = await topUpRequestRepository.createTopUpRequest(
        debitCard,
        orderId,
        soldCurrencyAmount,
        KinesisCryptoCurrency.kag,
        manager,
      )

      expect(topUpRequest.debitCard.id).toEqual(debitCard.id)
      expect(topUpRequest.orderId).toEqual(orderId)
    })
  })
  it('testing top up request repository update', async () => {
    await entityManager.transaction(async manager => {
      const debitCard: DebitCard = await cardRepository.createNewCard({
        accountId: '1',
        provider: DebitCardProvider.contis,
        providerAccountDetails: {} as any,
        currency: CurrencyCode.GBP,
        balance: 10,
        entityManager: manager,
      })

      const { id } = await topUpRequestRepository.createTopUpRequest(
        debitCard,
        orderId,
        soldCurrencyAmount,
        KinesisCryptoCurrency.kag,
        manager,
      )

      const updatedRows = await topUpRequestRepository.updateTopUpRequestByOrderId(orderId, { amountToTopUp: 234 }, manager)

      expect(updatedRows).toEqual([id])
    })
  })

  it('testing top up request repository get', async () => {
    await entityManager.transaction(async manager => {
      const debitCard: DebitCard = await cardRepository.createNewCard({
        accountId: '1',
        provider: DebitCardProvider.contis,
        providerAccountDetails: {} as any,
        currency: CurrencyCode.GBP,
        balance: 0,
        entityManager: manager,
      })

      const created = await topUpRequestRepository.createTopUpRequest(
        debitCard,
        orderId,
        soldCurrencyAmount,
        KinesisCryptoCurrency.kag,
        manager,
      )

      const result = await topUpRequestRepository.getTopUpRequest({
        topUpRequestId: created.id,
        entityManager: manager,
      })

      expect(created.id).toEqual(result.id)
    })
  })

  afterEach(async () => await cleanDatabase())

  afterAll(async () => await tearDown(app.app, app.moduleFixture))
})
