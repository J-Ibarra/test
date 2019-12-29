export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
  INSERT INTO exchange_config
  VALUES (9, '{"excludedAccountTypesFromOrderRanges":["admin"]}');
 `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`
  DELETE FROM exchange_config WHERE id=9;
  `)
}
