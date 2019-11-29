import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE ONLY public.vault_address
        ADD CONSTRAINT vault_address_unique_account_id UNIQUE ("accountId");
    ALTER TABLE ONLY public.vault_address
        ADD CONSTRAINT vault_address_unique_public_key UNIQUE ("publicKey");
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.vault_address
        DROP CONSTRAINT vault_address_unique_account_id;
    ALTER TABLE public.vault_address     
        DROP CONSTRAINT vault_address_unique_public_key;
  `)
}
