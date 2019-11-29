import { v4 } from 'node-uuid'
import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  try {
    const accountId = v4()

    return sequelize.query(`
    INSERT INTO public.account(id, type, status, "createdAt", "updatedAt")
    values ('${accountId}', 'individual', 'registered', now(), now());

    INSERT INTO public.user(id, "accountId", email, "passwordHash", activated, "createdAt", "updatedAt")
    VALUES ('${v4()}','${accountId}', 'marketing@abx.com', '$2a$10$.EbXf8mjgTSjelfCqCQd/.RsJQhk69GHBf2WReWbdHZwRtTVb4e/a', true, now(), now())
    `)
  } catch (e) {
    console.log(e)
  }
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM ACCOUNT WHERE id=(SELECT 'accountId' from public.user where email='marketing@abx.com');

    DELETE FROM USER WHERE email='marketing@abx.com';
  `)
}
