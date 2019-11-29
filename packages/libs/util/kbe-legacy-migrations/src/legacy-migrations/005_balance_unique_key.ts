export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
    alter table balance
      add constraint account_balance unique ("accountId", "currencyId", "balanceTypeId");
  `)
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`
    alter table balance
      drop constraint account_balance;
  `)
}
