import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    ALTER TABLE public.bank_details
      ALTER COLUMN "accountHolderName" TYPE character varying(1000);

    ALTER TABLE public.bank_details
      ALTER COLUMN "bankName" TYPE character varying(1000);

    ALTER TABLE public.bank_details
      ALTER COLUMN "iban" TYPE character varying(1000);

    ALTER TABLE public.bank_details
      ALTER COLUMN "bankSwiftCode" TYPE character varying(1000);
    
    ALTER TABLE public.bank_details
      ALTER COLUMN "routingCode" TYPE character varying(1000);

    ALTER TABLE public.bank_details
      ALTER COLUMN "abaNumber" TYPE character varying(1000);
  
    ALTER TABLE public.bank_details
      ALTER COLUMN "accountNumber" TYPE character varying(1000);
  
    ALTER TABLE public.bank_details
      ALTER COLUMN "bankAddress" TYPE character varying(1000);

    ALTER TABLE public.bank_details
      ALTER COLUMN "notes" TYPE character varying(1000);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.bank_details
  ALTER COLUMN "accountHolderName" TYPE character varying(100);

ALTER TABLE public.bank_details
  ALTER COLUMN "bankName" TYPE character varying(100);

ALTER TABLE public.bank_details
  ALTER COLUMN "iban" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "bankSwiftCode" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "routingCode" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "abaNumber" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "accountNumber" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "bankAddress" TYPE character varying(30);

ALTER TABLE public.bank_details
  ALTER COLUMN "notes" TYPE character varying(30);
  `)
}
