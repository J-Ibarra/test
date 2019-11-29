export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
    DELETE FROM cron_schedule where name = 'depositChecker';

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker_KAU', 'UTC', '*/30 * * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker_KAG', 'UTC', '*/30 * * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker_ETH', 'UTC', '* */5 * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker_KVT', 'UTC', '* */5 * * *', true, now(), now());
  `,
    { raw: true },
  )
}

export function down(queryInterface) {
  queryInterface.sequelize.query(
    `
    DELETE FROM cron_schedule where name in ['depositChecker_KAU', 'depositChecker_KAG', 'depositChecker_ETH', 'depositChecker_KVT'];
    
    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('depositChecker', 'UTC', '*/30 * * * * *', true, now(), now());
  `,
    { raw: true },
  )
}
