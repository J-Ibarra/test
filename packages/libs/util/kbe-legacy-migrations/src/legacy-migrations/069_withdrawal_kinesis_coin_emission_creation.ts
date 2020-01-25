import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
  CREATE TABLE public.withdrawal_kinesis_coin_emission (
    id SERIAL PRIMARY KEY,
    "txEnvelope" text UNIQUE,
    "sequence" BIGINT NOT NULL,
    "currency" character varying(20),
    "notes" character varying(1000),
    "withdrawalRequestId" integer REFERENCES public.withdrawal_request(id) NOT NULL UNIQUE,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
  );

  ALTER TABLE ONLY withdrawal_kinesis_coin_emission ADD CONSTRAINT currency_sequence unique ("currency", "sequence");

  ALTER TABLE public.withdrawal_kinesis_coin_emission OWNER TO postgres;
`)
}

export async function down({ sequelize }) {
  return sequelize.query(`
   DROP TABLE withdrawal_kinesis_coin_emission;
  `)
}
