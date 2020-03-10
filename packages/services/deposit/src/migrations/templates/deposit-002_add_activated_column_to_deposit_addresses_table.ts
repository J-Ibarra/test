import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_address
      ADD COLUMN "transactionTrackingActivated" boolean DEFAULT false NOT NULL;
  
    ALTER TABLE public.deposit_address
      ADD COLUMN "address" character varying(100);
    
    ALTER TABLE public.deposit_address
      ADD COLUMN "encryptedWif" character varying(255);
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.deposit_address
        DROP COLUMN "transactionTrackingActivated";

    ALTER TABLE public.deposit_address
      DROP COLUMN "address";

    ALTER TABLE public.deposit_address
      DROP COLUMN "encryptedWif";
  `)
}
