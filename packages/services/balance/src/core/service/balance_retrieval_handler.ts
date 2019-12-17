import { get } from 'lodash'
import { Transaction } from 'sequelize'
import { getCurrencyCode, findAllCurrencies } from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { EDisplayFormats, Balance, BalanceType, RawBalance } from '@abx-types/balance'
import { BalanceRepository } from '../repository/balance_repository'

export class BalanceRetrievalHandler {
  private static instance: BalanceRetrievalHandler

  constructor(private repository: BalanceRepository = BalanceRepository.getInstance()) {}

  public static getInstance(): BalanceRetrievalHandler {
    if (!this.instance) {
      this.instance = new BalanceRetrievalHandler()
    }

    return this.instance
  }

  /**
   * Retrieves a merged view of the balances for all balance types for a given account and currency.
   *
   * @param currencyId the currency id
   * @param accountId the account ID
   * @param transaction the parent transaction to use, if any
   */
  public async findBalance(currencyId: number, accountId: string, transaction?: Transaction): Promise<Balance> {
    const balanceTypeToBalance = (
      await this.repository.findRawBalances({
        accountId,
        currencyId,
        transaction,
      })
    ).reduce((typeToBalance, balance) => typeToBalance.set(balance.balanceTypeId, balance), new Map<BalanceType, RawBalance>())

    const currencyCode = await getCurrencyCode(currencyId)

    return this.transformRawBalances(accountId, currencyId, balanceTypeToBalance, currencyCode!)
  }

  /**
   * Retrieves raw data of balance for a given account and currency
   * @param currencyId - CurrencyCode ID
   * @param accountId - Account ID
   * @param transaction - The parent transaction to use, if any
   */
  public async findRawBalances(accountId: string, currencyId?: number, transaction?: Transaction): Promise<RawBalance[]> {
    return this.repository.findRawBalances({
      accountId,
      currencyId,
      transaction,
    })
  }

  /**
   * Retrieves account balances for all currencies where the account has holdings.
   *
   * @param accountId the account ID to retrieve the balances for
   * @returns all balances, one {@link Balance} per currency
   */
  public async findAllBalancesForAccount(accountId: string): Promise<Balance[]> {
    // get all the available currencies for trade
    const currenciesAvailableForTrade = await findAllCurrencies()

    const allBalancesForAccount = await this.repository.findRawBalances({
      accountId,
      includeCurrencyDetails: true,
    })

    // get account balances that exists in the db
    const currencyToAccountBalances = this.combineCurrenciesWithRawBalances(allBalancesForAccount)

    return currenciesAvailableForTrade.map(mainCurrency => {
      // check to see if we have an existing balance in the db
      const balanceExists: any = Array.from(currencyToAccountBalances).find(([currencyId]) => currencyId === mainCurrency.id)

      if (balanceExists) {
        // if the balance exists in the db return the Balance Object
        return this.transformRawBalances(accountId, balanceExists[0], balanceExists[1], mainCurrency.code)
      }

      // if it doesn't exist in the db we will create a Balance Object with 0 balance
      return this.transformRawBalances(accountId, mainCurrency.id, new Map(), mainCurrency.code)
    })
  }

  private transformRawBalances(accountId: string, currencyId: number, rawBalances: Map<BalanceType, RawBalance>, currency: CurrencyCode): Balance {
    const available = rawBalances.get(BalanceType.available)
    const reserved = rawBalances.get(BalanceType.reserved)
    const pendingDeposit = rawBalances.get(BalanceType.pendingDeposit)
    const pendingWithdrawal = rawBalances.get(BalanceType.pendingWithdrawal)
    const pendingRedemption = rawBalances.get(BalanceType.pendingRedemption)
    const pendingDebitCardTopUp = rawBalances.get(BalanceType.pendingDebitCardTopUp)

    const displayFormat = this.getDisplayFormatForBalance(currency)

    return {
      accountId,
      currencyId,
      currency,
      available: { id: get(available, 'id'), value: get(available, 'value', 0) },
      reserved: { id: get(reserved, 'id'), value: get(reserved, 'value', 0) },
      pendingDeposit: {
        id: get(pendingDeposit, 'id'),
        value: get(pendingDeposit, 'value', 0),
      },
      pendingWithdrawal: {
        id: get(pendingWithdrawal, 'id'),
        value: get(pendingWithdrawal, 'value', 0),
      },
      pendingRedemption: {
        id: get(pendingRedemption, 'id'),
        value: get(pendingRedemption, 'value', 0),
      },
      pendingDebitCardTopUp: {
        id: get(pendingDebitCardTopUp, 'id'),
        value: get(pendingDebitCardTopUp, 'value', 0),
      },
      displayFormat,
    } as Balance
  }

  /**
   * A function that adds the raw balance with its' associated currency
   * @param rawBalances
   */
  public combineCurrenciesWithRawBalances(rawBalances: RawBalance[]) {
    return rawBalances.reduce((currencyToBalances, balance) => {
      if (currencyToBalances.has(balance.currencyId)) {
        currencyToBalances.get(balance.currencyId)!.set(balance.balanceTypeId, balance)
      } else {
        currencyToBalances.set(
          balance.currencyId,
          new Map<BalanceType, RawBalance>([[balance.balanceTypeId, balance]]),
        )
      }
      return currencyToBalances
    }, new Map<number, Map<BalanceType, RawBalance>>())
  }

  public getDisplayFormatForBalance(currency: CurrencyCode): EDisplayFormats {
    return currency === CurrencyCode.kvt ? EDisplayFormats.wholeNumber : EDisplayFormats.decimal
  }
}
