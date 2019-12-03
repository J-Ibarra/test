export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.balance_adjustment (
          id SERIAL,
          "balanceId" integer REFERENCES public.balance(id),
          "sourceEventType" character varying(255) NOT NULL,
          "sourceEventId" integer NOT NULL,
          delta numeric DEFAULT 0,
          value numeric DEFAULT 0,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );

      ALTER TABLE public.balance_adjustment OWNER TO postgres;

      ALTER TABLE ONLY public.balance_adjustment
          ADD CONSTRAINT balance_adjustment_pkey PRIMARY KEY (id);
    `,
  )
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.balance_adjustment;`)
}
