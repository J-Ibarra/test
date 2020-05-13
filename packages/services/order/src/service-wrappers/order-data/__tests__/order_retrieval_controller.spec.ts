import { expect } from 'chai'
import request from 'supertest'
import { Server } from 'http'
import { bootstrapRestApi } from '../rest-api'
import { ORDER_DATA_API_PORT } from '@abx-service-clients/order'
import { createAccountAndSession, createTemporaryTestingAccount } from '../../../../../../libs/util/account/src'
import { createOrder, createTradeTransactionPair, createOrderMatchTransaction } from '../../../core'
import { OrderDirection, OrderStatus, OrderType, OrderValidity, OrderMatchStatus } from '@abx-types/order'
import Decimal from 'decimal.js'
import { FiatCurrency } from '@abx-types/reference-data'
import { Account } from '@abx-types/account'

describe('api:order_retrieval_controller', () => {
  let app: Server

  beforeEach(async () => {
    app = bootstrapRestApi().listen(ORDER_DATA_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /orders/{orderId}/executions should return all order executions', async () => {
    const { cookie, account } = await createAccountAndSession()
    const seller = await createTemporaryTestingAccount()
    const symbolId = 'KAU_USD'

    const orderMatchAmounts = [5, 10]
    const orderMatchPrice = 10.2

    const buyOrderId = await createOrderExecutions(symbolId, account, seller, orderMatchPrice, orderMatchAmounts)
    const { body: executions, status } = await request(app).get(`/api/orders/${buyOrderId}/executions`).set('Cookie', cookie)

    expect(status).to.eql(200)

    expect(executions.length).to.eql(2)
    expect(executions[0].amount).to.eql(orderMatchAmounts[0])
    expect(executions[0].matchPrice).to.eql(orderMatchPrice)

    expect(executions[1].amount).to.eql(orderMatchAmounts[1])
    expect(executions[1].matchPrice).to.eql(orderMatchPrice)
  })

  const createOrderExecutions = async (symbolId: string, buyer: Account, seller: Account, orderPrice: number, orderMatchAmounts: number[]) => {
    const [{ id: buyOrderId }, { id: sellOrderId }] = await Promise.all([
      createOrder({
        accountId: buyer.id!,
        symbolId,
        direction: OrderDirection.buy,
        amount: 10,
        remaining: 5,
        status: OrderStatus.fill,
        orderType: OrderType.limit,
        limitPrice: 10.2,
        validity: OrderValidity.GTD,
      }),
      createOrder({
        accountId: seller.id!,
        symbolId,
        direction: OrderDirection.sell,
        amount: 10,
        remaining: 5,
        status: OrderStatus.fill,
        orderType: OrderType.limit,
        limitPrice: 10.2,
        validity: OrderValidity.GTD,
      }),
    ])

    const orderMatch1 = await createOrderMatchTransaction({
      symbolId,
      amount: orderMatchAmounts[0],
      matchPrice: orderPrice,
      consideration: 102,
      sellAccountId: seller.id!,
      sellOrderId: sellOrderId!,
      sellOrderType: OrderType.limit,
      buyAccountId: buyer.id!,
      buyOrderId: buyOrderId!,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.settled,
    })

    const orderMatch2 = await createOrderMatchTransaction({
      symbolId,
      amount: orderMatchAmounts[1],
      matchPrice: orderPrice,
      consideration: 102,
      sellAccountId: seller.id!,
      sellOrderId: sellOrderId!,
      sellOrderType: OrderType.limit,
      buyAccountId: buyer.id!,
      buyOrderId: buyOrderId!,
      buyOrderType: OrderType.limit,
      status: OrderMatchStatus.settled,
    })

    await Promise.all(
      [orderMatch1, orderMatch2].map((orderMatch) =>
        createTradeTransactionPair({
          orderMatch,
          buyerFeeDetail: {
            fee: 1,
            feeRate: 0.022,
          },
          buyerTax: {
            rate: 1,
            valueInCHF: new Decimal(12.2),
            valueInFeeCurrency: new Decimal(1.2),
          },
          sellerFeeDetail: {
            fee: 2,
            feeRate: 0.022,
          },
          sellerTax: {
            rate: 1,
            valueInCHF: new Decimal(12.2),
            valueInFeeCurrency: new Decimal(1.2),
          },
          feeCurrency: 1,
          buyerFiatCurrencyCode: FiatCurrency.usd,
          buyerBaseFiatConversion: 12.112,
          buyerQuoteFiatConversion: 11.12,
          sellerFiatCurrencyCode: FiatCurrency.usd,
          sellerBaseFiatConversion: 1.22,
          sellerQuoteFiatConversion: 11,
        }),
      ),
    )

    return buyOrderId
  }
})
