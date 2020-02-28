import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCard, DebitCardProvider, TopUpRequestStatus, KinesisCryptoCurrency } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails, defaultContisStubbedEndpoints } from '../../utils/test-data'
import { CardRepository, TopUpRequestRepository } from '../../../src/shared-components/repositories'
import { PlaceOrderFacadeStub, ContisEndpointPath } from '../../../src/shared-components/providers'
import { TopUpExecutor } from '../../../src/app/top-up/TopUpExecutor'

describe('ToUpExecutor:balance-limit-considered-for-amount', () => {
  let app
  let moduleFixture
  let cardRepository: CardRepository
  let topUpExecutor: TopUpExecutor
  let topUpRequestRepository: TopUpRequestRepository
  let debitCard: DebitCard
  const currencyColdAmount = 3
  const orderId = 1
  const orderValue = 60
  const initialBalance = 7950

  beforeAll(async () => {
    const appAndFixture = await setUp({
      integrationTestsConfig: {
        placeOrderStub: new PlaceOrderFacadeStub(Promise.resolve(orderId)),
      },
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
    topUpRequestRepository = appAndFixture.moduleFixture.get<TopUpRequestRepository>(TopUpRequestRepository)
    topUpExecutor = appAndFixture.moduleFixture.get<TopUpExecutor>(TopUpExecutor)
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

  it('should only top up 50 if current balance is 450 and top up amount is 60', async () => {
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

    expect(topUpRequestAfterExecution.amountToTopUp).toEqual(8000 - initialBalance)
  })

  afterEach(async () => await tearDown(app, moduleFixture))
})
