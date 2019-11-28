import { v4 } from 'node-uuid'
import { Sequelize } from 'sequelize'
import { Account, AccountStatus, AccountType, User } from '../../accounts'
import { getModel } from '../abx_modules'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  try {
    const accountId = v4()
    await getModel<Account>('account').create({
      id: accountId,
      type: AccountType.individual,
      status: AccountStatus.registered,
      suspended: false,
    })

    return sequelize.query(`
    INSERT INTO public.user(id, "accountId", email, "passwordHash", activated, "createdAt", "updatedAt")
    VALUES ('${v4()}','${accountId}', 'marketing@abx.com', '$2a$10$.EbXf8mjgTSjelfCqCQd/.RsJQhk69GHBf2WReWbdHZwRtTVb4e/a', true, now(), now())
    `)
  } catch (e) {
    console.log(e)
  }
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  const marketingAccountInstance = await getModel<Account>('account').findOne({
    include: [
      {
        model: getModel<User>('user'),
        as: 'users',
        where: { email: 'marketing@abx.com' },
      },
    ],
  })

  const marketingAccount = marketingAccountInstance.get()

  return sequelize.query(`
    DELETE FROM ACCOUNT WHERE id='${marketingAccount.id}';

    DELETE FROM USER WHERE email='marketing@abx.com';
  `)
}
