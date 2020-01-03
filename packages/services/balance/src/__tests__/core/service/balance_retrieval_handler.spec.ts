import { expect } from 'chai'
import sinon from 'sinon'
import * as referenceDataClientOperations from '@abx-service-clients/reference-data'
import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { Balance, BalanceType, EDisplayFormats, RawBalance } from '@abx-types/balance'
import { BalanceRepository, BalanceRetrievalHandler } from '../../../core'

const accountId = 'f3123f'

const balanceRetrievalHandler = new BalanceRetrievalHandler()

describe('BalanceRetrievalHandler', () => {
  let kagCurrency = { id: 1, code: CurrencyCode.kag }
  let kauCurrency = { id: 2, code: CurrencyCode.kau }

  beforeEach(() => {
    sinon.stub(referenceDataClientOperations, 'getCurrencyCode').resolves(CurrencyCode.kag)
    sinon.stub(referenceDataClientOperations, 'findAllCurrencies').resolves([kagCurrency, kauCurrency])
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('findBalance should use BalanceRepository to retrieve all balances for account and currency', async () => {
    const availableBalance = 10
    const reservedBalance = 20
    const pendingWithdrawalBalance = 15
    const pendingDebitCardTopUpBalance = 7
    const pendingDepositBalance = 10
    const pendingRedemptionBalance = 6

    sinon
      .stub(BalanceRepository.prototype, 'findRawBalances')
      .callsFake(() =>
        Promise.resolve([
          createRawBalance(availableBalance, BalanceType.available),
          createRawBalance(reservedBalance, BalanceType.reserved),
          createRawBalance(pendingWithdrawalBalance, BalanceType.pendingWithdrawal),
          createRawBalance(pendingDebitCardTopUpBalance, BalanceType.pendingDebitCardTopUp),
          createRawBalance(pendingDepositBalance, BalanceType.pendingDeposit),
          createRawBalance(pendingRedemptionBalance, BalanceType.pendingRedemption),
        ]),
      )

    const balance = await balanceRetrievalHandler.findBalance(kagCurrency.id, accountId)

    expect(balance).to.eql({
      accountId,
      currencyId: kagCurrency.id,
      currency: kagCurrency.code,
      available: { id: undefined, value: availableBalance },
      reserved: { id: undefined, value: reservedBalance },
      pendingWithdrawal: { id: undefined, value: pendingWithdrawalBalance },
      pendingDebitCardTopUp: { id: undefined, value: pendingDebitCardTopUpBalance },
      pendingRedemption: { id: undefined, value: pendingRedemptionBalance },
      pendingDeposit: { id: undefined, value: pendingDepositBalance },
      displayFormat: EDisplayFormats.decimal,
    } as Balance)
  })

  it('findAllBalancesForAccount should use BalanceRepository to retrieve all balances for account(for all currencies)', async () => {
    const availableBalanceCurrency1 = 10
    const reservedBalanceCurrency1 = 20
    const availableBalanceCurrency2 = 15
    const pendingDebitCardTopUpBalanceCurrency2 = 10
    const reservedBalanceCurrency2 = 10
    const pendingRedemptionBalance = 12

    sinon
      .stub(BalanceRepository.prototype, 'findRawBalances')
      .callsFake(() =>
        Promise.resolve([
          createRawBalance(availableBalanceCurrency1, BalanceType.available, kagCurrency),
          createRawBalance(reservedBalanceCurrency1, BalanceType.reserved, kagCurrency),
          createRawBalance(availableBalanceCurrency2, BalanceType.available, kauCurrency),
          createRawBalance(pendingDebitCardTopUpBalanceCurrency2, BalanceType.pendingDebitCardTopUp, kauCurrency),
          createRawBalance(reservedBalanceCurrency2, BalanceType.reserved, kauCurrency),
          createRawBalance(pendingRedemptionBalance, BalanceType.pendingRedemption, kauCurrency),
        ]),
      )

    const balances = await balanceRetrievalHandler.findAllBalancesForAccount(accountId)

    const currency1Balance = balances.find(({ currencyId }) => kagCurrency.id === currencyId)
    expect(currency1Balance).to.eql({
      accountId,
      currencyId: kagCurrency.id,
      currency: kagCurrency.code,
      available: { id: undefined, value: availableBalanceCurrency1 },
      reserved: { id: undefined, value: reservedBalanceCurrency1 },
      pendingWithdrawal: { id: undefined, value: 0 },
      pendingDebitCardTopUp: { id: undefined, value: 0 },
      pendingDeposit: { id: undefined, value: 0 },
      pendingRedemption: { id: undefined, value: 0 },
      displayFormat: EDisplayFormats.decimal,
    })

    const currency2Balance = balances.find(({ currencyId }) => currencyId === kauCurrency.id)
    expect(currency2Balance).to.eql({
      accountId,
      currencyId: kauCurrency.id,
      currency: kauCurrency.code,
      available: { id: undefined, value: availableBalanceCurrency2 },
      reserved: { id: undefined, value: reservedBalanceCurrency2 },
      pendingDebitCardTopUp: { id: undefined, value: pendingDebitCardTopUpBalanceCurrency2 },
      pendingWithdrawal: { id: undefined, value: 0 },
      pendingDeposit: { id: undefined, value: 0 },
      pendingRedemption: { id: undefined, value: pendingRedemptionBalance },
      displayFormat: EDisplayFormats.decimal,
    })

    const kinesisCurrencyIds = [kagCurrency.id, kauCurrency.id]
    const nonKinesisBalances = balances.filter(({ currencyId }) => !kinesisCurrencyIds.includes(currencyId))

    nonKinesisBalances.forEach(theBalance => {
      expect(theBalance.available.value).to.equal(0)
    })
  })

  it('combineCurrenciesWithRawBalances returns correct mapped balances', () => {
    const rawBalancesOfKagAndKau: RawBalance[] = [
      createRawBalance(10, BalanceType.available, kagCurrency),
      createRawBalance(0, BalanceType.reserved, kagCurrency),
      createRawBalance(3, BalanceType.available, kauCurrency),
      createRawBalance(0, BalanceType.reserved, kauCurrency),
      createRawBalance(5, BalanceType.pendingRedemption, kauCurrency),
    ]

    const combinedRawBalancesOfKagAndKau = balanceRetrievalHandler.combineCurrenciesWithRawBalances(rawBalancesOfKagAndKau)

    const rawBalancesOfKag = combinedRawBalancesOfKagAndKau.get(kagCurrency.id)

    const kagAvailableBalance = rawBalancesOfKag!.get(BalanceType.available)
    expect(kagAvailableBalance!.value).to.equal(10)

    const rawBalancesOfKau = combinedRawBalancesOfKagAndKau.get(kauCurrency.id)

    const kauAvailableBalance = rawBalancesOfKau!.get(BalanceType.available)
    expect(kauAvailableBalance!.value).to.equal(3)

    const kauPendingRedemptionBalance = rawBalancesOfKau!.get(BalanceType.pendingRedemption)
    expect(kauPendingRedemptionBalance!.value).to.equal(5)
  })

  it('getDisplayFormatForBalance returns correct Format for currencies', () => {
    const kvtDisplay = balanceRetrievalHandler.getDisplayFormatForBalance(CurrencyCode.kvt)
    const usdDisplay = balanceRetrievalHandler.getDisplayFormatForBalance(CurrencyCode.usd)
    const undefinedDisplay = balanceRetrievalHandler.getDisplayFormatForBalance()

    expect(kvtDisplay).to.eql(EDisplayFormats.wholeNumber)
    expect(usdDisplay).to.eql(EDisplayFormats.decimal)
    expect(undefinedDisplay).to.eql(EDisplayFormats.decimal)
  })

  const createRawBalance = (balance, type: BalanceType, currencyDetails: Currency = kagCurrency) => ({
    accountId,
    currencyId: currencyDetails.id,
    balanceTypeId: type,
    value: balance,
  })
})
