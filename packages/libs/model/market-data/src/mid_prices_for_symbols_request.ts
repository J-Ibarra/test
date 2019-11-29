/** Defines the request used to retrieve the mid prices for a set of symbols. */
import moment from 'moment'
import { Transaction } from 'sequelize'
import { DBOrder } from './db_order'

export class MidPricesForSymbolsRequest {
  constructor(
    public symbolIds: string[],
    public from = moment()
      .subtract(1, 'days')
      .toDate(),
    public limit?: number,
    public transaction?: Transaction,
    public createdAtOrder?: DBOrder,
  ) {}
}
