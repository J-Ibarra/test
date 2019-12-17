import { ValidationError } from '@abx-types/error'
import { Balance, BalanceChangeParams } from '@abx-types/balance'
import { BalanceRetrievalHandler } from '../balance_retrieval_handler'
import { BalanceChangeHandler } from './balance_change_handler'

export class PendingWithdrawalBalanceHandler {
  constructor(
    private balanceChangeHandler: BalanceChangeHandler = BalanceChangeHandler.getInstance(),
    private balanceRetrievalHandler: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance(),
  ) {}

  /**
   * Create Pending withdrawal is used when a user requests a withdrawal,
   * moving requested amount from available to pending withdrawal balance.
   *
   * @param changeParams contains the balance change details
   */
  public async createPendingWithdrawal(changeParams: BalanceChangeParams): Promise<void> {
    await this.validateBalance(
      changeParams,
      ({ available }) => changeParams.amount > available.value!,
      'The withdrawal request is larger than the available balance',
    )

    await Promise.all([
      this.balanceChangeHandler.updatePendingWithdrawalBalance({
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
   * Confirm pending withdrawal is called when the user confirms the withdrawal
   * and we have moved the funds, deducting the withdrawn amount from the pending withdrawal balance.
   *
   * @param changeParams contains the balance change details
   */
  public async confirmPendingWithdrawal(changeParams: BalanceChangeParams) {
    await this.validateBalance(
      changeParams,
      ({ pendingWithdrawal }) => changeParams.amount > pendingWithdrawal.value!,
      'Pending Withdrawal balance is less than the confirmation amount',
    )

    return this.balanceChangeHandler.updatePendingWithdrawalBalance({
      ...changeParams,
      amount: -changeParams.amount,
    })
  }

  /**
   * Deny Pending Withdrawal is used if the user cancels the withdrawal,
   * returning the initially requested amount to be withdrawn into the available balance.
   *
   * @param changeParams contains the balance change details
   */
  public async denyPendingWithdrawal(changeParams: BalanceChangeParams) {
    await this.validateBalance(
      changeParams,
      ({ pendingWithdrawal }) => changeParams.amount > pendingWithdrawal.value!,
      'Pending withdrawal balance is less than the denial amount',
    )

    await Promise.all([
      this.balanceChangeHandler.updatePendingWithdrawalBalance({
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
