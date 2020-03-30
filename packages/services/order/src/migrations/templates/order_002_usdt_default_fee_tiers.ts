import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from '../../../../reference-data/src/migrations/templates/utils/utils'

const usdtSymbols = [
  ['KVT_USDT', 4, 9, 9, 0.3, 25],
  ['KAU_USDT', 2, 9, 2, 0.3, 26],
  ['KAG_USDT', 3, 9, 3, 0.3, 27],
  ['ETH_USDT', 1, 9, 9, 0.3, 28],
  ['BTC_USDT', 8, 9, 9, 0.3, 29],
  ['EUR_USDT', 6, 9, 9, 0.3, 30],
  ['USD_USDT', 5, 9, 5, 0.3, 31],
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const usdtPairDefaultFeeTiers = usdtSymbols.map(([symbolId]) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  await sequelize.query(`
  ALTER TABLE public.default_execution_fee
  ALTER COLUMN "symbolId" TYPE varchar(8);

  ${usdtPairDefaultFeeTiers}
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.default_execution_fee where code in [${usdtSymbols.map(symbol => symbol[0]).join(', ')}];
  `)
}
