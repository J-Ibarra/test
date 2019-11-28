import {Sequelize}  from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      ALTER COLUMN "taxAmount" TYPE decimal(30,20);
  `)
}


export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.trade_transaction
      ALTER COLUMN "taxAmount" TYPE decimal(20,8);
  `)
}
