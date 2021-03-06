import moment from 'moment'
import { Transaction } from 'sequelize'
import { DBOrder } from './db_order'

export class MidPricesForSymbolRequest {
  constructor(
    public symbolId: string,
    public from = moment()
      .subtract(1, 'days')
      .toDate(),
    public limit?: number,
    public transaction?: Transaction,
    public createdAtOrder?: DBOrder,
  ) {}

  public static forSymbolAndLimit(symbolId: string, limit: number, createdAtOrder: DBOrder): MidPricesForSymbolRequest {
    return new MidPricesForSymbolRequest(symbolId, undefined, limit, undefined, createdAtOrder)
  }
}
