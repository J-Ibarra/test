import {Sequelize}  from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      ADD COLUMN "taxRate" decimal(20,8),
      ADD COLUMN "taxAmount" decimal(20,8);
  `)
}


export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      DROP COLUMN "taxRate",
      DROP COLUMN "taxAmount";
  `)
}
