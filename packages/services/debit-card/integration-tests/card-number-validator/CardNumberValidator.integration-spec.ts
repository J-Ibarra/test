import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { EntityManager } from 'typeorm'

import { cleanDatabase, setUp, tearDown } from '../utils/before-each.util'
import { CardRepository, CardActivationAttemptRepository } from '../../src/shared-components/repositories'
import { DebitCardProvider, CurrencyCode, DebitCard, ContisAccountDetails } from '../../src/shared-components/models'
import { DebitCardStatus } from '../../src/shared-components/models/card/DebitCardStatus.enum'
import { ContisClientStub, ContisEndpointPath } from '../../src/shared-components/providers'

describe('integration:CardNumberValidator', () => {
  let app: INestApplication
  let moduleFixture
  let contisClientStub: ContisClientStub
  let cardRepository: CardRepository
  let cardActivationAttemptRepository: CardActivationAttemptRepository
  let entityManager: EntityManager
  const cardNumberValidatorRequest = {
    lastFourDigits: '6789',
  }

  beforeAll(async () => {
    const appAndFixture = await setUp()
    app = await appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture
    contisClientStub = appAndFixture.contisClientStub

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    cardActivationAttemptRepository = appAndFixture.moduleFixture.get<CardActivationAttemptRepository>(
      CardActivationAttemptRepository,
    )
    entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it('api/debit-cards/number/validation (POST) should return 200 for valid card', async () => {
    const savedCard = await cardRepository.createNewCard({
      accountId: '12',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId: 123456,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })

    expect(savedCard.status).toEqual(DebitCardStatus.underReview)

    return request(app.getHttpServer())
      .post('/api/debit-cards/number/validation')
      .send(cardNumberValidatorRequest)
      .expect(200)
      .expect({ valid: true, card: { currency: 'GBP', status: 'active', balance: 0 } })
      .then(async () => {
        const updatedCard = await entityManager.findOne(DebitCard, savedCard.id)
        expect(updatedCard!.status).toEqual(DebitCardStatus.active)

        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.activateCard)).toEqual(1)
        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.validateLastFourDigits)).toEqual(1)
      })
  })

  it('api/debit-cards/number/validation (POST) should activate card ', async () => {
    const savedCard = await cardRepository.createNewCard({
      accountId: '12',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId: 123456,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })
    await cardRepository.updateCardStatus(savedCard.providerAccountDetails, DebitCardStatus.lost)

    expect(savedCard.status).toEqual(DebitCardStatus.underReview)

    return request(app.getHttpServer())
      .post('/api/debit-cards/number/validation')
      .send(cardNumberValidatorRequest)
      .expect(200)
      .expect({ valid: true, card: { balance: 0, currency: CurrencyCode.GBP, status: DebitCardStatus.active } })
      .then(async () => {
        const updatedCard = await entityManager.findOne(DebitCard, savedCard.id)

        expect(updatedCard!.status).toEqual(DebitCardStatus.active)
        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.activateCard)).toEqual(1)
        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.validateLastFourDigits)).toEqual(1)
      })
  })

  it('api/debit-cards/number/validation (POST) should not attempt card validation when daily attempts reached', async () => {
    const savedCard = await cardRepository.createNewCard({
      accountId: '12',
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId: 123456,
      } as ContisAccountDetails,
      currency: CurrencyCode.GBP,
      balance: 0,
      entityManager,
    })
    await cardActivationAttemptRepository.insertActivationAttemptRecordForCard(savedCard)

    for (let i = 0; i < 10; i++) {
      await cardActivationAttemptRepository.incrementActivationAttemptsForCard(savedCard.id)
    }

    expect(savedCard.status).toEqual(DebitCardStatus.underReview)

    return request(app.getHttpServer())
      .post('/api/debit-cards/number/validation')
      .send(cardNumberValidatorRequest)
      .expect(200)
      .then(async ({ body }) => {
        const updatedCard = await entityManager.findOne(DebitCard, savedCard.id)

        expect(body.valid).toBeFalsy()
        expect(body.activationAttemptValidationFailure.allowedAttempts).toEqual(10)

        expect(updatedCard!.status).toEqual(DebitCardStatus.underReview)
        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.activateCard)).toEqual(undefined)
        expect(contisClientStub.getNumberOfCallsForEndpoint(ContisEndpointPath.validateLastFourDigits)).toEqual(undefined)
      })
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
