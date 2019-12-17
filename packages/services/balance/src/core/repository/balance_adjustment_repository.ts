import Decimal from 'decimal.js'

import { Transaction } from 'sequelize'
import { getModel } from '@abx/db-connection-utils'
import { BalanceAdjustment, BalanceType, SourceEventType } from '@abx-types/balance'
import { BalanceRepository } from './balance_repository'

const balanceRepository = BalanceRepository.getInstance()

export class BalanceAdjustmentRepository {
  private static instance: BalanceAdjustmentRepository

  public static getInstance(): BalanceAdjustmentRepository {
    if (!this.instance) {
      this.instance = new BalanceAdjustmentRepository()
    }

    return this.instance
  }

  public async createAdjustment(
    balanceId: number,
    balance: number,
    delta: number,
    sourceEventType: SourceEventType,
    sourceEventId: number,
    transaction?: Transaction,
  ): Promise<BalanceAdjustment> {
    return getModel<BalanceAdjustment>('balanceAdjustment')
      .create(
        {
          balanceId,
          sourceEventType,
          sourceEventId,
          value: balance,
          delta,
        },
        { transaction },
      )
      .then(instance => instance.get())
  }

  public async getBalanceAdjustmentsForBalance(balanceId: number, t?: Transaction): Promise<BalanceAdjustment[]> {
    const adjustmentInstances = await getModel<BalanceAdjustment>('balanceAdjustment').findAll({
      where: { balanceId },
      transaction: t,
    })

    return adjustmentInstances.map(adjustment => adjustment.get())
  }

  public async getBalanceAdjustmentForBalanceAndOrder(balanceId: number, orderId: number, t?: Transaction): Promise<BalanceAdjustment | null> {
    const balanceAdjustmentInstance = await getModel<BalanceAdjustment>('balanceAdjustment').findOne({
      where: { balanceId, sourceEventType: 'order' as SourceEventType, sourceEventId: orderId },
      transaction: t,
    })

    return !!balanceAdjustmentInstance ? balanceAdjustmentInstance.get() : null
  }

  public async getBalanceAdjustmentsForBalanceAndTradeTransactions(
    balanceId: number,
    tradeTransactionIds: number[],
    t?: Transaction,
  ): Promise<BalanceAdjustment[]> {
    const balanceAdjustmentInstances = await getModel<BalanceAdjustment>('balanceAdjustment').findAll({
      where: { balanceId, sourceEventType: [SourceEventType.orderMatchRelease, SourceEventType.orderMatch], sourceEventId: tradeTransactionIds },
      transaction: t,
    })

    return balanceAdjustmentInstances.map(adjustment => adjustment.get())
  }

  public async retrieveTotalOrderValueReceivedByAccount(
    accountId: string,
    currencyId: number,
    orderCounterTradeTransactionIds: number[],
    transaction: Transaction,
  ): Promise<number> {
    const rawBalances = await balanceRepository.findRawBalances({ accountId, currencyId })
    const balanceForOrderAvailableCurrency = rawBalances.find(({ balanceTypeId }) => balanceTypeId === BalanceType.available)

    if (!balanceForOrderAvailableCurrency) {
      return 0
    }

    const balanceAdjustmentsForTradeTransactions = await this.getBalanceAdjustmentsForBalanceAndTradeTransactions(
      balanceForOrderAvailableCurrency!.id!,
      orderCounterTradeTransactionIds,
      transaction,
    )

    return balanceAdjustmentsForTradeTransactions.reduce((acc, { delta }) => new Decimal(acc).add(Math.abs(delta)).toNumber(), 0)
  }
}
