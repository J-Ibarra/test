import Decimal from 'decimal.js'
import { sumBy } from 'lodash'
import { Transaction } from 'sequelize'
import { Logger } from '@abx/logging'
import { getApiCacheClient } from '@abx/db-connection-utils'
import { calculateRealTimeMidPriceForSymbols } from '@abx-service-clients/market-data'
import { getCurrencyId, getSymbolsForQuoteCurrency } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { SupportedFxPair } from '@abx-types/order'
import { getQuoteFor } from '@abx-utils/fx-rate'
import { Balance, CompleteBalanceDetails, PreferredCurrencyEnrichedBalance } from '@abx-types/balance'
import { BalanceRetrievalHandler } from './service/balance_retrieval_handler'

/**
 * Defines the entry point mechanism for retrieving {@link CompleteBalanceDetails}.
 */
export class BalanceRetrievalFacade {
  private logger = Logger.getInstance('lib', 'BalanceRetrievalFacade')
  private static instance: BalanceRetrievalFacade

  constructor(private balanceRetrievalService: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance()) {}

  public static getInstance(): BalanceRetrievalFacade {
    if (!this.instance) {
      this.instance = new BalanceRetrievalFacade()
    }

    return this.instance
  }

  public async findBalance(currency: CurrencyCode, accountId: string, transaction?: Transaction): Promise<Balance> {
    this.logger.debug(`Retrieving balance for account ${accountId} and currency ${currency}`)

    const currencyId = await getCurrencyId(currency)
    return this.balanceRetrievalService.findBalance(currencyId, accountId, transaction)
  }

  /**
   * Uses {@link BalanceRetrievalHandler} to retrieve all the balances (for all currencies) for a user.
   * The mid prices for each symbol where base = balance currency and to = preferred currency are retrieved
   * and the latest mid price is used to compute the preferred currency amount.
   *
   * @param accountId the account id
   * @returns the {@link CompleteBalanceDetails} for each currency that the account has holdings in
   */
  public async findAllBalancesForAccount(accountId: string): Promise<CompleteBalanceDetails> {
    this.logger.debug(`Retrieving all balances for account ${accountId}`)

    const balances = await this.balanceRetrievalService.findAllBalancesForAccount(accountId)
    // This would fetch the preferred currency for the user once it is added to the user model, hardcoding to USD for now
    const allSymbolsWithPreferredCurrencyAsQuote = await getSymbolsForQuoteCurrency(CurrencyCode.usd)

    const preferredCurrencyQuotePairMidPrices = await calculateRealTimeMidPriceForSymbols(allSymbolsWithPreferredCurrencyAsQuote.map(({ id }) => id))

    const preferredCurrencyEnrichedBalances = await Promise.all(
      balances.map(balance => this.enrichBalanceWithPreferredCurrencyDetails(balance, preferredCurrencyQuotePairMidPrices)),
    )

    const balanceInfo: CompleteBalanceDetails = {
      accountId,
      preferredCurrencyTotal: sumBy(preferredCurrencyEnrichedBalances, 'total.preferredCurrencyAmount'),
      balances: preferredCurrencyEnrichedBalances,
    }

    getApiCacheClient().setCache(`balances-account-${accountId}`, balanceInfo, 10)

    return balanceInfo
  }

  /** Uses the mid price for the {balanceCurrency}/{preferredCurrency} pair to compute the preferred currency amount. */
  private async enrichBalanceWithPreferredCurrencyDetails(
    balance: Balance,
    symbolIdToMidPrices: Map<string, number>,
  ): Promise<PreferredCurrencyEnrichedBalance> {
    const preferredCurrencyForOneBalanceCurrency = await this.computeUsdAmountForOne(balance.currency!, symbolIdToMidPrices)
    const availableBalance = balance.available.value!
    const reservedBalance = balance.reserved.value!
    const pendingDepositBalance = balance.pendingDeposit.value!
    const pendingWithdrawalBalance = balance.pendingWithdrawal.value!
    const pendingRedemptionBalance = balance.pendingRedemption.value!
    const pendingDebitCardTopUpBalance = balance.pendingDebitCardTopUp.value

    this.logger.debug(`Enriching ${balance.currency} for account ${balance.accountId} with preferred currency price`)

    return {
      currency: balance.currency!,
      total: {
        amount: availableBalance + reservedBalance + pendingDepositBalance + pendingWithdrawalBalance,
        preferredCurrencyAmount: new Decimal(availableBalance)
          .plus(reservedBalance)
          .plus(pendingDepositBalance)
          .plus(pendingWithdrawalBalance)
          .times(preferredCurrencyForOneBalanceCurrency)
          .toNumber(),
      },
      available: {
        amount: availableBalance,
        preferredCurrencyAmount: new Decimal(availableBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      reserved: {
        amount: reservedBalance,
        preferredCurrencyAmount: new Decimal(reservedBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      pendingDeposit: {
        amount: pendingDepositBalance,
        preferredCurrencyAmount: new Decimal(pendingDepositBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      pendingWithdrawal: {
        amount: pendingWithdrawalBalance,
        preferredCurrencyAmount: new Decimal(pendingWithdrawalBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      pendingRedemption: {
        amount: pendingRedemptionBalance,
        preferredCurrencyAmount: new Decimal(pendingRedemptionBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      pendingDebitCardTopUp: {
        amount: pendingDebitCardTopUpBalance!,
        preferredCurrencyAmount: new Decimal(pendingRedemptionBalance).times(preferredCurrencyForOneBalanceCurrency).toNumber(),
      },
      displayFormat: balance.displayFormat,
    }
  }

  /**
   * Covers the following scenarios:
   * - for USD no mid-price lookup is required as the preferred currency is hardcoded to USD at present
   * - for EUR we need to get the EUR_USD fx rate
   * - for all other we use the latest (real-time) mid price
   */
  private async computeUsdAmountForOne(balanceCurrency: CurrencyCode, symbolIdToMidPrices: Map<string, number>): Promise<Decimal> {
    if (balanceCurrency === CurrencyCode.usd) {
      return new Decimal(1)
    } else if (balanceCurrency === CurrencyCode.gbp) {
      return getQuoteFor(SupportedFxPair.GBP_USD)
    } else if (balanceCurrency === CurrencyCode.euro) {
      return getQuoteFor(SupportedFxPair.EUR_USD)
    }

    return new Decimal(symbolIdToMidPrices.get(`${balanceCurrency}_USD`)!)
  }
}
