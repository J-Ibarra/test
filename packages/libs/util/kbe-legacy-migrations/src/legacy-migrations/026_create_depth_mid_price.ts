import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.depth_mid_price (
      id SERIAL PRIMARY KEY,
      "symbolId" integer NOT NULL,
      "price" decimal(20,8) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.depth_mid_price OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DROP TABLE public.depth_mid_price;
  `)
}
