export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.session (
          id uuid NOT NULL,
          "userId" uuid REFERENCES public.user(id),
          expiry timestamp with time zone NOT NULL,
          deactivated boolean DEFAULT false,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );

      ALTER TABLE public.session OWNER TO postgres;

      ALTER TABLE ONLY public.session
          ADD CONSTRAINT session_pkey PRIMARY KEY (id);
    `
  )
}

export function down (queryInterface) {
  return queryInterface.sequelize.query(
    `DROP TABLE public.session;`
  )
}
