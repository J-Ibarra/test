import CurrencyTransaction from './currency_transaction'
import Order from './order'
import OrderEvent from './order_event'
import OrderMatchTransaction from './order_match_transaction'
import TradeTransaction from './trade_transaction'

export default function(sequelize) {
  const orderModel = Order(sequelize)
  const orderEventModel = OrderEvent(sequelize)
  const tradeTransModel = TradeTransaction(sequelize)
  const currencyTransactionModel = CurrencyTransaction(sequelize)
  const orderMatchTransactionModel = OrderMatchTransaction(sequelize)

  tradeTransModel.belongsTo(sequelize.models.tradeTransaction, {
    foreignKey: 'counterTradeTransactionId',
    as: 'counterTrade',
  })

  orderEventModel.belongsTo(orderModel)

  return {
    order: orderModel,
    orderEvent: orderEventModel,
    TradeTransaction: tradeTransModel,
    CurrencyTransaction: currencyTransactionModel,
    OrderMatchTransaction: orderMatchTransactionModel,
  }
}
