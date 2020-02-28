import { TopUpBalanceLimitChecker } from '../TopUpBalanceLimitChecker'
import { TopUpRequestStatus, CurrencyCode } from '../../../../shared-components/models'

const topUpRequestRepository = {
  updateTopUpRequest: jest.fn(),
} as any

const balanceSourceOfTruthComparator = {
  syncCardBalanceWithSourceOfTruth: jest.fn(),
} as any

const cardConstraintsService = {
  getCardConstraintValue: jest.fn(),
} as any

const balanceLimit = 300
const initialBalance = 100
const topUpRequestId = 1
describe('TopUpBalanceLimitChecker', () => {
  let topUpBalanceLimitChecker: TopUpBalanceLimitChecker

  beforeEach(() => {
    topUpBalanceLimitChecker = new TopUpBalanceLimitChecker(
      topUpRequestRepository,
      balanceSourceOfTruthComparator,
      cardConstraintsService,
    )
  })

  it('should return 0 when balance limit already reached', async () => {
    jest.spyOn(cardConstraintsService, 'getCardConstraintValue').mockResolvedValue({ [CurrencyCode.GBP]: balanceLimit })
    jest.spyOn(balanceSourceOfTruthComparator, 'syncCardBalanceWithSourceOfTruth').mockResolvedValue(balanceLimit)

    const topUpAmount = await topUpBalanceLimitChecker.getAmountToTopUpBasedOnBalanceLimit(
      topUpRequestId,
      50,
      { currency: CurrencyCode.GBP } as any,
      {} as any,
    )

    expect(topUpAmount).toEqual(0)
    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      topUpRequestId,
      { status: TopUpRequestStatus.complete },
      {} as any,
    )
  })

  it('should return full amount when balance + amount < card limit', async () => {
    jest.spyOn(cardConstraintsService, 'getCardConstraintValue').mockResolvedValue({ [CurrencyCode.GBP]: balanceLimit })
    jest.spyOn(balanceSourceOfTruthComparator, 'syncCardBalanceWithSourceOfTruth').mockResolvedValue(initialBalance)

    const topUpAmountRequested = 50
    const topUpAmount = await topUpBalanceLimitChecker.getAmountToTopUpBasedOnBalanceLimit(
      topUpRequestId,
      topUpAmountRequested,
      { currency: CurrencyCode.GBP } as any,
      {} as any,
    )

    expect(topUpAmount).toEqual(topUpAmountRequested)
    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      topUpRequestId,
      { amountToTopUp: topUpAmountRequested },
      {} as any,
    )
  })

  it('should return card limit - balance > card limit', async () => {
    jest.spyOn(cardConstraintsService, 'getCardConstraintValue').mockResolvedValue({ [CurrencyCode.GBP]: balanceLimit })
    jest.spyOn(balanceSourceOfTruthComparator, 'syncCardBalanceWithSourceOfTruth').mockResolvedValue(initialBalance)

    const topUpAmountRequested = 300
    const topUpAmount = await topUpBalanceLimitChecker.getAmountToTopUpBasedOnBalanceLimit(
      topUpRequestId,
      topUpAmountRequested,
      { currency: CurrencyCode.GBP } as any,
      {} as any,
    )

    expect(topUpAmount).toEqual(topUpAmountRequested - initialBalance)
    expect(topUpRequestRepository.updateTopUpRequest).toHaveBeenCalledWith(
      topUpRequestId,
      { amountToTopUp: topUpAmountRequested - initialBalance },
      {} as any,
    )
  })
})
