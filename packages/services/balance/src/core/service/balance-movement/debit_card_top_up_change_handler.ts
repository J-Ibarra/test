import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { BalanceChangeParams, BalanceType } from '@abx-types/balance'
import { BalanceRepository } from '../../repository/balance_repository'
import { BalanceRetrievalHandler } from '../balance_retrieval_handler'
import { BalanceChangeHandler } from './balance_change_handler'

export class DebitCardTopUpChangeHandler {
  private logger = Logger.getInstance('debit_card_top_up_change_handler', 'DebitCardTopUpChangeHandler')

  constructor(
    private balanceChangeHandler: BalanceChangeHandler = BalanceChangeHandler.getInstance(),
    private balanceRetrievalHandler: BalanceRetrievalHandler = BalanceRetrievalHandler.getInstance(),
    private balanceRepository: BalanceRepository = BalanceRepository.getInstance(),
  ) {}

  public async createPendingDebitCardTopUp(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Creating pending debit card top up of ${changeParams.amount} for currency ${changeParams.currencyId} and account ${changeParams.accountId}`,
    )
    await this.balanceRepository.lockBalancesForAccounts({
      accountIds: [changeParams.accountId],
      currencyIds: [changeParams.currencyId],
      transaction: changeParams.t!,
    })

    await this.validateAvailableBalance(changeParams, 'Available balance is less than debit card top up amount')

    await Promise.all([
      this.balanceChangeHandler.updateAvailableBalance({
        ...changeParams,
        amount: -changeParams.amount,
      }),
      this.balanceChangeHandler.updatePendingDebitCardTopUpBalance({
        ...changeParams,
        amount: changeParams.amount,
      }),
    ])
  }

  public async confirmDebitCardTopUpBalance(changeParams: BalanceChangeParams) {
    await this.validatePendingTopUpBalance(changeParams, 'Pending debit card top up balance is less than the release amount')

    return this.balanceChangeHandler.updatePendingDebitCardTopUpBalance({
      ...changeParams,
      amount: -changeParams.amount,
    })
  }

  private async validateAvailableBalance({ currencyId, accountId, amount, t }: BalanceChangeParams, errorMessage: string) {
    const balance = await this.balanceRepository.findRawBalances({ accountId, currencyId, transaction: t })
    const availableBalance = balance.find(({ balanceTypeId }) => balanceTypeId === BalanceType.available) || { value: 0 }

    if (amount > availableBalance.value!) {
      throw new ValidationError(errorMessage)
    }
  }

  private async validatePendingTopUpBalance({ currencyId, accountId, amount, t }: BalanceChangeParams, errorMessage: string) {
    const balance = await this.balanceRetrievalHandler.findBalance(currencyId, accountId, t)

    if (amount > balance.pendingDebitCardTopUp.value!) {
      throw new ValidationError(errorMessage)
    }
  }
}
