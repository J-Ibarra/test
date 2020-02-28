import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCard, DebitCardProvider, TopUpRequestStatus, KinesisCryptoCurrency } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails, defaultContisStubbedEndpoints } from '../../utils/test-data'
import { CardRepository, TopUpRequestRepository } from '../../../src/shared-components/repositories'
import { BalanceReserveFacadeStub, PlaceOrderFacadeStub, ContisEndpointPath } from '../../../src/shared-components/providers'
import { TopUpExecutor } from '../../../src/app/top-up/TopUpExecutor'

describe('ToUpExecutor:balance-reserve-failure', () => {
  let app
  let moduleFixture
  let topUpExecutor: TopUpExecutor
  let cardRepository: CardRepository
  let topUpRequestRepository: TopUpRequestRepository
  let debitCard: DebitCard
  const currencyColdAmount = 3000
  const orderId = 1
  const orderValue = 60

  beforeAll(async () => {
    const appAndFixture = await setUp({
      integrationTestsConfig: {
        placeOrderStub: new PlaceOrderFacadeStub(Promise.resolve(orderId)),
        balanceReserveFacadeStub: new BalanceReserveFacadeStub(Promise.reject('Unable to reserve top up balance')),
      },
      contisStubbedEndpoints: new Map([
        ...defaultContisStubbedEndpoints,
        [
          ContisEndpointPath.getSpecificAccountBalance,
          {
            Description: 'Success',
            AvailableBalance: 0,
          } as any,
        ],
      ]),
    })
    app = appAndFixture.app
    moduleFixture = appAndFixture.moduleFixture

    cardRepository = appAndFixture.moduleFixture.get<CardRepository>(CardRepository)
    topUpRequestRepository = appAndFixture.moduleFixture.get<TopUpRequestRepository>(TopUpRequestRepository)
    topUpExecutor = appAndFixture.moduleFixture.get<TopUpExecutor>(TopUpExecutor)
  })

  beforeEach(async () => {
    debitCard = await cardRepository.createNewCard({
      accountId: defaultTestUser.accountId,
      provider: DebitCardProvider.contis,
      providerAccountDetails: cardDetails.providerAccountDetails as any,
      currency: cardCurrency,
      balance: 0,
    })
  })

  it('should not execute provider request when balance reserve fails', async () => {
    const { id: topUpRequestId } = await topUpRequestRepository.createTopUpRequest(
      debitCard,
      orderId,
      currencyColdAmount,
      KinesisCryptoCurrency.kag,
    )
    await topUpRequestRepository.updateTopUpRequest(topUpRequestId, {
      amountFilled: currencyColdAmount,
      status: TopUpRequestStatus.orderPlaced,
    })

    await topUpExecutor.executeTopUp(topUpRequestId, defaultTestUser.accountId, orderValue)
    const topUpRequestAfterExecution = await topUpRequestRepository.getTopUpRequest({ topUpRequestId })

    expect(topUpRequestAfterExecution.status).toEqual(TopUpRequestStatus.balanceReserveFailed)
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
