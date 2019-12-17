import { ValidationError } from '@abx-types/error'
import { Balance, BalanceChangeParams } from '@abx-types/balance'
import { BalanceRetrievalHandler } from '../balance_retrieval_handler'
import { BalanceChangeHandler } from './balance_change_handler'

export class PendingRedemptionBalanceHandler {
  constructor(
    private balanceChangeHandler: BalanceChangeHandler = BalanceChangeHandler.getInstance(),
    private balanceRetrievalHandler: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance(),
  ) {}

  /**
   * This operation is invoked when an admin request for redemption is being created.
   * It moves the requested redemption amount from available to pendingRedemption balance,
   * making sure the account cannot transact/trade with that amount.
   *
   * @param changeParams contains the balance change details
   */
  public async createPendingRedemption(changeParams: BalanceChangeParams) {
    await this.validateBalance(
      changeParams,
      ({ available }) => changeParams.amount > available.value!,
      'The redemption request is larger than the available balance',
    )

    await Promise.all([
      this.balanceChangeHandler.updatePendingRedemptionBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
    ])
  }

  /**
   * Confirm pending redemption is called when an admin confirms the redemption for a given redemption request.
   *
   * @param changeParams contains the balance change details
   */
  public async confirmPendingRedemption(changeParams: BalanceChangeParams): Promise<void> {
    await this.validateBalance(
      changeParams,
      ({ pendingRedemption }) => changeParams.amount > pendingRedemption.value!,
      'The redemption confirmation is larger than the previously reserved redemption',
    )

    await this.balanceChangeHandler.updatePendingRedemptionBalance({
      ...changeParams,
      amount: -changeParams.amount,
    })
  }

  /**
   * Deny pending redemption is an admin operation invoked if a given redemption cannot be completed.
   *
   * @param changeParams contains the balance change details
   */
  public async denyPendingRedemption(changeParams: BalanceChangeParams) {
    await Promise.all([
      this.balanceChangeHandler.updatePendingRedemptionBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
    ])
  }

  private async validateBalance({ currencyId, accountId, t }: BalanceChangeParams, isInvalid: (balance: Balance) => boolean, errorMessage: string) {
    const balance = await this.balanceRetrievalHandler.findBalance(currencyId, accountId, t)

    if (isInvalid(balance)) {
      throw new ValidationError(errorMessage)
    }
  }
}
