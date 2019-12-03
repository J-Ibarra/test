import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.ohlc_market_data (
      id SERIAL PRIMARY KEY,
      "symbolId" integer NOT NULL,
      "open" decimal(20,8) NOT NULL,
      "high" decimal(20,8) NOT NULL,
      "low" decimal(20,8) NOT NULL,
      "close" decimal(20,8) NOT NULL,
      "timeFrame" integer NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.ohlc_market_data OWNER TO postgres;

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-oneMinute', 'UTC', '* * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-fiveMinutes', 'UTC', '*/5 * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-fifteenMinutes', 'UTC', '*/15 * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-thirtyMinutes', 'UTC', '*/30 * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-oneHour', 'UTC', '0 * * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-fourHours', 'UTC', '0 0/4 * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-sixHours', 'UTC', '0 0/6 * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-twelveHours', 'UTC', '0 0/12 * * *', true, now(), now());

    INSERT INTO cron_schedule(name, timezone, cron, active, "createdAt", "updatedAt")
    values ('OHLCMarketDataReconciliation-timeFrame-twentyFourHours', 'UTC', '0 0 * * *', true, now(), now());
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    DROP TABLE public.ohlc_market_data;

    DELETE cron_schedule where name in (
      'OHLCMarketDataReconciliation-timeFrame-oneMinute',
      'OHLCMarketDataReconciliation-timeFrame-fiveMinutes',
      'OHLCMarketDataReconciliation-timeFrame-fifteenMinutes',
      'OHLCMarketDataReconciliation-timeFrame-thirtyMinutes',
      'OHLCMarketDataReconciliation-timeFrame-oneHour',
      'OHLCMarketDataReconciliation-timeFrame-fourHours',
      'OHLCMarketDataReconciliation-timeFrame-sixHours',
      'OHLCMarketDataReconciliation-timeFrame-twelveHours',
      'OHLCMarketDataReconciliation-timeFrame-twentyFourHours'
    );
  `)
}
