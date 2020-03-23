import { TopUpSuccessRecorder } from '../TopUpSuccessRecorder'
import { mockedDebitCard, transactionManager } from '../../__tests__/TopUp.test-utils'
import { TopUpRequestStatus } from '../../../../shared-components/models'

const topUpRequestRepository = {
  updateTopUpRequest: jest.fn(),
} as any

const balanceReserveFacade = {
  confirmTopUpBalance: jest.fn(),
} as any

const debitCardRepository = {
  increaseAvailableBalance: jest.fn(),
} as any

const transactionRepository = {
  createDepositTransaction: jest.fn(),
} as any

const topUpRequestId = 1
const amountReserved = 10
const providerTransactionId = 11

describe('TopUpBalanceReserver', () => {
  let topUpSuccessRecorder: TopUpSuccessRecorder

  beforeEach(() => {
    topUpSuccessRecorder = new TopUpSuccessRecorder(
      topUpRequestRepository,
      balanceReserveFacade,
      debitCardRepository,
      transactionRepository,
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should update request status to complete and increase balance when balance confirm success', async () => {
    await topUpSuccessRecorder.recordTopUpSuccess(
      topUpRequestId,
      mockedDebitCard,
      amountReserved,
      providerTransactionId,
      transactionManager,
    )

    expect(balanceReserveFacade.confirmTopUpBalance).toHaveBeenCalledWith(
      topUpRequestId,
      mockedDebitCard.accountId,
      amountReserved,
      mockedDebitCard.currency,
    )

    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      topUpRequestId,
      { status: TopUpRequestStatus.complete },
      transactionManager,
    )

    expect(debitCardRepository.increaseAvailableBalance).toHaveBeenCalledWith(
      mockedDebitCard.id,
      amountReserved,
      transactionManager,
    )
  })

  it('should update request status to complete and increase balance when balance confirm success', async () => {
    jest.spyOn(balanceReserveFacade, 'confirmTopUpBalance').mockRejectedValue('foo')

    await topUpSuccessRecorder.recordTopUpSuccess(
      topUpRequestId,
      mockedDebitCard,
      amountReserved,
      providerTransactionId,
      transactionManager,
    )

    expect(balanceReserveFacade.confirmTopUpBalance).toHaveBeenCalledWith(
      topUpRequestId,
      mockedDebitCard.accountId,
      amountReserved,
      mockedDebitCard.currency,
    )

    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      topUpRequestId,
      { status: TopUpRequestStatus.balanceConfirmationFailed },
      transactionManager,
    )
  })
})
