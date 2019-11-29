import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.email_attachment (
      id SERIAL PRIMARY KEY,
      name character varying(255) NOT NULL,
      type character varying(255) NOT NULL,
      content text NOT NULL,
      "emailId" integer REFERENCES public.email(id) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.email_attachment OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM public.email_attachment;`)
}
