import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER SEQUENCE hin_km_sequence RESTART WITH 13451201;

  CREATE OR REPLACE FUNCTION
  next_hin()
  RETURNS TEXT
  LANGUAGE sql
  AS
  $$
      SELECT 'KM'||to_char(nextval('hin_km_sequence'), 'FM00000000'); 
  $$;
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  CREATE OR REPLACE FUNCTION
  next_hin()
  RETURNS TEXT
  LANGUAGE sql
  AS
  $$
      SELECT 'KM'||to_char(nextval('hin_km_sequence'), 'FM10000000'); 
  $$;
  `)
}
