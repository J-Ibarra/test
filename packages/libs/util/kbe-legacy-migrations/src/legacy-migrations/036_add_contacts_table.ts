export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
    CREATE TABLE public.contacts (
        id SERIAL,
        "accountId" uuid REFERENCES public.account(id) NOT NULL,
        "currencyCode" character varying(255) REFERENCES public.currency(code) NOT NULL,
        name character varying(50) NOT NULL,
        "publicKey" character varying(255) NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.contacts OWNER TO postgres;
  `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.contacts;`)
}
