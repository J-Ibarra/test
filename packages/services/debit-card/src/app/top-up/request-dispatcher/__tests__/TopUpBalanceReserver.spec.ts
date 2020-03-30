import { TopUpBalanceReserver } from '../TopUpBalanceReserver'
import { mockedTopUpRequest, accountId, mockedDebitCard, transactionManager } from '../../__tests__/TopUp.test-utils'
import { TopUpRequestStatus } from '../../../../shared-components/models'

const topUpRequestRepository = {
  updateTopUpRequest: jest.fn(),
  updateTopUpRequestByOrderId: jest.fn(),
} as any

const balanceReserveFacade = {
  reserveTopUpBalance: jest.fn(),
} as any

const topUpBalanceLimitChecker = {
  getAmountToTopUpBasedOnBalanceLimit: jest.fn(),
} as any

describe('TopUpBalanceReserver', () => {
  let topUpBalanceReserver: TopUpBalanceReserver

  beforeEach(() => {
    topUpBalanceReserver = new TopUpBalanceReserver(topUpRequestRepository, balanceReserveFacade, topUpBalanceLimitChecker)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should update top up status to balanceReserveFailed if balance reserve call fails', async () => {
    const topUpAmount = 100
    jest.spyOn(topUpBalanceLimitChecker, 'getAmountToTopUpBasedOnBalanceLimit').mockResolvedValue(topUpAmount)
    jest.spyOn(balanceReserveFacade, 'reserveTopUpBalance').mockRejectedValue('Unable to reserve')

    await topUpBalanceReserver.reserveAllowedAmount(mockedTopUpRequest as any, mockedDebitCard, topUpAmount, transactionManager)

    expect(balanceReserveFacade.reserveTopUpBalance).toHaveBeenCalledWith(
      mockedTopUpRequest.id,
      accountId,
      topUpAmount,
      mockedDebitCard.currency,
    )

    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      mockedTopUpRequest.id,
      { status: TopUpRequestStatus.balanceReserveFailed },
      transactionManager,
    )
  })

  it('should return amount reserved up when balance reserve success', async () => {
    const amountToBeReserved = 50
    jest.spyOn(topUpBalanceLimitChecker, 'getAmountToTopUpBasedOnBalanceLimit').mockResolvedValue(amountToBeReserved)

    const { amountReserved } = await topUpBalanceReserver.reserveAllowedAmount(
      mockedTopUpRequest as any,
      mockedDebitCard,
      100,
      transactionManager,
    )

    expect(amountReserved).toEqual(amountToBeReserved)
    expect(balanceReserveFacade.reserveTopUpBalance).toHaveBeenCalledWith(
      mockedTopUpRequest.id,
      accountId,
      amountToBeReserved,
      mockedDebitCard.currency,
    )

    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledTimes(0)
  })
})
