import { Stratification } from '../../state/stratification-state';
import {
  CategoryNameToDnaAccessibilityCategoryMap,
  DnaAccessibilityCategory,
} from '../../view-config-types';

export function createCategoryMap(
  stratification: Stratification
): CategoryNameToDnaAccessibilityCategoryMap {
  return stratification.groups.reduce(
    (row: { [key: string]: DnaAccessibilityCategory }, group, index) => {
      const category: DnaAccessibilityCategory = {
        label: group.label,
        color: group.axisLabelColor,
        background: group.axisLabelBackground,
        index,
      };
      group.categories.forEach((sample) => {
        row[sample] = category;
      });
      return row;
    },
    {}
  );
}
