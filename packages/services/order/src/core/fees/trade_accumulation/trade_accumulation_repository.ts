import { Transaction } from 'sequelize'

import { sequelize, getModel } from '@abx-utils/db-connection-utils'
import { MonthlyTradeAccumulationInstance } from '../../model/monthly_trade_accumulation'
import { extractMonthAndYearFromDate } from './utils'

/** Handles {@link MonthlyTradeAccumulation} db operations. */
export class TradeAccumulationRepository {
  private static instance: TradeAccumulationRepository

  /** Creates and returns a {@link TradeAccumulationRepository} instance, if one already created returns that. */
  public static getInstance(): TradeAccumulationRepository {
    if (!this.instance) {
      this.instance = new TradeAccumulationRepository()
    }

    return this.instance
  }

  public async updateTradeAmount(accountId: string, tradeValue: number, month: number, year: number, transaction?: Transaction): Promise<void> {
    return sequelize.query(
      `
        insert into monthly_trade_accumulation ("accountId", month, year, total, "createdAt", "updatedAt")
        values (
          :accountId,
          :month,
          :year,
          :total,
          :createdAt,
          :updatedAt
        )
        on conflict on constraint trade_vol_per_acc_per_month
        do
          update
            set "total" = monthly_trade_accumulation."total" + :total, "updatedAt" = :updatedAt;
      `,
      {
        transaction,
        replacements: {
          accountId,
          month,
          year,
          total: tradeValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )
  }

  public async getMonthlyTradeAccumulationForAccount(accountId: string, date: Date, transaction?: Transaction): Promise<number> {
    const { month, year } = extractMonthAndYearFromDate(date)
    const monthlyAccumulationInstance = await getModel<MonthlyTradeAccumulationInstance>('monthlyTradeAccumulation').findOne({
      where: { accountId, month, year },
      transaction,
    })

    return !!monthlyAccumulationInstance ? monthlyAccumulationInstance.get().total : 0
  }
}
