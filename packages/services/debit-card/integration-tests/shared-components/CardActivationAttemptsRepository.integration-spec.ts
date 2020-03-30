import { TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'

import { CardRepository, CardActivationAttemptRepository } from '../../src/shared-components/repositories'
import { setUp, tearDown, cleanDatabase } from '../utils/before-each.util'
import { CurrencyCode, DebitCardProvider } from '../../src/shared-components/models'

describe.skip('integration:CardActivationAttemptsRepository', () => {
  let app: INestApplication
  let fixture: TestingModule
  let cardRepository: CardRepository
  let cardActivationAttemptRepository: CardActivationAttemptRepository

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = appAndFixture.app
    fixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    cardActivationAttemptRepository = appAndFixture.moduleFixture.get<CardActivationAttemptRepository>(
      CardActivationAttemptRepository,
    )
  })

  afterEach(() => cleanDatabase())

  it('should create an attempt record with attempts set to 1 when insertActivationAttemptRecordForCard called', async () => {
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {} as any,
      currency: CurrencyCode.GBP,
      balance: 0,
    })

    const activationAttempt = await cardActivationAttemptRepository.insertActivationAttemptRecordForCard(debitCard)

    expect(activationAttempt.attempts).toEqual(1)
  })

  it('should increment attempts for card when incrementActivationAttemptsForCard called', async () => {
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {} as any,
      currency: CurrencyCode.GBP,
      balance: 0,
    })

    await cardActivationAttemptRepository.insertActivationAttemptRecordForCard(debitCard)
    await cardActivationAttemptRepository.incrementActivationAttemptsForCard(debitCard.id)

    const attemptsRecord = await cardActivationAttemptRepository.getActivationAttemptsForCard(debitCard.id)
    expect(attemptsRecord!.attempts).toEqual(2)
  })

  it('should reset attempts for card when resetAttemptsForCard called', async () => {
    const debitCard = await cardRepository.createNewCard({
      accountId: '123',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {} as any,
      currency: CurrencyCode.GBP,
      balance: 0,
    })

    await cardActivationAttemptRepository.insertActivationAttemptRecordForCard(debitCard)
    await cardActivationAttemptRepository.incrementActivationAttemptsForCard(debitCard.id)

    await cardActivationAttemptRepository.resetAttemptsForCard(debitCard.id)

    const attemptsRecord = await cardActivationAttemptRepository.getActivationAttemptsForCard(debitCard.id)
    expect(attemptsRecord!.attempts).toEqual(1)
  })
  afterAll(async () => await tearDown(app, fixture))
})
