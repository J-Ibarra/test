import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TABLE public.withdrawal_request (
        id SERIAL PRIMARY KEY,
        address character varying(255),
        amount numeric(20,8) NOT NULL,
        state withdrawal_state NOT NULL,
        "accountId" uuid REFERENCES public.account(id),
        "currencyId" integer REFERENCES public.currency(id),
        "txHash" character varying(255),
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.withdrawal_request OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TABLE public.withdrawal_request;`)
}
