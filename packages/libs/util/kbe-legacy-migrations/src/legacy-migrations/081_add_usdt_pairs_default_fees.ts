import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/default_fee_tier_creation'

const usdtPairs = ['USDT_KAU', 'USDT_KAG', 'USDT_ETH', 'USDT_USD', 'USDT_EUR', 'USDT_GBP', 'USDT_BTC']

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const usdtPairDefaultFeeTiers = usdtPairs.map(symbolId => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  return sequelize.query(`

  ALTER TABLE public.default_execution_fee ALTER COLUMN "symbolId" TYPE varchar(8);

  ${usdtPairDefaultFeeTiers}

  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM "default_execution_fee" where "symbolId" in (${usdtPairs.join(', ')});
  `)
}
