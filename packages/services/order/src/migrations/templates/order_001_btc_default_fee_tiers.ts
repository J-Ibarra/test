import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from '../../../../reference-data/src/migrations/templates/utils/utils'

const btcSymbols = [
  ['BTC_KAU', 8, 2, 2, 0.3, 19],
  ['BTC_KAG', 8, 3, 3, 0.3, 20],
  ['BTC_ETH', 8, 1, 8, 0.3, 21],
  ['BTC_USD', 8, 5, 5, 0.3, 22],
  ['BTC_EUR', 8, 6, 6, 0.3, 23],
  ['BTC_GBP', 8, 7, 8, 0.3, 24],
  ['KVT_BTC', 4, 8, 8, 0.3, 25],
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const btcPairDefaultFeeTiers = btcSymbols.map(([symbolId]) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  await sequelize.query(`
  ${btcPairDefaultFeeTiers}
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.default_execution_fee where code in [${btcSymbols.map(symbol => symbol[0]).join(', ')}];
  `)
}
