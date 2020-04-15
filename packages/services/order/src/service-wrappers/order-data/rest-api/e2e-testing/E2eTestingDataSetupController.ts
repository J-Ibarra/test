import { Route, Post, Body, Hidden } from 'tsoa'
import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { getCacheClient, getModel, sequelize } from '@abx-utils/db-connection-utils'
import { OrderQueueStatus, OrderValidity, OrderDirection } from '@abx-types/order'
import { findUsersByEmail, createAccount } from '@abx-service-clients/account'
import { AccountSetupOrderDetails } from './model'
import { setupAccountBalances } from '@abx-service-clients/balance'
import { placeOrder } from '@abx-service-clients/order'
import { findTradeTransactions } from '../../../../core'
import { depthPrefix } from '../../../order-matcher/core/order-match-handling/depth/redis'

export const orderTestAccountEmails = ['order-user-1@abx.com', 'order-user-2@abx.com']

@Route('test-automation')
export class E2eTestingDataSetupController {
  private logger = Logger.getInstance('api', 'E2eTestDataCleanerController')

  @Post('/orders/data-reset')
  @Hidden()
  public async resetOrderData(@Body() { email, symbolId }): Promise<void> {
    this.logger.info(`Resetting order data for ${email} and ${symbolId}`)
    await getCacheClient().delete(`${depthPrefix}${symbolId}`)
    await getModel<OrderQueueStatus>('orderQueueStatus').update({ processing: false, lastProcessed: new Date() } as any, {
      where: {
        symbolId,
      },
    })
    await this.truncateOrderData(email, symbolId)
    this.logger.info(`Successfully cleaned order data for ${email} and ${symbolId}`)
  }

  private async truncateOrderData(email: string, symbolId: string) {
    try {
      const [user] = await findUsersByEmail([email.toLowerCase()])

      const { rows: tradeTransactions } = await findTradeTransactions({ where: { accountId: user.accountId } })
      await sequelize.query(`DELETE FROM "monthly_trade_accumulation" where "accountId"='${user.accountId}'`)

      if (tradeTransactions.length > 0) {
        await sequelize.query(
          `DELETE FROM "trade_transaction" where "id" in (${tradeTransactions
            .map(({ id, counterTradeTransactionId }) => `'${id}', '${counterTradeTransactionId}'`)
            .join(',')})`,
        )
      }

      await sequelize.query(`DELETE FROM "order_match_transaction" WHERE "sellAccountId"='${user.accountId}' OR "buyAccountId"='${user.accountId}'`)
      this.logger.info(`Delete order match transactions for ${email} and ${symbolId}`)

      await sequelize.query(`DELETE FROM "balance_adjustment" WHERE "balanceId" in (SELECT id from "balance" where "accountId"='${user.accountId}')`)
      this.logger.info(`Delete order match transactions for ${email} and ${symbolId}`)

      await sequelize.query(`DELETE FROM "order" where "accountId"='${user.accountId}'`)
      this.logger.info(`Delete orders for ${email} and ${symbolId}`)
    } catch (e) {
      console.log(e)
    }
  }

  @Post('/orders/account-setup-scripts')
  @Hidden()
  public async runAccountSetupScript(@Body() { email, balances, orders }): Promise<void> {
    this.logger.info(`Setting up account for ${email}`)

    let users = await findUsersByEmail([email.toLocaleLowerCase()])
    let user
    if (!users || users.length === 0) {
      const account = await createAccount(email, email)
      user = account.users![0]
    } else {
      user = users[0]
    }

    await setupAccountBalances(user.accountId, balances)
    this.logger.info(`Balances set up for ${email}`)

    await this.createOrdersForAccount(user.accountId, OrderDirection.buy, orders.buy)
    await this.createOrdersForAccount(user.accountId, OrderDirection.sell, orders.sell)

    this.logger.info(`${orders.sell.length} sell orders and ${orders.buy.length} buy orders created for ${email}`)
  }

  private async createOrdersForAccount(accountId: string, direction: OrderDirection, orders: AccountSetupOrderDetails[]) {
    for (const order of orders) {
      await new Promise(resolve => setTimeout(() => resolve(), 100))

      await placeOrder({
        accountId,
        direction,
        validity: OrderValidity.GTD,
        expiryDate: moment()
          .add(10, 'hour')
          .toDate(),
        ...order,
      })
    }
  }
}
