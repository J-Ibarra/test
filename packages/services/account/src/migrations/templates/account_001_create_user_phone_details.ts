import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.user_phone_details (
      id uuid PRIMARY KEY,
      "userId" uuid REFERENCES public.user(id),
      "notificationsToken" varchar (255),
      "pinCodeHash" varchar (255),
      "uuidPhone" varchar (255),
      "verificationCodePhone" integer,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.user_phone_details OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DROP TABLE public.user_phone_details;`)
}
