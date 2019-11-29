import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TABLE public.currency_transaction (
      id SERIAL PRIMARY KEY,
      "currencyId" integer REFERENCES public.currency(id) NOT NULL,
      direction transaction_direction NOT NULL,
      amount numeric(20,8) NOT NULL,
      "accountId" uuid REFERENCES public.account(id) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.currency_transaction OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM currency_transaction;`)
}
