import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'

import { recordCustomEvent } from 'newrelic'
import { findBoundaryForCurrency, feeTakenFromBase } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { getFeeRateForAccount } from '../../../../core'
import { OrderMatch } from '@abx-types/order'
import { SymbolPair } from '@abx-types/reference-data'

export interface FeeDetail {
  fee: number
  feeRate: number
}
export abstract class OrderSettlementHandler {
  private logger = Logger.getInstance('transaction/lib/settlement', 'orderSettlementHandler')

  public async calculateFee(orderMatch: OrderMatch, pair: SymbolPair, transaction: Transaction): Promise<FeeDetail> {
    const { minAmount: minimumFee } = await findBoundaryForCurrency(pair.fee.code)
    const feeRate = await getFeeRateForAccount(
      {
        accountId: this.getAccountId(orderMatch),
        symbolId: pair.id,
      },
      transaction,
    )

    const feeTemp = feeTakenFromBase(pair)
      ? new Decimal(orderMatch.amount).times(feeRate!)
      : new Decimal(orderMatch.amount).times(orderMatch.matchPrice).times(feeRate!)

    const fee = feeTemp.equals(0) ? 0 : Decimal.max(feeTemp, minimumFee || 0).toNumber()
    recordCustomEvent('event_order_settlement_calculate_fee', {
      buyOrderId: orderMatch.buyOrderId,
      sellOrderId: orderMatch.sellOrderId,
      symbolId: pair.id,
      amount: orderMatch.amount,
      matchPrice: orderMatch.matchPrice,
      calculatedFee: fee,
    })
    this.logger.debug(
      `CalculateFee: ${JSON.stringify({
        buyOrderId: orderMatch.buyOrderId,
        sellOrderId: orderMatch.sellOrderId,
        symbolId: pair.id,
        amount: orderMatch.amount,
        matchPrice: orderMatch.matchPrice,
        calculatedFee: fee,
      })}`,
    )

    return { fee, feeRate: feeRate! }
  }

  /**
   * The settlement process for a user includes:
   * - releasing(deducting) the funds that had been reserved for the transaction.
   * - transferring the transaction amount to their available balance
   *
   * @param pair the traded symbol
   * @param fee the fee to be paid by the user
   * @param transactionId the transaction ID
   * @param orderMatch contains the order price and amount
   * @param transaction the transaction details
   */
  public async settleOrderMatch(pair: SymbolPair, fee: number, transactionId: number, orderMatch: OrderMatch, transaction: Transaction) {
    await this.releaseReserveBalance(orderMatch, fee, pair, transactionId, transaction)
    await this.updateAvailableBalance(orderMatch, fee, pair, transactionId, transaction)
  }

  /** Concrete implementations for buyer and seller are different, hence the template method. */
  public abstract releaseReserveBalance(orderMatch: OrderMatch, fee: number, pair: SymbolPair, transactionId: number, transaction: Transaction)

  /** Concrete implementations for buyer and seller are different, hence the template method. */
  public abstract updateAvailableBalance(orderMatch: OrderMatch, fee: number, pair: SymbolPair, transactionId: number, transaction: Transaction)

  public abstract getAccountId(orderMatch: OrderMatch): string
}
