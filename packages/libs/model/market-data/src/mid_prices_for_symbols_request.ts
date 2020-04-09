/** Defines the request used to retrieve the mid prices for a set of symbols. */
import moment from 'moment'
import { Transaction } from 'sequelize'
import { DBOrder } from './db_order'

interface ConstructorArgs {
  symbolIds: string[]
  from: Date
  limit?: number
  transaction?: Transaction
  createdAtOrder?: DBOrder
}

export class MidPricesForSymbolsRequest {
  constructor(
    public symbolIds: string[],
    public from = moment().subtract(1, 'days').toDate(),
    public limit?: number,
    public transaction?: Transaction,
    public createdAtOrder?: DBOrder,
  ) {}

  static createRequest({ symbolIds, from, limit, transaction, createdAtOrder }: ConstructorArgs) {
    return new MidPricesForSymbolsRequest(symbolIds, from, limit, transaction, createdAtOrder)
  }
}
