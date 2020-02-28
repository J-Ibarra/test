import { TopUpProviderRequestRetryHandler } from '../TopUpProviderRequestRetryHandler'
import { transactionManager } from '../../__tests__/TopUp.test-utils'

const cardRepository = {
  getDebitCardForAccountWithPessimisticLock: jest.fn(),
} as any

const topUpRequestRepository = {
  getTopUpRequest: jest.fn(),
} as any

const topUpBalanceLimitChecker = {
  getAmountToTopUpBasedOnBalanceLimit: jest.fn(),
} as any

const topUpRequestDispatcher = {
  loadAmountOnCard: jest.fn(),
} as any

const entityManager = {
  transaction: fn => fn(transactionManager),
} as any

const topUpRequestId = 1
const accountId = 'sda0231'
const amount = 15
const debitCard = { id: 1 } as any

describe('TopUpProviderRequestRetryHandler', () => {
  const topUpProviderRequestRetryHandler = new TopUpProviderRequestRetryHandler(
    cardRepository,
    topUpRequestRepository,
    topUpBalanceLimitChecker,
    entityManager,
    topUpRequestDispatcher,
  )

  it('should not call topUpRequestDispatcher.loadAmountOnCard when amountToReserve is 0', async () => {
    jest.spyOn(topUpRequestRepository, 'getTopUpRequest').mockResolvedValue({ id: topUpRequestId } as any)
    jest.spyOn(cardRepository, 'getDebitCardForAccountWithPessimisticLock').mockResolvedValue(debitCard)
    jest.spyOn(topUpBalanceLimitChecker, 'getAmountToTopUpBasedOnBalanceLimit').mockResolvedValue(0)

    await topUpProviderRequestRetryHandler.executeProviderTopUp(topUpRequestId, accountId, amount)

    expect(topUpRequestDispatcher.loadAmountOnCard).toHaveBeenCalledTimes(0)
  })

  it('should call topUpRequestDispatcher.loadAmountOnCard when amountToReserve > 0', async () => {
    const amountToReserve = 10

    jest.spyOn(topUpRequestRepository, 'getTopUpRequest').mockResolvedValue({ id: topUpRequestId } as any)
    jest.spyOn(cardRepository, 'getDebitCardForAccountWithPessimisticLock').mockResolvedValue(debitCard)
    jest.spyOn(topUpBalanceLimitChecker, 'getAmountToTopUpBasedOnBalanceLimit').mockResolvedValue(amountToReserve)

    await topUpProviderRequestRetryHandler.executeProviderTopUp(topUpRequestId, accountId, amount)

    expect(topUpRequestDispatcher.loadAmountOnCard).toHaveBeenCalledWith(
      debitCard,
      amountToReserve,
      topUpRequestId,
      transactionManager,
    )
  })
})
