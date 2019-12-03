export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
    CREATE TABLE public.exchange_config (
        id SERIAL,
        config JSON
    );

    ALTER TABLE public.exchange_config OWNER TO postgres;

    ALTER TABLE ONLY public.exchange_config
        ADD CONSTRAINT exchange_config_pkey PRIMARY KEY (id);
  `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`DROP TABLE public.exchange_config;`)
}
