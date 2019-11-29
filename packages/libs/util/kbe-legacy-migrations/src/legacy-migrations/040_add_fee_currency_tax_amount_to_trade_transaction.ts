import {Sequelize}  from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      RENAME COLUMN "taxAmount" TO "taxAmountCHF";
    ALTER TABLE public.trade_transaction
      ADD COLUMN "taxAmountFeeCurrency" decimal(30, 20);
  `)
}


export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      DROP COLUMN "taxAmountFeeCurrency";
    ALTER TABLE public.trade_transaction
      RENAME COLUMN "taxAmountCHF" TO "taxAmount";
  `)
}
