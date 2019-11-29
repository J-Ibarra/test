import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TABLE public.token (
      id uuid PRIMARY KEY,
      "accountId" uuid REFERENCES public.account(id),
      token text NOT NULL,
      deactivated boolean default false NOT NULL,
      expiry timestamp with time zone NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.token OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TABLE public.token;`)
}
