import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    CREATE TABLE public.exchange_events (
      id SERIAL PRIMARY KEY,
      event json NOT NULL,
      "eventName" character varying (255) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.exchange_events OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query('DELETE FROM exchange_events;')
}
