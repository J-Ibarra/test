import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (1, 2, 3, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (2, 2, 4, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (3, 2, 1, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (4, 2, 5, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (5, 2, 6, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (6, 3, 1, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (7, 3, 4, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (8, 3, 5, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (9, 3, 6, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (10, 1, 4, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (11, 1, 5, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (12, 1, 6, now(), now());

  INSERT INTO public.symbol(id, "baseId", "toId", "createdAt", "updatedAt")
  values (13, 5, 4, now(), now());
  `)
}

export function down(queryInterface) {
  return queryInterface.sequelize.query('DELETE FROM symbol')
}
