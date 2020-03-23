import { BalanceReserverRetryHandler } from '../BalanceReserveRetryHandler'

const topUpRequestRepository = {
  find: jest.fn(),
} as any

const topUpExecutor = {
  executeTopUp: jest.fn(),
} as any
const topUpRequestId = 1
const accountId = 'accId'
const amountFilled = 10

describe('BalanceReserveRetryHandler', () => {
  const balanceReserverRetryHandler: BalanceReserverRetryHandler = new BalanceReserverRetryHandler(
    topUpRequestRepository,
    topUpExecutor,
  )

  it('should retry all failed requests', async () => {
    jest.spyOn(topUpRequestRepository, 'find').mockResolvedValue([
      {
        id: topUpRequestId,
        debitCard: {
          accountId,
        },
        amountFilled,
      },
    ])

    await balanceReserverRetryHandler.retryFailedTopUpRequests()

    expect(topUpExecutor.executeTopUp).toHaveBeenCalledWith(topUpRequestId, accountId, amountFilled)
  })
})
