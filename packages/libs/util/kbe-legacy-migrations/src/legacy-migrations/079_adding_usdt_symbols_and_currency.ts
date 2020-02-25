import { Sequelize } from 'sequelize'

const usdtSymbols = [
  ['USDT_KAU', 9, 2, 2, 0.3, 25],
  ['USDT_KAG', 9, 3, 3, 0.3, 26],
  ['USDT_ETH', 9, 1, 9, 0.3, 27],
  ['USDT_USD', 9, 5, 9, 0.3, 28],
  ['USDT_EUR', 9, 6, 9, 0.3, 29],
  ['USDT_GBP', 9, 7, 9, 0.3, 30],
  ['USDT_BTC', 9, 8, 9, 0.3, 31],
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const usdtPairDefaultSymbols = usdtSymbols
    .map(
      symbol => `
  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt","orderRange","sortOrder")
  VALUES ('${symbol[0]}', ${symbol[1]}, ${symbol[2]}, ${symbol[3]}, FALSE, now(), now(), ${symbol[4]}, ${symbol[5]});
  `,
    )
    .join(' ')

  await sequelize.query(`
  
  ALTER TABLE public.symbol ALTER COLUMN id TYPE varchar(8);

  INSERT INTO public.currency(code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
  values ('USDT', now(), now(), FALSE, 9, 9);    

  ${usdtPairDefaultSymbols}
  
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
     DELETE FROM public.currency where code = 'USDT';
     DELETE FROM public.symbol where id in [${usdtSymbols.map(symbol => symbol[0]).join(', ')}];
  `)
}
