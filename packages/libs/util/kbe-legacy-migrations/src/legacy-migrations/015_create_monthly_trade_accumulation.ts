import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TABLE public.monthly_trade_accumulation (
      id SERIAL,
      "accountId" UUID REFERENCES public.account(id),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total numeric(20,8) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.monthly_trade_accumulation OWNER TO postgres;

    ALTER TABLE ONLY public.monthly_trade_accumulation
      ADD CONSTRAINT monthly_trade_accumulation_pkey PRIMARY KEY (id);

    ALTER TABLE public.monthly_trade_accumulation
      ADD constraint trade_vol_per_acc_per_month unique ("accountId", "month", "year");
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE monthly_trade_accumulation
      drop constraint trade_vol_per_acc_per_month;

    DROP TABLE monthly_trade_accumulation;
  `)
}
