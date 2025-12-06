import type { Reporter } from 'vitest/reporters';
import type { File, Task } from 'vitest';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { scenarios, transforms } from './scenarios';
import { applyRecipe } from '../src/recipe/recipe-applier';

export default class MarkdownReporter implements Reporter {
  async onFinished(files: File[]) {
    let md = '# Performance Benchmarks\n\n';
    md += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

    // 1. Scenarios Description & Output
    md += '## Benchmark Scenarios & Outputs\n\n';

    for (const scenario of scenarios) {
      md += `### ${scenario.name}\n`;
      md += `${scenario.description}\n\n`;

      // Generate output example
      const input = scenario.sampleInput;
      const output = applyRecipe(input, scenario.recipe, transforms);

      md += '<details>\n<summary>View Input Data</summary>\n\n';
      md += '```json\n' + JSON.stringify(input, null, 2) + '\n```\n';
      md += '</details>\n\n';

      md += '<details>\n<summary>View Output Data</summary>\n\n';
      md += '```json\n' + JSON.stringify(output, null, 2) + '\n```\n';
      md += '</details>\n\n';

      md += '---\n\n';
    }

    // 2. Collect Results
    const results: {
      name: string;
      hz: number;
      mean: number;
      p99: number;
      samples: number;
    }[] = [];

    const processTask = (task: Task) => {
      if (task.type === 'suite') {
        task.tasks.forEach(processTask);
        return;
      }

      if (task.mode === 'run' && task.result?.benchmark) {
        const bench = task.result.benchmark;

        // @ts-expect-error - sampleCount is available in the runtime object
        const sampleCount = bench.sampleCount || bench.samples?.length || 0;

        results.push({
          name: task.name,
          hz: bench.hz,
          mean: bench.mean,
          p99: bench.p99,
          samples: sampleCount,
        });
      }
    };

    for (const file of files) {
      for (const task of file.tasks) {
        processTask(task);
      }
    }

    // 3. Results Table
    md += '## Results\n\n';
    md += '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |\n';
    md += '| :--- | :--- | :--- | :--- | :--- |\n';

    results.forEach((res) => {
      md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} |\n`;
    });
    md += '\n';

    // 4. Comparisons (Fastest to Slowest)
    md += '## Performance Comparison\n\n';

    if (results.length > 0) {
      // Sort by Hz descending (Fastest first)
      const sorted = [...results].sort((a, b) => b.hz - a.hz);
      const fastest = sorted[0];

      md += `**${fastest.name}** is the fastest.\n\n`;

      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const timesSlower = (fastest.hz / current.hz).toFixed(2);
        md += `- **${timesSlower}x** faster than *${current.name}*\n`;
      }
    }

    await writeFile(resolve(__dirname, '..', 'PERFORMANCE.md'), md);
    console.log('\nBenchmark report generated at benchmarks/PERFORMANCE.md');
  }
}
