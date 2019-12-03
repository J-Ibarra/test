export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
    CREATE TABLE public.stored_reports (
        id SERIAL PRIMARY KEY,
        "accountId" uuid REFERENCES public.account(id),
        "reportType" text NOT NULL,
        "s3Key" text NOT NULL, 
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL
    );`)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.stored_reports;`)
}
