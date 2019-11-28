import { Sequelize } from 'sequelize'

import { CurrencyCode } from '../../symbols'
import { createInsertStatementForSymbolBoundary } from './013_create_boundaries'

const currencyBoundaryValues = [
  { currencyId: 4, currencyCode: CurrencyCode.kvt, minAmount: 1, maxDecimals: 0 },
  { currencyId: 5, currencyCode: CurrencyCode.usd, minAmount: 0.01, maxDecimals: 2 },
  { currencyId: 6, currencyCode: CurrencyCode.euro, minAmount: 0.01, maxDecimals: 2 },
  { currencyId: 2, currencyCode: CurrencyCode.kau, minAmount: 0.00001, maxDecimals: 5 },
  { currencyId: 3, currencyCode: CurrencyCode.kag, minAmount: 0.00001, maxDecimals: 5 },
  { currencyId: 1, currencyCode: CurrencyCode.ethereum, minAmount: 0.000001, maxDecimals: 6 }
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    DELETE FROM public.boundary;

    ALTER TABLE public.boundary DROP COLUMN "symbolId";

    ALTER TABLE public.boundary
      ADD COLUMN "currencyId" integer REFERENCES public.currency(id);

    ALTER TABLE public.boundary
      ADD COLUMN "currencyCode" character varying(3) NOT NULL;

    ALTER TABLE public.boundary RENAME COLUMN amount to "minAmount";
    ALTER TABLE public.boundary RENAME COLUMN price to "maxDecimals";
    ALTER TABLE public.boundary ALTER COLUMN "maxDecimals" TYPE integer;

    ${insertCurrencyBoundaryValues(currencyBoundaryValues)}
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    DELETE FROM public.boundary;

    ALTER TABLE public.boundary ALTER COLUMN "maxDecimals" TYPE numeric(20,8);
    ALTER TABLE public.boundary RENAME COLUMN "maxDecimals" to price;
    ALTER TABLE public.boundary RENAME COLUMN "minAmount" to amount;

    ALTER TABLE public.boundary DROP COLUMN "currencyId";
    ALTER TABLE public.boundary DROP COLUMN "currencyCode";

    ALTER TABLE public.boundary ADD COLUMN "symbolId" character varying(7) REFERENCES public.symbol(id);

    ${Array.from({ length: 13 }, (_, i) => {
        const symbolId = i + 1
        createInsertStatementForSymbolBoundary(symbolId)
      }).join(' ')
    }}
  `)
}

function insertCurrencyBoundaryValues(rows: Array<{ currencyId: number, currencyCode: CurrencyCode, minAmount: number, maxDecimals: number }>) {
  return rows.map(({ currencyId, currencyCode, minAmount, maxDecimals }) =>
    `INSERT INTO public.boundary("currencyId", "currencyCode", "minAmount", "maxDecimals", "createdAt", "updatedAt")
      values (${currencyId}, '${currencyCode}', ${minAmount}, ${maxDecimals}, now(), now());`
  ).join(' ')
}
