import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  ALTER TABLE public.currency
  ADD COLUMN "isEnabled" BOOLEAN DEFAULT true;

  INSERT INTO currency(code, "createdAt", "updatedAt", "isEnabled")
  values ('GBP', now(), now(), FALSE);

  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt")
  VALUES ('KAU_GBP', 2, 7, 2, FALSE, now(), now());

  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt")
  VALUES ('KAG_GBP', 3, 7, 3, FALSE, now(), now());

  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt")
  VALUES ('ETH_GBP', 1, 3, 1, FALSE, now(), now());

  INSERT INTO public.symbol(id, "baseId", "quoteId", "feeId", "isEnabled", "createdAt", "updatedAt")
  VALUES ('KVT_GBP', 4, 7, 7, FALSE, now(), now());
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
     DELETE FROM public.currency where code = 'GBP';
     DELETE FROM public.symbol where id in ['KAU_GBP', 'KAG_GBP', 'ETH_GBP', 'KVT_GBP'];
     ALTER TABLE public.currency DROP COLUMN "isEnabled";
  `)
}
