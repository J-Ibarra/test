import { Sequelize } from 'sequelize'
import { createDefaultFeeTiersForSymbol } from './utils/utils'

const usdtSymbols = [
  ['KVT_USDT', 4, 9, 9, 0.3, 26],
  ['KAU_USDT', 2, 9, 2, 0.3, 27],
  ['KAG_USDT', 3, 9, 3, 0.3, 28],
  ['ETH_USDT', 1, 9, 9, 0.3, 29],
  ['BTC_USDT', 8, 9, 9, 0.3, 30],
  ['USDT_EUR', 9, 6, 9, 0.3, 31],
  ['USDT_USD', 9, 5, 5, 0.3, 32],
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

  await sequelize.query(`
      ALTER TABLE public.symbol ALTER COLUMN id TYPE varchar(8);
      ALTER TABLE public.currency ALTER COLUMN code TYPE varchar(4);
      ALTER TABLE public.boundary ALTER COLUMN "currencyCode" TYPE varchar(4);
              
      ${alterAllForeignKeyColumnTypes}
      
      INSERT INTO public.currency(id, code, "createdAt", "updatedAt", "isEnabled", "symbolSortPriority", "currencyOrderPriority")
      values (9, 'USDT', now(), now(), FALSE, 9, 9);    
    
      ${usdtPairDefaultSymbols}
      
      INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
      values (9, 'USDT', 0.01, 2, now(), now());
    
      ${usdtPairDefaultFeeTiers}`)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM public.default_execution_fee where code in [${usdtSymbols.map((symbol) => symbol[0]).join(', ')}];
    DELETE FROM public.boundary where code = 'USDT';
    DELETE FROM public.symbol where id in [${usdtSymbols.map((symbol) => symbol[0]).join(', ')}];

    DELETE FROM public.currency where code = 'USDT';
  `)
}
