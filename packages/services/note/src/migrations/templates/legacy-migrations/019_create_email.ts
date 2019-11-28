import { Sequelize } from 'sequelize'
import { NotificationStatus } from '../../notification/interfaces'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.email (
      id SERIAL PRIMARY KEY,
      "to" character varying(255) NOT NULL,
      cc character varying(255),
      bcc character varying(255),
      "fromName" character varying(255),
      "templateContent" json NOT NULL,
      "templateName" character varying(255) NOT NULL,
      subject character varying(255) NOT NULL,
      "notificationStatus" character varying(255) DEFAULT :created,
      "mandrillResult" json,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.email OWNER TO postgres;
  `, { replacements: { created: NotificationStatus.created }})

}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM public.email;`)
}
