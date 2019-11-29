export function up(queryInterface) {
  return queryInterface.sequelize.query(
    `
      CREATE TABLE public.deposit_request (
          id SERIAL,
          "depositAddressId" integer REFERENCES public.deposit_address(id),
          amount DECIMAL(20,8) NOT NULL,
          "txHash" character varying(255),
          "isConfirmed" boolean DEFAULT false NOT NULL,
          "createdAt" timestamp with time zone NOT NULL,
          "updatedAt" timestamp with time zone NOT NULL,
          "from" character varying(255)
      );

      ALTER TABLE public.deposit_request OWNER TO postgres;

      ALTER TABLE ONLY public.deposit_request
          ADD CONSTRAINT deposit_request_pkey PRIMARY KEY (id);
    `
  )
}

export function down (queryInterface) {
  return queryInterface.sequelize.query(
    `DROP TABLE public.deposit_request;`
  )
}
