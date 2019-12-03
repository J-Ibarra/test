import { Sequelize } from 'sequelize'

import { createInsertStatementForSymbolBoundary } from './013_create_boundaries'
import { createDefaultFeeTiersForSymbol } from './utils/default_fee_tier_creation'

const newSymbolData = [
  { symbolId: 'KAU_USD', baseId: 2, quoteId: 5, feeId: 2 },
  { symbolId: 'KAU_EUR', baseId: 2, quoteId: 6, feeId: 2 },
  { symbolId: 'ETH_KAU', baseId: 1, quoteId: 2, feeId: 2 },
  { symbolId: 'KVT_KAU', baseId: 4, quoteId: 2, feeId: 2 },
  { symbolId: 'KAU_KAG', baseId: 2, quoteId: 3, feeId: 2 },
  { symbolId: 'KAG_USD', baseId: 3, quoteId: 5, feeId: 3 },
  { symbolId: 'KAG_EUR', baseId: 3, quoteId: 6, feeId: 3 },
  { symbolId: 'ETH_KAG', baseId: 1, quoteId: 3, feeId: 3 },
  { symbolId: 'KVT_KAG', baseId: 4, quoteId: 3, feeId: 3 },
  { symbolId: 'KVT_USD', baseId: 4, quoteId: 5, feeId: 5 },
  { symbolId: 'KVT_EUR', baseId: 4, quoteId: 6, feeId: 6 },
  { symbolId: 'KVT_ETH', baseId: 4, quoteId: 1, feeId: 1 },
  { symbolId: 'ETH_USD', baseId: 1, quoteId: 5, feeId: 1 },
  { symbolId: 'ETH_EUR', baseId: 1, quoteId: 6, feeId: 1 },
]

const tablesWithForeignKeyToSymbolId = [
  'trade_transaction',
  'order',
  'boundary',
  'default_execution_fee',
  'account_execution_fee',
  'order_match_transaction',
  'ohlc_market_data',
  'depth_mid_price',
  'order_queue_status',
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    TRUNCATE public.symbol CASCADE;

    ${dropForeignKeyConstraints()}

    DROP SEQUENCE public.symbol_id_seq CASCADE;

    ${symbolTableColumnChanges}

    ${insertNewSymbols()}

    ${alterAllForeignKeyColumnTypes()}

    ${addBackForeignKeys()}

    ${updateDefaultFeeTiersForAllSymbols()}

    ${insertBoundaries()}

    ${insetOrderQueueStatuses(newSymbolData)}
  `)
}

const symbolTableColumnChanges = `
ALTER TABLE public.symbol
ALTER COLUMN id TYPE character varying(7);

ALTER TABLE public.symbol
DROP COLUMN "toId";

ALTER TABLE public.symbol
DROP COLUMN "createdAt";

ALTER TABLE public.symbol
DROP COLUMN "updatedAt";

ALTER TABLE public.symbol
ADD COLUMN "quoteId" integer NOT NULL;

ALTER TABLE public.symbol
ADD COLUMN "feeId" integer NOT NULL;

ALTER TABLE public.symbol
ADD COLUMN "createdAt" timestamp with time zone NOT NULL;

ALTER TABLE public.symbol
ADD COLUMN "updatedAt" timestamp with time zone NOT NULL;
`
const dropForeignKeyConstraints = () =>
  tablesWithForeignKeyToSymbolId
    .map(
      table => `
ALTER TABLE public.${table}
DROP CONSTRAINT IF EXISTS "${table}_symbolId_fkey" CASCADE;
`,
    )
    .join(' ')

const insertNewSymbols = () =>
  newSymbolData
    .map(
      ({ symbolId, baseId, quoteId, feeId }) => `
INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "createdAt", "updatedAt")
values ('${symbolId}', ${baseId}, ${quoteId}, ${feeId}, now(), now());
`,
    )
    .join(' ')

const alterAllForeignKeyColumnTypes = (type = 'character varying(7)') =>
  tablesWithForeignKeyToSymbolId
    .map(
      table => `
ALTER TABLE public.${table}
ALTER COLUMN "symbolId" TYPE ${type};
`,
    )
    .join(' ')

const addBackForeignKeys = () =>
  tablesWithForeignKeyToSymbolId
    .map(
      table => `
ALTER TABLE public.${table}
ADD CONSTRAINT "${table}_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES public.symbol(id);
`,
    )
    .join(' ')

const updateDefaultFeeTiersForAllSymbols = () => `
  DELETE FROM public.default_execution_fee;

  ${newSymbolData.map(({ symbolId }) => createDefaultFeeTiersForSymbol(`'${symbolId}'`)).join(' ')}
`

const insertBoundaries = () => `
  DELETE FROM public.boundary;
  
  ${newSymbolData.map(({ symbolId }) => createInsertStatementForSymbolBoundary(`'${symbolId}'`)).join(' ')}
`

const insetOrderQueueStatuses = symbols => `
  ${symbols
    .map(({ symbolId }) => `INSERT INTO public.order_queue_status("symbolId","processing","lastProcessed") VALUES ('${symbolId}',FALSE, now());`)
    .join(' ')}
`

export async function down({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    TRUNCATE public.symbol CASCADE;

    ${dropForeignKeyConstraints()}

    ${rollbackSymbolTableChanges}

    ${insertOldSymbols}

    ${alterAllForeignKeyColumnTypes('integer')}

    ${addBackForeignKeys()}

    ${Array.from({ length: 13 }, (_, i) => {
      const symbolId = i + 1
      createInsertStatementForSymbolBoundary(symbolId)
    }).join(' ')}
  `)
}

const rollbackSymbolTableChanges = `
ALTER TABLE public.symbol
DROP COLUMN "feeId";

ALTER TABLE public.symbol
DROP COLUMN "quoteId";

ALTER TABLE public.symbol
ADD COLUMN "toId" integer NOT NULL;

ALTER TABLE public.symbol
ALTER COLUMN id TYPE integer;

// Adding id auto-increment sequence
CREATE SEQUENCE public.symbol_id_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

ALTER TABLE public.symbol_id_seq OWNER TO postgres;

ALTER SEQUENCE public.symbol_id_seq OWNED BY public.symbol.id;
`

const insertOldSymbols = `
INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (1, 2, 3, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (2, 2, 4, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (3, 2, 1, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (4, 2, 5, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (5, 2, 6, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (6, 3, 1, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (7, 3, 4, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (8, 3, 5, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (9, 3, 6, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (10, 1, 4, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (11, 1, 5, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (12, 1, 6, now(), now());

INSERT INTO public.symbol(id, base, to,  "createdAt", "updatedAt")
values (13, 5, 4, now(), now());
`
