export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.note (
          id SERIAL PRIMARY KEY,
          "title" character varying(255) NOT NULL,
          "description" character varying(255) NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL
      );

      ALTER TABLE public.note OWNER TO postgres;
    `,
  )
}

export function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.note;`)
}
