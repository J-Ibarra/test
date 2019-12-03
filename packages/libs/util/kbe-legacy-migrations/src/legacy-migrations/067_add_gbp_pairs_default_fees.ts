import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/default_fee_tier_creation'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const gbpPairs = ['KAU_GBP', 'KAG_GBP', 'ETH_GBP', 'KVT_GBP']

  const gbpPairDefaultFeeTiers = gbpPairs.map(symbolId => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  return sequelize.query(gbpPairDefaultFeeTiers)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM "default_execution_fee" where "symbolId" in ('KAU_GBP', 'KAG_GBP', 'ETH_GBP', 'KVT_GBP');
  `)
}
