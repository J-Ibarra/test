export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
    CREATE TABLE public.vault_address (
        id SERIAL,
        "accountId" uuid REFERENCES public.account(id),
        "publicKey" character varying(255) NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.vault_address OWNER TO postgres;

    ALTER TABLE ONLY public.vault_address
        ADD CONSTRAINT vault_address_pkey PRIMARY KEY (id);
  `
  )
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(
    `DROP TABLE public.vault_address;`
  )
}
