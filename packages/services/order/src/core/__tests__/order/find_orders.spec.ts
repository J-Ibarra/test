import { expect } from 'chai'
import moment from 'moment'
import sinon from 'sinon'
import { getModel, truncateTables } from '@abx/db-connection-utils'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { TradeTransaction, Order, OrderDirection, OrderStatus, OrderType, OrderValidity } from '@abx-types/order'
import { extractCoreOrderDetails, findAllOrdersForAccount, findAllOrdersForAccountAndSymbols, findOrdersForCurrency } from '../../order/find_orders'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { GTIDInitials } from '@abx-service-clients/admin-fund-management'

const kauUsdSymbol = 'KAU_USD'
const kvtUsdSymbol = 'KVT_USD'
const dateNow = new Date()

describe('find_orders', () => {
  let orders
  let account
  let kauUsdTransaction

  beforeEach(async () => {
    await truncateTables()
    account = await createTemporaryTestingAccount()

    await getModel<Order>('order').bulkCreate([
      createOrder({
        accountId: account.id,
        limitPrice: 10,
        direction: OrderDirection.buy,
        symbolId: kauUsdSymbol,
        clientOrderId: '1',
        status: OrderStatus.fill,
        createdAt: new Date('2019-04-05'),
        updatedAt: new Date('2019-06-07'),
      }),
      createOrder({
        accountId: account.id,
        limitPrice: 12,
        direction: OrderDirection.sell,
        symbolId: kvtUsdSymbol,
        clientOrderId: '2',
        status: OrderStatus.cancel,
        createdAt: new Date('2019-05-06'),
        updatedAt: new Date('2019-08-09'),
      }),
      createOrder({
        accountId: account.id,
        limitPrice: 10,
        direction: OrderDirection.buy,
        symbolId: kauUsdSymbol,
        clientOrderId: '3',
        status: OrderStatus.fill,
        createdAt: new Date('2019-03-02'),
        updatedAt: new Date('2019-06-06'),
      }),
    ])

    kauUsdTransaction = createTradeTransaction({
      id: 1,
      symbolId: kauUsdSymbol,
      accountId: account.id,
      direction: OrderDirection.buy,
      amount: 5,
      matchPrice: 20,
      orderId: 1,
    })
    sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([
      {
        id: 'KAU_USD',
      },
      {
        id: 'KVT_USD',
      },
    ])
    await getModel<TradeTransaction>('tradeTransaction').bulkCreate([kauUsdTransaction])

    orders = (await getModel<Order>('order').findAll()).map(order => order.get())
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('findOrdersForCurrency', () => {
    it('should retrieve all orders for all symbols given a currency, using limit price for new and partially filled orders', async () => {
      const extractedOrders = extractCoreOrderDetails(orders)
      const kauUsdOrder = extractedOrders[0]
      const kvtUsdOrder = extractedOrders[1]

      const kauUsdSecondTransaction = createTradeTransaction({
        id: 2,
        symbolId: kauUsdSymbol,
        accountId: account.id,
        direction: OrderDirection.buy,
        amount: 5,
        matchPrice: 10,
        orderId: 1,
      })

      await getModel<TradeTransaction>('tradeTransaction').bulkCreate([kauUsdSecondTransaction])

      expect(orders.length).to.eql(3)

      sinon
        .stub(referenceDataOperations, 'getAllSymbolsIncludingCurrency')
        .onFirstCall()
        .resolves([
          {
            id: 'KAU_USD',
          },
        ])
        .onSecondCall()
        .resolves([
          {
            id: 'KVT_USD',
          },
        ])
      const kauOrder = (await findOrdersForCurrency(account.id, CurrencyCode.kau))[0]

      expect(kauOrder.amount).to.eql(kauUsdOrder.amount)
      expect(kauOrder.direction).to.eql(kauUsdOrder.direction)
      expect(kauOrder.id).to.eql(kauUsdOrder.id)
      expect(kauOrder.limitPrice).to.eql((20 + 10) / 2)
      expect(kauOrder.orderType).to.eql(kauUsdOrder.orderType)
      expect(kauOrder.remaining).to.eql(kauUsdOrder.remaining)
      expect(kauOrder.status).to.eql(kauUsdOrder.status)
      expect(kauOrder.symbolId).to.eql(kauUsdOrder.symbolId)
      expect(kauOrder.globalTransactionId!.startsWith(GTIDInitials.order)).to.equal(true)
      expect(kauOrder.transactions.length).to.eql(2)

      const kvtOrder = (await findOrdersForCurrency(account.id, CurrencyCode.kvt))[0]
      expect(kvtOrder.amount).to.eql(kvtUsdOrder.amount)
      expect(kvtOrder.direction).to.eql(kvtUsdOrder.direction)
      expect(kvtOrder.id).to.eql(kvtUsdOrder.id)
      expect(kvtOrder.limitPrice).to.eql(kvtUsdOrder.limitPrice)
      expect(kvtOrder.orderType).to.eql(kvtUsdOrder.orderType)
      expect(kvtOrder.remaining).to.eql(kvtUsdOrder.remaining)
      expect(kvtOrder.status).to.eql(kvtUsdOrder.status)
      expect(kvtOrder.symbolId).to.eql(kvtUsdOrder.symbolId)
      expect(kvtOrder.globalTransactionId!.startsWith(GTIDInitials.order)).to.equal(true)
      expect(kvtOrder.transactions.length).to.eql(0)
    })

    it('should retrieve all orders for all symbols given a currency, using average match price for filled and cancelled orders', async () => {
      const extractedOrders = extractCoreOrderDetails(orders)
      const kauUsdOrder = extractedOrders[0]
      const kvtUsdOrder = extractedOrders[1]
      const kauUsdSecondTransaction = createTradeTransaction({
        id: 2,
        symbolId: kauUsdSymbol,
        accountId: account.id,
        direction: OrderDirection.buy,
        amount: 5,
        matchPrice: 18,
        orderId: 1,
      })
      await getModel<TradeTransaction>('tradeTransaction').bulkCreate([kauUsdSecondTransaction])
      expect(orders.length).to.eql(3)
      sinon
        .stub(referenceDataOperations, 'getAllSymbolsIncludingCurrency')
        .onFirstCall()
        .resolves([
          {
            id: 'KAU_USD',
          },
        ])
        .onSecondCall()
        .resolves([
          {
            id: 'KVT_USD',
          },
        ])

      const ordersFoundForKau = (await findOrdersForCurrency(account.id, CurrencyCode.kau))[0]

      expect(ordersFoundForKau.amount).to.eql(kauUsdOrder.amount)
      expect(ordersFoundForKau.direction).to.eql(kauUsdOrder.direction)
      expect(ordersFoundForKau.id).to.eql(kauUsdOrder.id)
      expect(ordersFoundForKau.limitPrice).to.eql((18 + 20) / 2)
      expect(ordersFoundForKau.orderType).to.eql(kauUsdOrder.orderType)
      expect(ordersFoundForKau.remaining).to.eql(kauUsdOrder.remaining)
      expect(ordersFoundForKau.status).to.eql(kauUsdOrder.status)
      expect(ordersFoundForKau.symbolId).to.eql(kauUsdOrder.symbolId)
      expect(ordersFoundForKau.transactions.length).to.eql(2)

      const ordersFoundForKvt = (await findOrdersForCurrency(account.id, CurrencyCode.kvt))[0]

      expect(ordersFoundForKvt.amount).to.eql(kvtUsdOrder.amount)
      expect(ordersFoundForKvt.direction).to.eql(kvtUsdOrder.direction)
      expect(ordersFoundForKvt.id).to.eql(kvtUsdOrder.id)
      expect(ordersFoundForKvt.limitPrice).to.eql(kvtUsdOrder.limitPrice)
      expect(ordersFoundForKvt.orderType).to.eql(kvtUsdOrder.orderType)
      expect(ordersFoundForKvt.remaining).to.eql(kvtUsdOrder.remaining)
      expect(ordersFoundForKvt.status).to.eql(kvtUsdOrder.status)
      expect(ordersFoundForKvt.symbolId).to.eql(kvtUsdOrder.symbolId)
      expect(ordersFoundForKvt.transactions.length).to.eql(0)
    })

    it('should handle querying with supplied where filters', async () => {
      const extractedOrders = extractCoreOrderDetails(orders)
      const kauUsdOrder = extractedOrders[0]
      const kauUsdSecondTransaction = createTradeTransaction({
        id: 2,
        symbolId: kauUsdSymbol,
        accountId: account.id,
        direction: OrderDirection.buy,
        amount: 5,
        matchPrice: 18,
        orderId: 1,
      })
      await getModel<TradeTransaction>('tradeTransaction').bulkCreate([kauUsdSecondTransaction])
      expect(orders.length).to.eql(3)

      const whereOptions = {
        createdAt: {
          $gt: '2019-03-10',
        },
      }
      sinon.stub(referenceDataOperations, 'getAllSymbolsIncludingCurrency').resolves([
        {
          id: 'KAU_USD',
        },
      ])

      const ordersFound = await findOrdersForCurrency(account.id, CurrencyCode.kau, whereOptions)
      expect(ordersFound.length).to.eql(1)
      const ordersFoundForKau = ordersFound[0]

      expect(ordersFoundForKau.amount).to.eql(kauUsdOrder.amount)
      expect(ordersFoundForKau.direction).to.eql(kauUsdOrder.direction)
      expect(ordersFoundForKau.id).to.eql(kauUsdOrder.id)
      expect(ordersFoundForKau.limitPrice).to.eql((18 + 20) / 2)
      expect(ordersFoundForKau.orderType).to.eql(kauUsdOrder.orderType)
      expect(ordersFoundForKau.remaining).to.eql(kauUsdOrder.remaining)
      expect(ordersFoundForKau.status).to.eql(kauUsdOrder.status)
      expect(ordersFoundForKau.symbolId).to.eql(kauUsdOrder.symbolId)
      expect(ordersFoundForKau.transactions.length).to.eql(2)
    })
  })

  it('findAllOrdersForAccount should retrieve all orders for a given account id', async () => {
    const extractedOrders = extractCoreOrderDetails(orders)
    const kauUsdOrder = extractedOrders[0]
    const kvtUsdOrder = extractedOrders[1]
    const kauUsdSecondTransaction = createTradeTransaction({
      id: 2,
      symbolId: kauUsdSymbol,
      accountId: account.id,
      direction: OrderDirection.buy,
      amount: 5,
      matchPrice: 18,
      orderId: 1,
    })

    await getModel<TradeTransaction>('tradeTransaction').bulkCreate([kauUsdSecondTransaction])
    expect(orders.length).to.eql(3)

    const [ordersFoundForKvt, ordersFoundForKau] = await findAllOrdersForAccount(account.id)

    expect(ordersFoundForKau.amount).to.eql(kauUsdOrder.amount)
    expect(ordersFoundForKau.direction).to.eql(kauUsdOrder.direction)
    expect(ordersFoundForKau.id).to.eql(kauUsdOrder.id)
    expect(ordersFoundForKau.limitPrice).to.eql((18 + 20) / 2)
    expect(ordersFoundForKau.orderType).to.eql(kauUsdOrder.orderType)
    expect(ordersFoundForKau.remaining).to.eql(kauUsdOrder.remaining)
    expect(ordersFoundForKau.status).to.eql(kauUsdOrder.status)
    expect(ordersFoundForKau.symbolId).to.eql(kauUsdOrder.symbolId)
    expect(ordersFoundForKau.transactions.length).to.eql(2)

    expect(ordersFoundForKvt.amount).to.eql(kvtUsdOrder.amount)
    expect(ordersFoundForKvt.direction).to.eql(kvtUsdOrder.direction)
    expect(ordersFoundForKvt.id).to.eql(kvtUsdOrder.id)
    expect(ordersFoundForKvt.limitPrice).to.eql(kvtUsdOrder.limitPrice)
    expect(ordersFoundForKvt.orderType).to.eql(kvtUsdOrder.orderType)
    expect(ordersFoundForKvt.remaining).to.eql(kvtUsdOrder.remaining)
    expect(ordersFoundForKvt.status).to.eql(kvtUsdOrder.status)
    expect(ordersFoundForKvt.symbolId).to.eql(kvtUsdOrder.symbolId)
    expect(ordersFoundForKvt.transactions.length).to.eql(0)
  })

  describe('findAllOrders up to 500', () => {
    it('findAllOrdersForAccountAndSymbols should only fetch the latest 500 orders', async () => {
      const ordersToCreate: Order[] = []
      let i
      for (i = 3; i < 550; i++) {
        ordersToCreate.push(
          createOrder({
            accountId: account.id,
            limitPrice: Number((Math.random() * 10).toFixed(2)),
            direction: OrderDirection.buy,
            symbolId: kauUsdSymbol,
            clientOrderId: String(i),
            status: OrderStatus.cancel,
          }),
        )
      }
      const oldOrder = {
        ...createOrder({
          accountId: account.id,
          limitPrice: Number((Math.random() * 10).toFixed(2)),
          direction: OrderDirection.buy,
          symbolId: kauUsdSymbol,
          clientOrderId: '660',
          status: OrderStatus.cancel,
        }),
        id: 660,
        createdAt: moment(dateNow)
          .subtract(1, 'day')
          .toDate(),
        updatedAt: moment(dateNow)
          .subtract(1, 'day')
          .toDate(),
      }

      await getModel<Order>('order').bulkCreate([...ordersToCreate, oldOrder])
      const ordersFromDb = await findAllOrdersForAccountAndSymbols(account.id, [{ id: kauUsdSymbol }, { id: 'KVT_USD' }] as any, {})
      const orderShouldNotExist = ordersFromDb.find(order => order.id === oldOrder.id)
      expect(ordersFromDb.length).to.eql(500)
      expect(orderShouldNotExist).to.eql(undefined)
    })

    it('findAllOrdersForAccountAndSymbols should only fetch the latest 500 orders - include latestOrder', async () => {
      const ordersToCreate: Order[] = []
      let i
      for (i = 3; i < 550; i++) {
        ordersToCreate.push({
          ...createOrder({
            accountId: account.id,
            limitPrice: Number((Math.random() * 10).toFixed(2)),
            direction: OrderDirection.buy,
            symbolId: kauUsdSymbol,
            clientOrderId: String(i),
            status: OrderStatus.cancel,
          }),
          createdAt: moment(dateNow)
            .subtract(1, 'day')
            .toDate(),
          updatedAt: moment(dateNow)
            .subtract(1, 'day')
            .toDate(),
        })
      }
      const latestOrder = {
        ...createOrder({
          accountId: account.id,
          limitPrice: Number((Math.random() * 10).toFixed(2)),
          direction: OrderDirection.buy,
          symbolId: kauUsdSymbol,
          clientOrderId: '660',
          status: OrderStatus.cancel,
        }),
        id: 660,
        createdAt: moment(dateNow)
          .add(1, 'minute')
          .toDate(),
        updatedAt: moment(dateNow)
          .add(1, 'minute')
          .toDate(),
      }

      await getModel<Order>('order').bulkCreate([latestOrder, ...ordersToCreate])
      const ordersFromDb = await findAllOrdersForAccountAndSymbols(account.id, [{ id: kauUsdSymbol }] as any, {})
      const orderShouldExistAndBeFirst = ordersFromDb[0]
      expect(ordersFromDb.length).to.eql(500)
      expect(orderShouldExistAndBeFirst.id).to.eql(latestOrder.id)
    })
  })
})

const createOrder = ({
  accountId,
  limitPrice,
  direction,
  symbolId,
  clientOrderId,
  status = OrderStatus.submit,
  createdAt = new Date(),
  updatedAt = new Date(),
}: {
  accountId: string
  limitPrice: number
  direction: OrderDirection
  symbolId: string
  clientOrderId: string
  status: OrderStatus
  createdAt?: Date
  updatedAt?: Date
}) => ({
  accountId,
  clientOrderId,
  symbolId,
  direction,
  amount: 10,
  remaining: 5,
  status,
  orderType: OrderType.limit,
  validity: OrderValidity.GTC,
  limitPrice,
  createdAt,
  updatedAt,
})

const createTradeTransaction = ({
  id,
  symbolId,
  accountId,
  direction,
  amount,
  matchPrice,
  orderId,
}: {
  id: number
  symbolId: string
  accountId: string
  direction: OrderDirection
  amount: number
  matchPrice: number
  orderId: number
}): TradeTransaction => ({
  id,
  counterTradeTransactionId: 1,
  counterTrade: undefined,
  direction,
  symbolId,
  accountId,
  orderId,
  amount,
  matchPrice,
  fee: 2,
  feeRate: 0.01,
  feeCurrencyId: 1,
  createdAt: dateNow,
  updatedAt: dateNow,
  taxAmountFeeCurrency: 1,
  taxAmountCHF: 1,
  taxRate: 0,
  fiatCurrencyCode: FiatCurrency.usd,
  baseFiatConversion: 125,
  quoteFiatConversion: 215,
})
