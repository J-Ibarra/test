import Currency from './currency'
import Symbol from './symbol'

export default function(sequelize) {
  const currencyModel = Currency(sequelize)
  const symbolModel = Symbol(sequelize)

  symbolModel.belongsTo(currencyModel, { as: 'base' })
  symbolModel.belongsTo(currencyModel, { as: 'quote' })
  symbolModel.belongsTo(currencyModel, { as: 'fee' })

  return { Currency: currencyModel, Symbol: symbolModel }
}
