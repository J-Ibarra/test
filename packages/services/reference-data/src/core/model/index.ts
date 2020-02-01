import Currency from './currency'
import Symbol from './symbol'
import Boundary from './boundary'
import ExchangeConfig from './exchange_config'

export default function(sequelize) {
  const currencyModel = Currency(sequelize)
  const symbolModel = Symbol(sequelize)
  const boundaryModel = Boundary(sequelize)
  const exchangeConfigModel = ExchangeConfig(sequelize)

  symbolModel.belongsTo(currencyModel, { as: 'base' })
  symbolModel.belongsTo(currencyModel, { as: 'quote' })
  symbolModel.belongsTo(currencyModel, { as: 'fee' })

  boundaryModel.belongsTo(currencyModel)

  return { Currency: currencyModel, Symbol: symbolModel, Boundary: boundaryModel, ExchangeConfig: exchangeConfigModel }
}
