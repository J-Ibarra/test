import { TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import moment from 'moment'

import { CardRepository } from '../../src/shared-components/repositories/CardRepository'
import { DebitCard } from '../../src/shared-components/models/card/DebitCard.entity'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { CurrencyCode, DebitCardProvider, ContisAccountDetails } from '../../src/shared-components/models'
import { DebitCardStatus } from '../../src/shared-components/models/card/DebitCardStatus.enum'

describe('integration:DebitCardRepository', () => {
  let app: INestApplication
  let fixture: TestingModule
  let cardRepository: CardRepository
  let entityManager: EntityManager

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    fixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
  })

  afterEach(() => cleanDatabase())

  it('testing debit card repository create', async () => {
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {} as any,
      currency: CurrencyCode.GBP,
      balance: 0,
    })
    expect(debitCard.accountId).toEqual('123')
  })

  it('testing debit card repository update', async () => {
    const details = {
      consumerId: 12,
    } as ContisAccountDetails
    const debitCard: DebitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: details,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })
    expect(debitCard.status).toEqual(DebitCardStatus.underReview)

    await cardRepository.updateCardStatus(details, DebitCardStatus.active, entityManager)

    const updatedCard = await entityManager.findOne(DebitCard, debitCard.id)

    expect(updatedCard && updatedCard.status).toEqual(DebitCardStatus.active)
  })

  it('testing debit card repository get card by accountId', async () => {
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {} as any,
      currency: CurrencyCode.GBP,
      balance: 0,
    })
    const retrievedCard = await cardRepository.getDebitCardForAccount('123')
    expect(retrievedCard.accountId).toEqual(debitCard.accountId)
  })

  it('testing debit card repository get card by provider details card id', async () => {
    const details = { consumerId: 1, cardId: 12 } as ContisAccountDetails
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: details,
      currency: CurrencyCode.GBP,
      balance: 0,
    })
    const retrievedCard = await cardRepository.getDebitCardByProviderDetails({
      cardId: 12,
    } as ContisAccountDetails)
    expect(retrievedCard.accountId).toEqual(debitCard.accountId)
  })

  it('testing debit card repository update provider details', async () => {
    const oldDetails = { consumerId: 1, cardId: 11 } as ContisAccountDetails
    const newDetails = { consumerId: 11, cardId: 22 } as ContisAccountDetails

    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: oldDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
    })
    await cardRepository.updateCardWhereProviderDetailsMatch(debitCard.providerAccountDetails, {
      providerAccountDetails: newDetails,
    })
    const retrievedCard = await cardRepository.getDebitCardForAccount('123')
    expect(retrievedCard.providerAccountDetails).toEqual(newDetails)
  })

  describe('updateStatusForDebitCardsCreatedBefore', () => {
    const cardDetails = { consumerId: 1, cardId: 11 } as ContisAccountDetails

    beforeEach(async () => {
      await cardRepository.createNewCard({
        accountId: '123',
        provider: DebitCardProvider.contis,
        providerAccountDetails: cardDetails,
        currency: CurrencyCode.GBP,
        balance: 0,
      })
    })

    it('should update status when updated at before the input date', async () => {
      const updatedRows = await cardRepository.updateStatusForDebitCardsCreatedBefore(
        DebitCardStatus.lockedOut,
        DebitCardStatus.underReview,
        moment()
          .add(10, 'minutes')
          .toDate(),
      )

      expect(updatedRows).toEqual(1)
    })

    it('should not update status when update after input date', async () => {
      const updatedRows = await cardRepository.updateStatusForDebitCardsCreatedBefore(
        DebitCardStatus.lockedOut,
        DebitCardStatus.underReview,
        moment()
          .subtract(10, 'minutes')
          .toDate(),
      )

      expect(updatedRows).toEqual(0)
    })
  })

  afterAll(async () => await tearDown(app, fixture))
})
