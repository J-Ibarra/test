import { Route, Post, Body } from 'tsoa'
import moment from 'moment'
import { e2eTestingEnvironments, getEnvironment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { getCacheClient, getModel, sequelize } from '@abx-utils/db-connection-utils'
import { OrderQueueStatus, OrderValidity, OrderDirection } from '@abx-types/order'
import { findUsersByEmail, createAccount } from '@abx-service-clients/account'
import { AccountSetupOrderDetails } from './model'
import { setupAccountBalances } from '@abx-service-clients/balance'
import { placeOrder } from '@abx-service-clients/order'

export const orderTestAccountEmails = ['Order-user-1@abx.com', 'Order-user-1@abx.com']
const tablesToTruncate = [
  'order',
  'balance_adjustment',
  'stored_reports',
  'monthly_trade_accumulation',
  'ohlc_market_data',
  'depth_mid_price',
  'order_match_transaction',
]

@Route('test-automation')
export class E2eTestingDataSetupController {
  private logger = Logger.getInstance('api', 'E2eTestDataCleanerController')

  @Post('/orders/data-reset')
  public async resetOrderData(): Promise<void> {
    if (e2eTestingEnvironments.includes(getEnvironment())) {
      this.logger.info('Resetting order data.')
      await getCacheClient().flush()
      await getModel<OrderQueueStatus>('orderQueueStatus').update({ processing: false, lastProcessed: new Date() } as any, {
        where: {},
      })
      return this.truncateOrderData()
    }
  }

  Д

  private async truncateOrderData() {
    await sequelize.query(`TRUNCATE ${tablesToTruncate.map(table => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`)

    const accounts = await findUsersByEmail(orderTestAccountEmails)

    if (accounts.length > 0) {
      await sequelize.query(`DELETE FROM trade_transaction where "accountId" in (${accounts.map(({ accountId }) => `"${accountId}"`).join(',')})`)
    }
  }

  @Post('orders/account-setup-scripts')
  public async runAccountSetupScript(@Body() { email, balances, orders }): Promise<void> {
    if (e2eTestingEnvironments.includes(getEnvironment())) {
      this.logger.info(`Setting up account for ${email}`)

      let users = await findUsersByEmail(email.toLocaleLowerCase())
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
