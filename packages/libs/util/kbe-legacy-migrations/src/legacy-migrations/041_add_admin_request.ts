import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TYPE admin_request_type AS enum(
      'deposit', 'redemption','withdrawal');

    CREATE TYPE admin_status_type AS enum(
      'approved', 'pending', 'rejected');

    CREATE TABLE public.admin_request (
      id SERIAL PRIMARY KEY,
      client character varying(80) NOT NULL,
      hin integer,
      type admin_request_type NOT NULL,
      description character varying(255) NOT NULL,
      asset character varying(3) NOT NULL,
      amount integer NOT NULL,
      fee integer, 
      admin character varying(80) NOT NULL,
      status admin_status_type NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.admin_request OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  DROP TABLE public.admin_request;  
  DROP TYPE public.admin_request_type;
  DROP TYPE public.admin_status_type;
  `)
}
