import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(
    `
    CREATE SEQUENCE hin_km_sequence;
    CREATE OR REPLACE FUNCTION
    next_hin()
    RETURNS TEXT
    LANGUAGE sql
    AS
    $$
        SELECT 'KM'||to_char(nextval('hin_km_sequence'), 'FM10000000'); 
    $$;

    ALTER TABLE public.account DROP COLUMN hin;

    ALTER TABLE public.account ADD COLUMN hin character varying(10) DEFAULT next_hin();

    ALTER TABLE public.admin_request DROP COLUMN hin;
    ALTER TABLE public.admin_request ADD COLUMN hin character varying(10);
  `,
  )
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.account DROP COLUMN hin;
  ALTER TABLE public.account ADD COLUMN hin integer DEFAULT nextval('public.hin_sequence_seq'::regclass);

  DROP SEQUENCE hin_km_sequence;

  ALTER TABLE public.admin_request DROP COLUMN hin;
  ALTER TABLE public.admin_request ADD COLUMN hin integer;
  `)
}
