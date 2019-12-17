import { Logger } from '@abx/logging'
import { BalanceChangeParams, BalanceParams, BalanceType, RawBalance } from '@abx-types/balance'
import { BalanceLockParams } from '../../balance_movement_facade'
import { BalanceAdjustmentRepository } from '../../repository/balance_adjustment_repository'
import { BalanceRepository } from '../../repository/balance_repository'

/** The mechanism used to simultaneously update balance and create balance adjustment. */
export class BalanceChangeHandler {
  private static instance: BalanceChangeHandler
  private logger = Logger.getInstance('lib', 'balance_change_handler')

  constructor(
    private balanceRepository: BalanceRepository = BalanceRepository.getInstance(),
    private balanceAdjustmentRepository: BalanceAdjustmentRepository = BalanceAdjustmentRepository.getInstance(),
  ) {}

  public static getInstance(): BalanceChangeHandler {
    if (!this.instance) {
      this.instance = new BalanceChangeHandler()
    }

    return this.instance
  }

  public lockBalancesForAccounts(balanceLockParams: BalanceLockParams): Promise<boolean> {
    return this.balanceRepository.lockBalancesForAccounts(balanceLockParams)
  }

  public updatePendingDepositBalance(changeParams: BalanceChangeParams): Promise<void> {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.pendingDeposit,
    })
  }

  public updatePendingWithdrawalBalance(changeParams: BalanceChangeParams) {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.pendingWithdrawal,
    })
  }

  public updatePendingDebitCardTopUpBalance(changeParams: BalanceChangeParams) {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.pendingDebitCardTopUp,
    })
  }

  public updateAvailableBalance(changeParams: BalanceChangeParams): Promise<void> {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.available,
    })
  }

  public updateReservedBalance(changeParams: BalanceChangeParams) {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.reserved,
    })
  }

  public updatePendingRedemptionBalance(changeParams: BalanceChangeParams) {
    return this.updateOrCreateBalanceWithAdjustment({
      ...changeParams,
      balanceTypeId: BalanceType.pendingRedemption,
    })
  }

  /** Updates the balance for a given account and creates a balance adjustment using the updated balance details. */
  private async updateOrCreateBalanceWithAdjustment({
    accountId,
    currencyId,
    t,
    amount,
    balanceTypeId,
    sourceEventId,
    sourceEventType,
  }: BalanceParams): Promise<void> {
    let balance: RawBalance
    try {
      balance = await this.balanceRepository.updateOrCreateBalance(accountId, currencyId, amount, balanceTypeId, t)
    } catch (error) {
      this.logger.debug(`Error creating/updating balance for accountid: ${accountId}, balancetypeId: ${balanceTypeId}, currency: ${currencyId}`)
      this.logger.debug(`Error Source Event: ${sourceEventType}`)
      throw error
    }

    try {
      await this.balanceAdjustmentRepository.createAdjustment(balance.id!, balance.value!, amount, sourceEventType, sourceEventId, t)
    } catch (error) {
      this.logger.debug(`Error creating balance adjustment for accountid: ${accountId}, balancetypeId: ${balanceTypeId}, currency: ${currencyId}`)
      this.logger.debug(`Error Source Event: ${sourceEventType}`)
      throw error
    }
  }
}
