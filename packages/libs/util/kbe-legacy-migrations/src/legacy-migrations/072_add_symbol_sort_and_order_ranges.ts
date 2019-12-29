export async function up(queryInterface) {
  await queryInterface.sequelize.query(`
      ALTER TABLE public.symbol
      ADD COLUMN "sortOrder" INTEGER UNIQUE;

    UPDATE public.symbol SET "sortOrder" = 1 WHERE id = 'KAU_USD';
    UPDATE public.symbol SET "sortOrder" = 2 WHERE id = 'KAU_EUR';
    UPDATE public.symbol SET "sortOrder" = 3 WHERE id = 'ETH_KAU';
    UPDATE public.symbol SET "sortOrder" = 4 WHERE id = 'KVT_KAU';
    UPDATE public.symbol SET "sortOrder" = 5 WHERE id = 'KAU_KAG';
    UPDATE public.symbol SET "sortOrder" = 6 WHERE id = 'KAG_USD';
    UPDATE public.symbol SET "sortOrder" = 7 WHERE id = 'KAG_EUR';
    UPDATE public.symbol SET "sortOrder" = 8 WHERE id = 'ETH_KAG';
    UPDATE public.symbol SET "sortOrder" = 9 WHERE id = 'ETH_USD';
    UPDATE public.symbol SET "sortOrder" = 10 WHERE id = 'ETH_EUR';
    UPDATE public.symbol SET "sortOrder" = 11 WHERE id = 'KVT_KAG';
    UPDATE public.symbol SET "sortOrder" = 12 WHERE id = 'KVT_USD';
    UPDATE public.symbol SET "sortOrder" = 13 WHERE id = 'KVT_EUR';
    UPDATE public.symbol SET "sortOrder" = 14 WHERE id = 'KVT_ETH';
    UPDATE public.symbol SET "sortOrder" = 15 WHERE id = 'KAU_GBP';
    UPDATE public.symbol SET "sortOrder" = 16 WHERE id = 'KAG_GBP';
    UPDATE public.symbol SET "sortOrder" = 17 WHERE id = 'ETH_GBP';
    UPDATE public.symbol SET "sortOrder" = 18 WHERE id = 'KVT_GBP';

    UPDATE public.symbol SET "orderRange" = 0.3;
 `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`
      ALTER TABLE public.symbol
      DROP COLUMN "sortOrder",
  `)
}
