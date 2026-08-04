import { herbs, herbsCount } from '@/data/ingredients';

/** Read ingredients from static data (future: swap to API). */
export const getIngredients = async () => {
  await Promise.resolve();
  return { count: herbsCount, ingredients: herbs };
};
