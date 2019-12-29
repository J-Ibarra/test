import Currency from './currency'
import Symbol from './symbol'
import Boundary from './boundary'

export default function(sequelize) {
  const currencyModel = Currency(sequelize)
  const symbolModel = Symbol(sequelize)
  const boundaryModel = Boundary(sequelize)

  symbolModel.belongsTo(currencyModel, { as: 'base' })
  symbolModel.belongsTo(currencyModel, { as: 'quote' })
  symbolModel.belongsTo(currencyModel, { as: 'fee' })

  boundaryModel.belongsTo(currencyModel)

  return { Currency: currencyModel, Symbol: symbolModel, Boundary: boundaryModel }
}
