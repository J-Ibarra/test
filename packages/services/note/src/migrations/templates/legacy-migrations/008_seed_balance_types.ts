import { BalanceType } from '../../balances'

export async function up(queryInterface) {
  return queryInterface.sequelize.models.balanceType.bulkCreate([
    { type: BalanceType.available },
    { type: BalanceType.reserved },
    { type: BalanceType.pendingWithdrawal },
    { type: BalanceType.pendingDeposit },
  ])
}

export function down (queryInterface) {
  return queryInterface.sequelize.query(
    `DELETE FROM public.balance_type where id > 0;`
  )
}
