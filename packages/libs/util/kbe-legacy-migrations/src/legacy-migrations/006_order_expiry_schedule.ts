export function up (queryInterface) {
  return queryInterface.sequelize.query(`
    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('orderExpiry', 'UTC', '*/7 * * * * *', true, now(), now());
  `, {raw: true})
}

export function down (queryInterface) {
  queryInterface.sequelize.query(`
    delete from cron_schedule where name = 'orderExpiry';
  `, {raw: true})
}
