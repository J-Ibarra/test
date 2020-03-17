export const createDefaultFeeTiersForSymbol = (symbolId: string): string => `
  INSERT INTO public.default_execution_fee("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
  values (${symbolId}, 1, 100000, 0.006, now(), now());

  INSERT INTO public.default_execution_fee("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
  values (${symbolId}, 2, 200000, 0.005, now(), now());

  INSERT INTO public.default_execution_fee("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
  values (${symbolId}, 3, 300000, 0.004, now(), now());

  INSERT INTO public.default_execution_fee("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
  values (${symbolId}, 4, 400000, 0.003, now(), now());

  INSERT INTO public.default_execution_fee("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
  values (${symbolId}, 5, 500000, 0.002, now(), now());
`
