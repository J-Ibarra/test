import { TopUpRequestDispatcher } from '../TopUpRequestDispatcher'
import { mockedDebitCard } from '../../__tests__/TopUp.test-utils'
import { DebitCardProvider, TopUpRequestStatus } from '../../../../shared-components/models'

const cardProviderFacade = {
  loadBalance: jest.fn(),
  getProvider: () => DebitCardProvider.contis,
}

const topUpRequestRepository = {
  updateTopUpRequest: jest.fn(),
} as any

const topUpSuccessRecorder = {
  recordTopUpSuccess: jest.fn(),
} as any

const amountReserved = 50
const topUpRequestId = 1
describe('TopUpRequestDispatcher', () => {
  let topUpRequestDispatcher: TopUpRequestDispatcher

  beforeEach(() => {
    const cardProviderFacadeFactory = {
      getCardProvider: () => cardProviderFacade,
    } as any

    topUpRequestDispatcher = new TopUpRequestDispatcher(topUpRequestRepository, cardProviderFacadeFactory, topUpSuccessRecorder)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('loadAmountOnCard should record top up success when balance was successfully loaded', async () => {
    const transactionId = 1
    jest.spyOn(cardProviderFacade, 'loadBalance').mockResolvedValue({ transactionId })

    await topUpRequestDispatcher.loadAmountOnCard(mockedDebitCard, amountReserved, topUpRequestId, {} as any)

    expect(topUpSuccessRecorder.recordTopUpSuccess).toBeCalledWith(
      topUpRequestId,
      mockedDebitCard,
      amountReserved,
      transactionId,
      {} as any,
    )
    expect(cardProviderFacade.loadBalance).toBeCalledWith(topUpRequestId, mockedDebitCard.providerAccountDetails, amountReserved)
  })

  it('loadAmountOnCard should set status to providerRequestExecutionFailed when balance reserve fails', async () => {
    jest.spyOn(cardProviderFacade, 'loadBalance').mockRejectedValue('Unable to load balance')
    jest.spyOn(topUpRequestRepository, 'updateTopUpRequest')

    await topUpRequestDispatcher.loadAmountOnCard(mockedDebitCard, amountReserved, topUpRequestId, {} as any)

    expect(topUpRequestRepository.updateTopUpRequest).toBeCalledWith(
      topUpRequestId,
      { status: TopUpRequestStatus.providerRequestExecutionFailed },
      {} as any,
    )
    expect(topUpSuccessRecorder.recordTopUpSuccess).toHaveBeenCalledTimes(0)
  })
})
