export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.balance_type (
          id SERIAL,
          type character varying(255) NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );

      ALTER TABLE public.balance_type OWNER TO postgres;

      ALTER TABLE ONLY public.balance_type
          ADD CONSTRAINT balance_type_pkey PRIMARY KEY (id);

      ALTER TABLE ONLY public."balance"
        ADD CONSTRAINT "balance_balanceType_fkey" FOREIGN KEY ("balanceTypeId") REFERENCES public.balance_type(id);
    `,
  )
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.balance_type;`)
}
