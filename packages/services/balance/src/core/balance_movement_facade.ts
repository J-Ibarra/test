import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { BalanceChangeParams } from '@abx-types/balance'
import { PendingDepositBalanceHandler, PendingWithdrawalBalanceHandler, ReserveBalanceHandler } from './service/balance-movement'
import { BalanceChangeHandler } from './service/balance-movement'
import { DebitCardTopUpChangeHandler } from './service/balance-movement/debit_card_top_up_change_handler'
import { PendingRedemptionBalanceHandler } from './service/balance-movement/pending_redemption_balanca_change_handler'

export interface BalanceLockParams {
  accountIds: string[]
  currencyIds: number[]
  transaction: Transaction
  operationDescription?: string
  /**
   * The timeout in milliseconds after which control will be
   * returned to the caller if lock cannot be obtained.
   */
  timeout?: number
}

/**
 *  A facade encapsulating all the balance movement operations.
 * The actual balance movement logic is delegated to the balance handler for the specific balance type (reserved/available/pendingDeposit/pendingWithdrawal)
 */
export class BalanceMovementFacade {
  private logger = Logger.getInstance('lib', 'BalanceMovementFacade')
  private static instance: BalanceMovementFacade

  constructor(
    private reserveBalanceHandler: ReserveBalanceHandler = new ReserveBalanceHandler(),
    private pendingDepositBalanceHandler: PendingDepositBalanceHandler = new PendingDepositBalanceHandler(),
    private pendingWithdrawalBalanceHandler: PendingWithdrawalBalanceHandler = new PendingWithdrawalBalanceHandler(),
    private pendingRedemptionBalanceHandler: PendingRedemptionBalanceHandler = new PendingRedemptionBalanceHandler(),
    private balanceChangeHandler: BalanceChangeHandler = new BalanceChangeHandler(),
    private debitCardTopUpChangeHandler: DebitCardTopUpChangeHandler = new DebitCardTopUpChangeHandler(),
  ) {}

  public static getInstance(): BalanceMovementFacade {
    if (!this.instance) {
      this.instance = new BalanceMovementFacade()
    }

    return this.instance
  }

  public lockBalancesForAccounts(balanceLockParams: BalanceLockParams): Promise<boolean> {
    this.logger.debug(
      `Locking balances for accounts ${JSON.stringify(balanceLockParams.accountIds)}. ${balanceLockParams.operationDescription || ''}`,
    )
    return this.balanceChangeHandler.lockBalancesForAccounts(balanceLockParams)
  }

  /**
   * Create Reserve is used when placing an order of a known amount.
   * Balances are moved from the available balance to the reserve balance
   *
   * @param changeParams contains the balance change details
   */
  public createReserve(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(`Creating reserve of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`)
    return this.reserveBalanceHandler.createReserve(changeParams)
  }

  /**
   * Release Reserve is used when an order is cancelled.
   * Balances are moved from the reserve balance to the available balance
   *
   * @param changeParams contains the balance change details
   */
  public releaseReserve(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(`Releasing reserve of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`)
    return this.reserveBalanceHandler.releaseReserve(changeParams)
  }

  /**
   * Finalise Reserve is used when an order is matched and the balances moved during settlement.
   * Since we use the highest fee rate when initially calculating the reserve amount,
   * we can have a scenario where the fee rate is lower when the settlement runs so we need
   * to rebate the over-reserved amount (i.e. initialReserve - amount).
   *
   * @param changeParams contains the balance change details
   */
  public finaliseReserve(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(`Finalising reserve of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`)
    return this.reserveBalanceHandler.finaliseReserve(changeParams)
  }

  /**
   * Update Available is used when either matching a market order, or when a receiving
   * balances from a trade. A negative number is possible for the amount, in the event
   * of a sell market order.
   *
   * @param changeParams contains the balance change details
   */
  public updateAvailable(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Updating available balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.balanceChangeHandler.updateAvailableBalance(changeParams)
  }

  /**
   * This operation is invoked when an admin request for redemption is being created.
   * It moves the requested redemption amount from available to pendingRedemption balance,
   * making sure the account cannot transact/trade with that amount.
   *
   * @param changeParams contains the balance change details
   */
  public createPendingRedemption(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Increasing pendingRedemption balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingRedemptionBalanceHandler.createPendingRedemption(changeParams)
  }

  /**
   * Confirm pending redemption is called when an admin confirms the redemption for a given redemption request.
   *
   * @param changeParams contains the balance change details
   */
  public confirmPendingRedemption(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Processing pending redemption confirmation for amount ${changeParams.amount} for account ${changeParams.accountId} and currency ${
        changeParams.currencyId
      }`,
    )
    return this.pendingRedemptionBalanceHandler.confirmPendingRedemption(changeParams)
  }

  /**
   * Deny pending redemption is an admin operation invoked if a given redemption cannot be completed.
   *
   * @param changeParams contains the balance change details
   */
  public denyPendingRedemption(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Denying pending redemption of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingRedemptionBalanceHandler.denyPendingRedemption(changeParams)
  }

  /**
   * Increases the pending deposit balance for the user.
   *
   * @param changeParams contains the balance change details
   */
  public createPendingDeposit(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Increasing pending deposit balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingDepositBalanceHandler.createPendingDeposit(changeParams)
  }

  /**
   * Confirm pending is called when the user deposit has been completed,
   * incrementing the available balance with the deposited amount.
   *
   * @param changeParams contains the balance change details
   */
  public confirmPendingDeposit(changeParams: BalanceChangeParams): Promise<void> {
    this.logger.debug(
      `Confirming pending deposit of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingDepositBalanceHandler.confirmPendingDeposit(changeParams)
  }

  /**
   * Deny Pending Deposit is used if a deposit is not confirmed after x number of blocks.
   *
   * @param changeParams contains the balance change details
   */
  public denyPendingDeposit(changeParams: BalanceChangeParams) {
    this.logger.debug(`Denying deposit of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`)
    return this.pendingDepositBalanceHandler.denyPendingDeposit(changeParams)
  }

  /**
   * Create Pending withdrawal is used when a user requests a withdrawal,
   * moving requested amount from available to pending withdrawal balance.
   *
   * @param changeParams contains the balance change details
   */
  public createPendingWithdrawal(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Increasing pending withdrawal balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingWithdrawalBalanceHandler.createPendingWithdrawal(changeParams)
  }

  public createPendingWithdrawalFee(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Increasing pending withdrawal fee balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${
        changeParams.currencyId
      }`,
    )
    return this.pendingWithdrawalBalanceHandler.createPendingWithdrawal(changeParams)
  }

  /**
   * Confirm pending withdrawal is called when the user confirms the withdrawal
   * and we have moved the funds, deducting the withdrawn amount from the pending withdrawal balance.
   *
   * @param changeParams contains the balance change details
   */
  public confirmPendingWithdrawal(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Confirming pending withdrawal of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingWithdrawalBalanceHandler.confirmPendingWithdrawal(changeParams)
  }

  /**
   * Deny Pending Withdrawal is used if the user cancels the withdrawal,
   * returning the initially requested amount to be withdrawn into the available balance.
   *
   * @param changeParams contains the balance change details
   */
  public denyPendingWithdrawal(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Denying pending withdrawal of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.pendingWithdrawalBalanceHandler.denyPendingWithdrawal(changeParams)
  }

  /**
   * Called before a debit card top up is performed to reserve funds
   * for the top up (actual -> pending debit card top up).
   */
  public createPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Increasing pending debit card top up balance by ${changeParams.amount} for account ${changeParams.accountId} and currency ${
        changeParams.currencyId
      }`,
    )
    return this.debitCardTopUpChangeHandler.createPendingDebitCardTopUp(changeParams)
  }

  /**
   * Confirm pending debit card top up is called when a debit card top up has been successfully completed
   * and we have moved the funds, deducting the top up amount from the pending top up balance.
   *
   * @param changeParams contains the balance change details
   */
  public confirmPendingDebitCardTopUp(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Confirming pending debit card top up of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.debitCardTopUpChangeHandler.confirmDebitCardTopUpBalance(changeParams)
  }

  /**
   * Confirm pending debit card top up is called when a debit card top up has been successfully completed
   * and we have moved the funds, deducting the top up amount from the pending top up balance.
   *
   * @param changeParams contains the balance change details
   */
  public recordDebitCardToExchangeWithdrawal(changeParams: BalanceChangeParams) {
    this.logger.debug(
      `Recording  pending debit card top up of ${changeParams.amount} for account ${changeParams.accountId} and currency ${changeParams.currencyId}`,
    )
    return this.balanceChangeHandler.updateAvailableBalance(changeParams)
  }
}
