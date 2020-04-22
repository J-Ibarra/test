import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/utils'

const usdtSymbols = [
  ['KVT_USDT', 4, 9, 9, 0.3, 27],
  ['KAU_USDT', 2, 9, 2, 0.3, 23],
  ['KAG_USDT', 3, 9, 3, 0.3, 24],
  ['ETH_USDT', 1, 9, 9, 0.3, 26],
  ['BTC_USDT', 8, 9, 9, 0.3, 25],
  ['USDT_EUR', 9, 6, 9, 0.3, 11],
  ['USDT_USD', 9, 5, 5, 0.3, 5],
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

const updatedSymbolPriorities = [
  { symbol: 'KAU_USD', priority: 1 },
  { symbol: 'KAG_USD', priority: 2 },
  { symbol: 'BTC_USD', priority: 3 },
  { symbol: 'ETH_USD', priority: 4 },
  { symbol: 'KVT_USD', priority: 6 },
  { symbol: 'KAU_EUR', priority: 7 },
  { symbol: 'KAG_EUR', priority: 8 },
  { symbol: 'BTC_EUR', priority: 9 },
  { symbol: 'ETH_EUR', priority: 10 },
  { symbol: 'KVT_EUR', priority: 12 },
  { symbol: 'BTC_KAU', priority: 13 },
  { symbol: 'ETH_KAU', priority: 14 },
  { symbol: 'KVT_KAU', priority: 15 },
  { symbol: 'KAU_KAG', priority: 16 },
  { symbol: 'BTC_KAG', priority: 17 },
  { symbol: 'ETH_KAG', priority: 18 },
  { symbol: 'KVT_KAG', priority: 19 },
  { symbol: 'ETH_BTC', priority: 20 },
  { symbol: 'KVT_BTC', priority: 21 },
  { symbol: 'KVT_ETH', priority: 22 },
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const usdtPairDefaultSymbols = usdtSymbols
    .map(
      (symbol) => `
  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt","orderRange","sortOrder")
  VALUES ('${symbol[0]}', ${symbol[1]}, ${symbol[2]}, ${symbol[3]}, FALSE, now(), now(), ${symbol[4]}, ${symbol[5]});
  `,
    )
    .join(' ')

  const usdtPairDefaultFeeTiers = usdtSymbols.map(([symbolId]) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')

  const alterAllForeignKeyColumnTypes = tablesWithForeignKeyToSymbolId
    .map(
      (table) => `
  ALTER TABLE public.${table}
  ALTER COLUMN "symbolId" TYPE varchar(8);
  `,
    )
    .join(' ')

  const updateSymbolOrder = updatedSymbolPriorities
    .map(
      ({ priority, symbol }) => `
  UPDATE public.symbol
  SET "sortOrder"=${priority} 
  WHERE id='${symbol}';
  `,
    )
    .join(' ')

  console.log(updateSymbolOrder)
  try {
    await sequelize.query(`
      ALTER TABLE public.symbol ALTER COLUMN id TYPE varchar(8);
      ALTER TABLE public.currency ALTER COLUMN code TYPE varchar(4);
      ALTER TABLE public.boundary ALTER COLUMN "currencyCode" TYPE varchar(4);
              
      ${alterAllForeignKeyColumnTypes}
      
      INSERT INTO public.currency(id, code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
      values (9, 'USDT', now(), now(), FALSE, 9, 9);    
    
      ALTER TABLE public.symbol
      DROP CONSTRAINT "symbol_sortOrder_key";

      ${usdtPairDefaultSymbols}
      
      INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
      values (9, 'USDT', 0.01, 2, now(), now());
    
      ${usdtPairDefaultFeeTiers}

      ${updateSymbolOrder}
      `)
  } catch (e) {
    console.log(JSON.stringify(e))
    throw e
  }
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.default_execution_fee where code in [${usdtSymbols.map((symbol) => symbol[0]).join(', ')}];
    DELETE FROM public.boundary where code = 'USDT';
    DELETE FROM public.symbol where id in [${usdtSymbols.map((symbol) => symbol[0]).join(', ')}];

    DELETE FROM public.currency where code = 'USDT';
  `)
}
