import request from 'supertest'
import { EntityManager } from 'typeorm'
import { setUp, tearDown } from '../utils/before-each.util'
import { ContisEndpointPath, INACTIVE_CARD_STATUS } from '../../src/shared-components/providers'
import { CardRepository } from '../../src/shared-components/repositories'
import { defaultTestUser, cardCurrency } from '../utils/test-data'
import { DebitCard, DebitCardProvider, DebitCardStatus, ContisAccountDetails } from '../../src/shared-components/models'

describe('CardStatusChangeController:integration', () => {
  let app
  let moduleFixture
  let entityManager: EntityManager
  let cardRepository: CardRepository
  const contisCardId = 123456

  describe('setCardAsLostWithReplacement:when all Contis requests pass', () => {
    const newCardId = 2

    beforeAll(async () => {
      const appAndFixture = await setUp({
        contisStubbedEndpoints: new Map([
          [
            ContisEndpointPath.listCards,
            {
              CardResList: [
                {
                  CardID: newCardId,
                  CardStatus: INACTIVE_CARD_STATUS,
                },
                {
                  CardID: contisCardId,
                  CardStatus: 5,
                },
              ],
            },
          ],
        ]),
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
      cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)

      await createDebitCard()
    })

    it('should mark debit card as lost successfully', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/lost')
        .send()
        .expect(200)
        .then(async () => {
          const debitCard = await entityManager.findOne(DebitCard, { accountId: defaultTestUser.accountId })

          expect(debitCard!.status).toEqual(DebitCardStatus.lost)
        })
    })
  })

  describe('setCardAsDamaged:when all Contis requests pass', () => {
    const newCardId = 2
    beforeAll(async () => {
      const appAndFixture = await setUp({
        contisStubbedEndpoints: new Map([
          [
            ContisEndpointPath.listCards,
            {
              CardResList: [
                {
                  CardID: newCardId,
                  CardStatus: INACTIVE_CARD_STATUS,
                },
                {
                  CardID: contisCardId,
                  CardStatus: 5,
                },
              ],
            },
          ],
        ]),
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
      cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)

      await createDebitCard()
    })

    it('should mark debit card as damaged successfully', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/damaged')
        .send()
        .expect(200)
        .then(async () => {
          const debitCard = await entityManager.findOne(DebitCard, { accountId: defaultTestUser.accountId })

          expect(debitCard!.status).toEqual(DebitCardStatus.damaged)
        })
    })
  })

  describe('when contis \'setCardAsLostWithReplacement\' request is required to fail', () => {
    beforeAll(async () => {
      const appAndFixture = await setUp({
        integrationTestsConfig: {
          rejectRequest: new Map([[ContisEndpointPath.setCardAsLostWithReplacement, true]]),
        },
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
      cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)

      await createDebitCard()
    })

    it('should return an error status code', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/lost')
        .send()
        .expect(500)
    })
  })

  describe('when contis \'setCardAsDamaged\' request is required to fail', () => {
    beforeEach(async () => {
      const appAndFixture = await setUp({
        integrationTestsConfig: {
          rejectRequest: new Map([[ContisEndpointPath.setCardAsDamaged, true]]),
        },
      })
      app = appAndFixture.app
      moduleFixture = appAndFixture.moduleFixture
      entityManager = appAndFixture.moduleFixture.get<EntityManager>(EntityManager)
      cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)

      await createDebitCard()
    })

    it('should return an error status code', async () => {
      return request(app.getHttpServer())
        .post('/api/debit-cards/damaged')
        .send()
        .expect(500)
    })
  })

  afterEach(async () => await tearDown(app, moduleFixture))

  const createDebitCard = async () => {
    await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: {
        consumerId: 1,
        cardId: contisCardId,
      } as ContisAccountDetails,
      currency: cardCurrency,
      balance: 0,
      entityManager,
    })
  }
})
