import request from 'supertest'

import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCard, DebitCardProvider, CardConstraintName } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails, defaultContisStubbedEndpoints } from '../../utils/test-data'
import { CardRepository } from '../../../src/shared-components/repositories'
import { CardConstraintService, ContisEndpointPath } from '../../../src/shared-components/providers'

describe('WithdrawalController:withdraw-success', () => {
  let app
  let moduleFixture
  let cardRepository: CardRepository
  let debitCard: DebitCard
  const amountToWithdraw = 100
  const initialBalance = 1000
  const withdrawalRequest = { amount: amountToWithdraw }
  let withdrawalFee

  beforeAll(async () => {
    const appAndFixture = await setUp({
      contisStubbedEndpoints: new Map([
        ...defaultContisStubbedEndpoints,
        [
          ContisEndpointPath.getSpecificAccountBalance,
          {
            Description: 'Success',
            AvailableBalance: initialBalance * 100,
          } as any,
        ],
      ]),
    })
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    const cardConstraintService = appAndFixture.moduleFixture.get<CardConstraintService>(CardConstraintService)
    withdrawalFee = await cardConstraintService.getCardConstraintValue(CardConstraintName.withdrawalFee)
  })

  beforeEach(async () => {
    debitCard = await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: cardDetails.providerAccountDetails as any,
      currency: cardCurrency,
      balance: initialBalance,
    })
  })

  it('should complete the withdrawal workflow', async () => {
    return request(app.getHttpServer())
      .post('/api/debit-cards/withdrawals')
      .send(withdrawalRequest)
      .expect(201)
      .then(async () => {
        const debitCardAfterWithdrawal = await cardRepository.findOne(debitCard.id)

        const expectedAmountAfterWithdrawAndFee = initialBalance - amountToWithdraw - withdrawalFee
        expect(debitCardAfterWithdrawal!.balance).toEqual(expectedAmountAfterWithdrawAndFee)
      })
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
