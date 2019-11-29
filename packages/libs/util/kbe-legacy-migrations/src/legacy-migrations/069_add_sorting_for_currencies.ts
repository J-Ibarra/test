import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.currency
      ADD COLUMN "symbolSortPriority" numeric (20,8),
      ADD COLUMN "currencyOrderPriority" numeric (20,8);

    UPDATE public.currency SET
    "symbolSortPriority" = 4, "currencyOrderPriority" = 3
    WHERE id = 1;

    UPDATE public.currency SET
    "symbolSortPriority" = 2, "currencyOrderPriority" = 1
    WHERE id = 2;

    UPDATE public.currency SET
    "symbolSortPriority" = 3, "currencyOrderPriority" = 2
    WHERE id = 3;

    UPDATE public.currency SET
    "symbolSortPriority" = 6, "currencyOrderPriority" = 4
    WHERE id = 4;

    UPDATE public.currency SET
    "symbolSortPriority" = 1, "currencyOrderPriority" = 5
    WHERE id = 5;

    UPDATE public.currency SET
    "symbolSortPriority" = 5, "currencyOrderPriority" = 6
    WHERE id = 6;

    UPDATE public.currency SET
    "symbolSortPriority" = 7, "currencyOrderPriority" = 7
    WHERE id = 7;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      DROP COLUMN "symbolSortPriority",
      DROP COLUMN "currencyOrderPriority";
  `)
}
