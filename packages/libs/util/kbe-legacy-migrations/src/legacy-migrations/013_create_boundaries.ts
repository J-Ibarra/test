import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  await sequelize.query(`
    CREATE TABLE public.boundary (
      id SERIAL,
      "symbolId" integer REFERENCES public.symbol(id),
      amount numeric(20,8) NOT NULL,
      price numeric(20,8) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    ALTER TABLE public.boundary OWNER TO postgres;

    ALTER TABLE ONLY public.boundary
      ADD CONSTRAINT boundary_pkey PRIMARY KEY (id);

    ${Array.from({ length: 13 }, (_, i) => {
      const symbolId = i + 1
      createInsertStatementForSymbolBoundary(symbolId)
    }).join(' ')
    }
  `)
}

export const createInsertStatementForSymbolBoundary = (symbolId): string => `
  INSERT INTO public.boundary("symbolId", amount, price, "createdAt", "updatedAt")
  values (${symbolId}, 0.00001, 0.00001, now(), now());
`

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query('DELETE FROM boundary')
}
