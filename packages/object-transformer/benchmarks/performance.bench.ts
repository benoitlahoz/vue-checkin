import { bench, describe } from 'vitest';
import { applyRecipe } from '../src/recipe/delta-applier';
import { scenarios, transforms } from './scenarios';

// Generate datasets
const smallDataSimple = scenarios.find((s) => s.id === 'simple')!.dataGenerator(10);
const mediumDataSimple = scenarios.find((s) => s.id === 'simple')!.dataGenerator(1000);
const largeDataSimple = scenarios.find((s) => s.id === 'simple')!.dataGenerator(10000);

// 2. Define Benchmarks
describe('Object Transformer Performance', () => {
  // Dataset Size Scaling (using Simple Recipe)
  bench('Scaling: Small (10 items)', () => {
    applyRecipe(smallDataSimple, scenarios.find((s) => s.id === 'simple')!.recipe, transforms);
  });

  bench('Scaling: Medium (1,000 items)', () => {
    applyRecipe(mediumDataSimple, scenarios.find((s) => s.id === 'simple')!.recipe, transforms);
  });

  bench('Scaling: Large (10,000 items)', () => {
    applyRecipe(largeDataSimple, scenarios.find((s) => s.id === 'simple')!.recipe, transforms);
  });

  // Complexity Scaling (using Large Dataset)
  scenarios.forEach((scenario) => {
    bench(`Complexity: ${scenario.name}`, () => {
      applyRecipe(largeDataSimple, scenario.recipe, transforms);
    });
  });
});
