import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/utils'
const yeenusSymbols = [
  ['KVT_YEENUS', 4, 9, 9, 0.3, 33],
  ['KAU_YEENUS', 2, 9, 2, 0.3, 34],
  ['KAG_YEENUS', 3, 9, 3, 0.3, 35],
  ['ETH_YEENUS', 1, 9, 9, 0.3, 36],
  ['BTC_YEENUS', 8, 9, 9, 0.3, 37],
  ['EUR_YEENUS', 6, 9, 9, 0.3, 38],
  ['USD_YEENUS', 5, 9, 5, 0.3, 39],
]

const tablesWithForeignKeyToSymbolId = [
  'trade_transaction',
  'order',
  'default_execution_fee',
  'account_execution_fee',
  'order_match_transaction',
  'ohlc_market_data',
  'depth_mid_price',
  'order_queue_status',
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const usdtPairDefaultSymbols = yeenusSymbols
    .map(
      symbol => `
  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt","orderRange","sortOrder")
  VALUES ('${symbol[0]}', ${symbol[1]}, ${symbol[2]}, ${symbol[3]}, FALSE, now(), now(), ${symbol[4]}, ${symbol[5]});
  `,
    )
    .join(' ')

  const usdtPairDefaultFeeTiers = yeenusSymbols.map(([symbolId]) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  const alterAllForeignKeyColumnTypes = tablesWithForeignKeyToSymbolId
    .map(
      table => `
ALTER TABLE public.${table}
ALTER COLUMN "symbolId" TYPE varchar(10);
`,
    )
    .join(' ')

  await sequelize.query(`
  ALTER TABLE public.symbol ALTER COLUMN id TYPE varchar(10);
  ALTER TABLE public.currency ALTER COLUMN code TYPE varchar(6);
  ALTER TABLE public.boundary ALTER COLUMN "currencyCode" TYPE varchar(6);
  ALTER TABLE public.contacts ALTER COLUMN "currencyCode" TYPE varchar(6);

  ${alterAllForeignKeyColumnTypes}
  
  INSERT INTO public.currency(id, code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
  values (10, 'YEENUS', now(), now(), FALSE, 9, 9);    

  ${usdtPairDefaultSymbols}
  
  INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
  values (10, 'YEENUS', 0.01, 2, now(), now());

  ${usdtPairDefaultFeeTiers}
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  DELETE FROM public.default_execution_fee where code in [${yeenusSymbols.map(symbol => symbol[0]).join(', ')}];
  DELETE FROM public.boundary where code = 'YEENUS';
  DELETE FROM public.symbol where id in [${yeenusSymbols.map(symbol => symbol[0]).join(', ')}];

  DELETE FROM public.currency where code = 'YEENUS';
  `)
}
