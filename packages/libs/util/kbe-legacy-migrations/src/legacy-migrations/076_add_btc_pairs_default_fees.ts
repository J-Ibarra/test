import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/default_fee_tier_creation'
const btcPairs = ['BTC_KAU', 'BTC_KAG', 'BTC_ETH', 'BTC_USD', 'BTC_EUR', 'BTC_GBP']
export async function up({ sequelize }: { sequelize: Sequelize }) {
  const btcPairDefaultFeeTiers = btcPairs.map(symbolId => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  return sequelize.query(btcPairDefaultFeeTiers)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM "default_execution_fee" where "symbolId" in (${btcPairs.join(', ')});
  `)
}
