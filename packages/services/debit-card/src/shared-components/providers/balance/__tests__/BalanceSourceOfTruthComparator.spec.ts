import { BalanceSourceOfTruthComparator } from '../BalanceSourceOfTruthComparator'
import { CurrencyCode } from '../../../models'

describe('BalanceSourceOfTruthComparator', () => {
  const cardRepository = {
    updateCardBalance: jest.fn(),
  } as any

  const getAccountBalanceMock = jest.fn()

  const cardProviderFacadeFactory = {
    getCardProvider: () => ({
      getAccountBalance: getAccountBalanceMock,
    }),
  } as any
  let balanceSourceOfTruthComparator: BalanceSourceOfTruthComparator
  const balance = 10
  const debitCard = {
    id: 1,
    balance,
    currency: CurrencyCode.EUR,
  } as any

  beforeEach(() => {
    balanceSourceOfTruthComparator = new BalanceSourceOfTruthComparator(cardProviderFacadeFactory, cardRepository)
  })

  it('syncCardBalanceWithSourceOfTruth should not update balance if balances are equal', async () => {
    getAccountBalanceMock.mockResolvedValue(balance)

    const latestBalance = await balanceSourceOfTruthComparator.syncCardBalanceWithSourceOfTruth(debitCard, {} as any)

    expect(latestBalance).toEqual(balance)
  })

  it('syncCardBalanceWithSourceOfTruth should update balance if balances are not equal', async () => {
    getAccountBalanceMock.mockResolvedValue(balance)

    const latestBalance = await balanceSourceOfTruthComparator.syncCardBalanceWithSourceOfTruth(
      { ...debitCard, balance: 11 },
      {} as any,
    )

    expect(latestBalance).toEqual(balance)
  })
})
