import Decimal from 'decimal.js'
import { findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { RuntimeError, ValidationError } from '@abx-types/error'
import { getCurrencyCode } from '@abx-service-clients/reference-data'
import { Balance, BalanceChangeParams, BalanceType } from '@abx-types/balance'
import { BalanceRetrievalHandler } from '../balance_retrieval_handler'
import { BalanceChangeHandler } from './balance_change_handler'
import { SymbolPairStateFilter } from '@abx-types/reference-data'

export class ReserveBalanceHandler {
  constructor(
    private balanceChangeHandler: BalanceChangeHandler = BalanceChangeHandler.getInstance(),
    private balanceRetrievalHandler: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance(),
  ) {}

  /**
   * Create Reserve is used when placing an order of a known amount.
   * Balances are moved from the available balance to the reserve balance
   *
   * @param changeParams contains the balance change details
   */
  public async createReserve(changeParams: BalanceChangeParams): Promise<void> {
    await this.validateBalance(
      changeParams,
      ({ available }) => changeParams.amount > available.value!,
      `Available balance is less than the reserve value. createReserveAmount: ${changeParams.amount} `,
      BalanceType.available,
    )

    await Promise.all([
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
      this.balanceChangeHandler.updateReservedBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
    ])
  }

  /**
   * Release Reserve is used when an order is cancelled.
   * Balances are moved from the reserve balance to the available balance
   *
   * @param changeParams contains the balance change details
   */
  public async releaseReserve(changeParams: BalanceChangeParams): Promise<void> {
    await this.validateBalance(
      changeParams,
      ({ reserved }) => changeParams.amount > reserved.value!,
      `Reserved balance is less than the release amount. releaseReserveAmount: ${changeParams.amount} `,
      BalanceType.reserved,
    )

    await Promise.all([
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
      this.balanceChangeHandler.updateReservedBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
    ])
  }

  /**
   * Finalise Reserve is used when an order is matched and the balances moved during settlement.
   * Since we use the highest fee rate when initially calculating the reserve amount,
   * we can have a scenario where the fee rate is lower when the settlement runs so we need
   * to rebate the over-reserved amount (i.e. initialReserve - amount).
   *
   * @param changeParams contains the balance change details
   */
  public async finaliseReserve(changeParams: BalanceChangeParams): Promise<void> {
    const { currencyId, initialReserve, amount } = changeParams
    const currencyCode = await getCurrencyCode(currencyId, SymbolPairStateFilter.all)
    const { maxDecimals } = await findBoundaryForCurrency(currencyCode!)

    if (amount > initialReserve!) {
      throw new RuntimeError(
        `Release amount is bigger than the initial reserve. Trade amount ${amount} and reserve: ${initialReserve} and transaction ${changeParams.sourceEventId}`,
      )
    }

    await this.validateBalance(
      changeParams,
      ({ reserved }) => initialReserve! > reserved.value!,
      `Reserved balance is less than the calculated initial reserve. initialReserve: ${initialReserve} `,
      BalanceType.reserved,
    )

    const rebateAmount = new Decimal(initialReserve!).minus(amount).toDP(maxDecimals, Decimal.ROUND_DOWN).toNumber()

    await Promise.all([
      this.balanceChangeHandler.updateAvailableBalance({ ...changeParams, amount: rebateAmount }),
      this.balanceChangeHandler.updateReservedBalance({ ...changeParams, amount: -initialReserve! }),
    ])
  }

  private async validateBalance(
    { currencyId, accountId, t }: BalanceChangeParams,
    isInvalid: (balance: Balance) => boolean,
    errorMessage: string,
    balanceToCheck: BalanceType,
  ) {
    const balance = await this.balanceRetrievalHandler.findBalance(currencyId, accountId, t)

    if (isInvalid(balance)) {
      throw new ValidationError(
        `${errorMessage}. db reserved balance: ${balance ? balance[BalanceType[balanceToCheck]].value : "balance reserve isn't found"}`,
      )
    }
  }
}
