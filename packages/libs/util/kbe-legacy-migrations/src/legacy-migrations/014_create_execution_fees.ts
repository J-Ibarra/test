import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.default_execution_fee (
      id SERIAL,
      "symbolId" integer REFERENCES public.symbol(id),
      tier integer NOT NULL,
      threshold numeric(20,8) NOT NULL,
      rate numeric(20,8) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.default_execution_fee OWNER TO postgres;

    ALTER TABLE ONLY public.default_execution_fee
      ADD CONSTRAINT default_execution_fee_pkey PRIMARY KEY (id);

    ALTER TABLE public.default_execution_fee
      ADD constraint default_exec_fees_per_symbol_and_tier unique ("symbolId", "tier");
    
    CREATE TABLE public.account_execution_fee (
      id SERIAL,
      "accountId" uuid REFERENCES public.account(id),
      "symbolId" integer REFERENCES public.symbol(id),
      tier integer NOT NULL,
      threshold numeric(20,8) NOT NULL,
      rate numeric(20,8) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.account_execution_fee OWNER TO postgres;

    ALTER TABLE ONLY public.account_execution_fee
      ADD CONSTRAINT account_execution_fee_pkey PRIMARY KEY (id);

    ALTER TABLE public.account_execution_fee
      ADD constraint account_exec_fees_per_account_symbol_and_tier unique ("accountId", "symbolId", "tier");
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE default_execution_fee
      drop constraint default_execution_fee_pkey;

    ALTER TABLE default_execution_fee
      drop constraint default_exec_fees_per_symbol_and_tier;

    DROP TABLE default_execution_fee;

    ALTER TABLE account_execution_fee
      drop constraint account_execution_fee_pkey;

    ALTER TABLE account_execution_fee
      drop constraint account_exec_fees_per_symbol_and_tier;

    DROP TABLE account_execution_fee;
  `)
}
