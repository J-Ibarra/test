import { Sequelize } from 'sequelize'

const btcSymbols = [
  ['BTC_KAU', 8, 2, 2, 0.3, 19],
  ['BTC_KAG', 8, 3, 3, 0.3, 20],
  ['BTC_ETH', 8, 1, 8, 0.3, 21],
  ['BTC_USD', 8, 5, 8, 0.3, 22],
  ['BTC_EUR', 8, 6, 8, 0.3, 23],
  ['BTC_GBP', 8, 7, 8, 0.3, 24],
]
export async function up({ sequelize }: { sequelize: Sequelize }) {
  const btcPairDefaultSymbols = btcSymbols
    .map(
      symbol => `
  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt","orderRange","sortOrder")
  VALUES ('${symbol[0]}', ${symbol[1]}, ${symbol[2]}, ${symbol[3]}, FALSE, now(), now(), ${symbol[4]}, ${symbol[5]});       
  `,
    )
    .join(' ')

  return sequelize.query(`
  
  INSERT INTO currency(code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
  values ('BTC', now(), now(), FALSE, 8, 8);
  
  ${btcPairDefaultSymbols}
  
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
     DELETE FROM public.currency where code = 'BTC';
     DELETE FROM public.symbol where id in [${btcSymbols.map(symbol => symbol[0]).join(', ')}];
  `)
}
