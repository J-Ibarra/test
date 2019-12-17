import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { BalanceChangeParams } from '@abx-types/balance'
import { BalanceRetrievalHandler } from '../balance_retrieval_handler'
import { BalanceChangeHandler } from './balance_change_handler'

export class PendingDepositBalanceHandler {
  private logger = Logger.getInstance('pending_deposit_balance_change_handler', 'PendingDepositBalanceHandler')

  constructor(
    private balanceChangeHandler: BalanceChangeHandler = BalanceChangeHandler.getInstance(),
    private balanceRetrievalHandler: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance(),
  ) {}

  /**
   * Increases the pending deposit balance for the user.
   *
   * @param changeParams contains the balance change details
   */
  public createPendingDeposit(changeParams: BalanceChangeParams) {
    return this.balanceChangeHandler.updatePendingDepositBalance({
      ...changeParams,
      amount: changeParams.amount,
    })
  }

  /**
   * Confirm pending withdrawal is called when the user confirms the withdrawal and we have moved the funds,
   * incrementing the available balance with the deposited amount.
   *
   * @param changeParams contains the balance change details
   */
  public async confirmPendingDeposit(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(`Confirming deposit of ${changeParams.amount} for currency ${changeParams.currencyId} and account ${changeParams.accountId}`)
    await this.validatePendingDepositBalance(changeParams, 'Pending Deposit balance is less than the confirmation amount')

    await Promise.all([
      this.balanceChangeHandler.updatePendingDepositBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
    ])
  }

  /**
   * Deny Pending Deposit is used if a deposit is not confirmed after x number of blocks.
   *
   * @param changeParams contains the balance change details
   */
  public async denyPendingDeposit(changeParams: BalanceChangeParams) {
    await this.validatePendingDepositBalance(changeParams, 'Pending deposit balance is less than the denial amount')

    return this.balanceChangeHandler.updatePendingDepositBalance({
      ...changeParams,
      amount: -changeParams.amount,
    })
  }

  private async validatePendingDepositBalance({ currencyId, accountId, amount, t }: BalanceChangeParams, errorMessage: string) {
    const balance = await this.balanceRetrievalHandler.findBalance(currencyId, accountId, t)

    if (amount > balance.pendingDeposit.value!) {
      throw new ValidationError(errorMessage)
    }
  }
}
