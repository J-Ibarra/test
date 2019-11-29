import { v4 } from 'node-uuid'
import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  try {
    const accountId = v4()

    return sequelize.query(`
    INSERT INTO public.account(id, type, status, "createdAt", "updatedAt")
    values ('${accountId}', 'individual', 'registered', now(), now());

    INSERT INTO public.user(id, "accountId", email, "passwordHash", activated, "createdAt", "updatedAt")
    VALUES ('${v4()}','${accountId}', 'kinesis-api@coolwallet.io', '$2a$10$wFqGP.N3XY31DVKY4UI8FuuNzBAhOSMpwtwqFWtXrBXGe5pEbUPvm', true, now(), now())
    `)
  } catch (e) {
    console.log(e)
  }
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DELETE FROM ACCOUNT WHERE id=(SELECT 'accountId' from public.user where email='kinesis-api@coolwallet.io');

    DELETE FROM USER WHERE email='kinesis-api@coolwallet.io';
  `)
}
