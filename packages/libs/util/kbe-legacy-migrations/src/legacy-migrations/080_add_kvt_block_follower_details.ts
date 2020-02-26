export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    `insert into blockchain_follower_details ("currencyId", "lastBlockNumberProcessed", "createdAt", "updatedAt") values (4, 0, now(), now())`,
  )
}

export async function down({ sequelize }) {
  return sequelize.query(`
    delete from blockchain_follower_details bfd where bdf."currencyId" = 4
  `)
}
