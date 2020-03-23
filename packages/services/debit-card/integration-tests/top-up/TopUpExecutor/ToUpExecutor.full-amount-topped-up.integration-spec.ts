import { setUp, tearDown } from '../../utils/before-each.util'
import { DebitCard, DebitCardProvider, TopUpRequestStatus, KinesisCryptoCurrency } from '../../../src/shared-components/models'
import { defaultTestUser, cardCurrency, cardDetails, defaultContisStubbedEndpoints } from '../../utils/test-data'
import { CardRepository, TopUpRequestRepository } from '../../../src/shared-components/repositories'
import { PlaceOrderFacadeStub, ContisEndpointPath } from '../../../src/shared-components/providers'
import { TopUpExecutor } from '../../../src/app/top-up/TopUpExecutor'

const currencyColdAmount = 3
const orderId = 1
const orderValue = 60

describe('ToUpExecutor:full-order-value-topped-up', () => {
  let app
  let moduleFixture
  let topUpExecutor: TopUpExecutor
  let cardRepository: CardRepository
  let topUpRequestRepository: TopUpRequestRepository
  let debitCard: DebitCard

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

  it('should top up full order value when all requests execute fine', async () => {
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

    expect(topUpRequestAfterExecution.amountToTopUp).toEqual(orderValue)
    expect(topUpRequestAfterExecution.status).toEqual(TopUpRequestStatus.complete)

    const cardWithUpdatedBalance = await cardRepository.findOne(debitCard.id)
    return cardWithUpdatedBalance!.balance === orderValue
  })

  afterAll(async () => await tearDown(app, moduleFixture))
})
