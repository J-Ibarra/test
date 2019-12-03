export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.deposit_address (
          id SERIAL,
          "accountId" uuid REFERENCES public.account(id),
          "currencyId" integer REFERENCES public.currency(id),
          "privateKey" character varying(255) NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );

      ALTER TABLE public.deposit_address OWNER TO postgres;

      ALTER TABLE ONLY public.deposit_address
          ADD CONSTRAINT deposit_address_pkey PRIMARY KEY (id);
    `,
  )
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.deposit_address;`)
}
