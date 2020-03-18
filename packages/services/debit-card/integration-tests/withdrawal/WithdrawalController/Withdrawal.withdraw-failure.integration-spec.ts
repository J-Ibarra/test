import request from 'supertest'
import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCardProvider } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails } from '../../utils/test-data'
import { CardRepository } from '../../../src/shared-components/repositories'
import { BalanceReserveFacadeStub } from '../../../src/shared-components/providers'

describe('WithdrawalController:withdraw-failure', () => {
  let app
  let moduleFixture
  let cardRepository: CardRepository
  const amount = 100
  const withdrawalRequest = { amount }

  beforeAll(async () => {
    const appAndFixture = await setUp({
      integrationTestsConfig: {
        balanceReserveFacadeStub: new BalanceReserveFacadeStub(
          Promise.resolve(),
          Promise.resolve(),
          Promise.reject('Unable to record card to exchange withdrawal'),
        ),
      },
    })
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture
    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
  })

  beforeEach(async () => {
    await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: cardDetails.providerAccountDetails as any,
      currency: cardCurrency,
      balance: 1000,
    })
  })

  it('should fail when record card to exchange withdrawal fails', async () => {
    return request(app.getHttpServer())
      .post('/api/debit-cards/withdrawals')
      .send(withdrawalRequest)
      .timeout(30_000)
      .expect(400)
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
