import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.order_match_transaction (
      id SERIAL PRIMARY KEY,
      status character varying(20) NOT NULL,
      "symbolId" integer REFERENCES public.symbol(id),
      amount numeric NOT NULL,
      "matchPrice" numeric NOT NULL,
      consideration numeric NOT NULL,
      "sellAccountId" uuid REFERENCES public.account(id),
      "sellOrderId" integer REFERENCES public.order(id),
      "sellOrderType" character varying NOT NULL,
      "buyAccountId" uuid REFERENCES public.account(id),
      "buyOrderId" integer REFERENCES public.order(id),
      "buyOrderType" character varying NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.order_match_transaction OWNER TO postgres;

    CREATE INDEX order_match_status_and_date ON order_match_transaction (status, "createdAt");
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    alter table order_match_transaction drop constraint order_match_status_and_date;
    DROP TABLE public.order_match_transaction;
  `)
}
