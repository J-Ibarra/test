import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.bank_details (
      id SERIAL PRIMARY KEY,
      "accountHolderName" character varying(100) NOT NULL,
      "bankName" character varying(100) NOT NULL,
      iban character varying(30),
      "bankSwiftCode" character varying(30),
      "routingCode" character varying(30),
      "abaNumber" character varying(30),
      "accountNumber" character varying(30),
      "bankAddress" character varying(255),
      "notes" character varying(1000),
      "accountId" uuid REFERENCES public.account(id) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.bank_details OWNER TO postgres;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM public.bank_details;`)
}
