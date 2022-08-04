/**
 * @fileoverview
 * May eventually be used as the Enhancer Gene Plot file, but need to type it incrementally.
 */

import { Stratification } from '../../view-config-types';

type Category = {
  name: string;
  size: number;
  index: number;
};

type CategoryAndIndex = {
  category: Category;
  index: number;
};

export function getCategories(stratification: Stratification): {
  [key: string]: Category;
} {
  const categories: { [key: string]: Category } = {};
  stratification.groups.forEach((group, i) => {
    categories[group.label] = {
      name: group.label,
      size: group.categories.length,
      index: i,
    };
  });
  return categories;
}

export function getSamples(stratification: Stratification): {
  [key: string]: CategoryAndIndex;
} {
  const categories = getCategories(stratification);
  const samples: { [key: string]: CategoryAndIndex } = {};
  stratification.groups.forEach((group, i) => {
    group.categories.forEach((categoryName: string, j: number) => {
      samples[categoryName] = {
        category: categories[group.label],
        index: j,
      };
    });
  });
  return samples;
}
