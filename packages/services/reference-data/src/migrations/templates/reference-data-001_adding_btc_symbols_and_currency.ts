import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/utils'

const btcSymbols = [
  ['BTC_KAU', 8, 2, 2, 0.3, 19],
  ['BTC_KAG', 8, 3, 3, 0.3, 20],
  ['ETH_BTC', 1, 8, 8, 0.3, 21],
  ['BTC_USD', 8, 5, 5, 0.3, 22],
  ['BTC_EUR', 8, 6, 6, 0.3, 23],
  ['BTC_GBP', 8, 7, 8, 0.3, 24],
  ['KVT_BTC', 4, 8, 8, 0.3, 25],
]
export async function up({ sequelize }: { sequelize: Sequelize }) {
  const btcPairDefaultSymbols = btcSymbols
    .map(
      (symbol) => `
  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt","orderRange","sortOrder")
  VALUES ('${symbol[0]}', ${symbol[1]}, ${symbol[2]}, ${symbol[3]}, FALSE, now(), now(), ${symbol[4]}, ${symbol[5]});       
  `,
    )
    .join(' ')

  const btcPairDefaultFeeTiers = btcSymbols.map(([symbolId]) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  return sequelize.query(`
  INSERT INTO currency(id, code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
  values (8, 'BTC', now(), now(), FALSE, 8, 8);
  
  ${btcPairDefaultSymbols}

  ${btcPairDefaultFeeTiers}
    `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
     DELETE FROM public.currency where code = 'BTC';
     DELETE FROM public.symbol where id in [${btcSymbols.map((symbol) => symbol[0]).join(', ')}];
  `)
}
