import type { Reporter } from 'vitest/reporters';
import type { File, Task } from 'vitest';
import { writeFile, readFile, rename, unlink } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { scenarios, transforms } from './scenarios';
import { applyRecipe } from '../src/recipe/delta-applier';

interface BenchmarkResult {
  name: string;
  hz: number;
  mean: number;
  p99: number;
  samples: number;
}

interface PerformanceSnapshot {
  date: string;
  timestamp: number;
  results: BenchmarkResult[];
}

export default class MarkdownReporter implements Reporter {
  async onFinished(files: File[]) {
    // Load previous snapshot if exists for comparison
    const benchmarkDir = resolve(__dirname);
    const currentPath = resolve(benchmarkDir, 'performance.current.json');
    const baselinePath = resolve(benchmarkDir, 'performance.baseline.json');

    let previousSnapshot: PerformanceSnapshot | null = null;
    let baselineSnapshot: PerformanceSnapshot | null = null;

    if (existsSync(currentPath)) {
      try {
        const content = await readFile(currentPath, 'utf-8');
        previousSnapshot = JSON.parse(content);
      } catch {
        // Ignore if can't read
      }
    }

    // Load baseline (reference performance)
    if (existsSync(baselinePath)) {
      try {
        const content = await readFile(baselinePath, 'utf-8');
        baselineSnapshot = JSON.parse(content);
      } catch {
        // Ignore if can't read
      }
    }

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

    // Check if we have previous and baseline results to compare
    const previousMap = new Map(previousSnapshot?.results.map((r) => [r.name, r]) || []);
    const baselineMap = new Map(baselineSnapshot?.results.map((r) => [r.name, r]) || []);
    const hasPrevious = previousMap.size > 0;
    const hasBaseline = baselineMap.size > 0;

    if (hasPrevious && hasBaseline) {
      md += `### Current Results (vs ${previousSnapshot!.date} and baseline)\n\n`;
      md +=
        '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples | vs Previous | vs Baseline |\n';
      md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

      results.forEach((res) => {
        const prev = previousMap.get(res.name);
        const baseline = baselineMap.get(res.name);

        let prevChangeStr = '';
        if (prev) {
          const changePercent = ((res.hz - prev.hz) / prev.hz) * 100;
          const icon = changePercent > 5 ? '🟢' : changePercent < -5 ? '🔴' : '⚪';
          const sign = changePercent > 0 ? '+' : '';
          prevChangeStr = `${icon} ${sign}${changePercent.toFixed(1)}%`;
        } else {
          prevChangeStr = '🆕 NEW';
        }

        let baselineChangeStr = '';
        if (baseline) {
          const changePercent = ((res.hz - baseline.hz) / baseline.hz) * 100;
          const icon = changePercent > 5 ? '🟢' : changePercent < -5 ? '🔴' : '⚪';
          const sign = changePercent > 0 ? '+' : '';
          baselineChangeStr = `${icon} ${sign}${changePercent.toFixed(1)}%`;
        } else {
          baselineChangeStr = '—';
        }

        md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} | ${prevChangeStr} | ${baselineChangeStr} |\n`;
      });
    } else if (hasPrevious) {
      md += `### Current Results (vs ${previousSnapshot!.date})\n\n`;
      md += '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples | vs Previous |\n';
      md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

      results.forEach((res) => {
        const prev = previousMap.get(res.name);
        let changeStr = '';

        if (prev) {
          const changePercent = ((res.hz - prev.hz) / prev.hz) * 100;
          const icon = changePercent > 5 ? '🟢' : changePercent < -5 ? '🔴' : '⚪';
          const sign = changePercent > 0 ? '+' : '';
          changeStr = `${icon} ${sign}${changePercent.toFixed(1)}%`;
        } else {
          changeStr = '🆕 NEW';
        }

        md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} | ${changeStr} |\n`;
      });
    } else {
      md += '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |\n';
      md += '| :--- | :--- | :--- | :--- | :--- |\n';

      results.forEach((res) => {
        md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} |\n`;
      });
    }
    md += '\n';

    // 3b. Previous Results Table (if exists)
    if (hasPrevious && previousSnapshot) {
      md += '### Previous Results\n\n';
      md += '<details>\n<summary>View previous benchmark results</summary>\n\n';
      md += `**Date:** ${previousSnapshot.date}\n\n`;
      md += '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |\n';
      md += '| :--- | :--- | :--- | :--- | :--- |\n';

      previousSnapshot.results.forEach((res) => {
        md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} |\n`;
      });

      md += '\n</details>\n\n';
    }

    // 3c. Baseline Results Table (if exists)
    if (hasBaseline && baselineSnapshot) {
      md += '### Baseline Reference\n\n';
      md += '<details>\n<summary>View baseline benchmark results</summary>\n\n';
      md += `**Date:** ${baselineSnapshot.date}\n`;
      if ('version' in baselineSnapshot) {
        md += `**Version:** ${(baselineSnapshot as any).version}\n`;
      }
      if ('description' in baselineSnapshot) {
        md += `**Description:** ${(baselineSnapshot as any).description}\n`;
      }
      md += '\n';
      md += '| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |\n';
      md += '| :--- | :--- | :--- | :--- | :--- |\n';

      baselineSnapshot.results.forEach((res) => {
        md += `| ${res.name} | ${res.hz.toFixed(2)} | ${res.mean.toFixed(4)} | ${res.p99.toFixed(4)} | ${res.samples} |\n`;
      });

      md += '\n</details>\n\n';
    }

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

    // 5. Save JSON snapshots for comparison and update baseline if improved
    await this.savePerformanceSnapshot(results, baselineSnapshot);
  }

  /**
   * Save current performance results and compare with previous run
   * Maintains only 2 JSON files: current.json and previous.json
   * Updates baseline if performance improved
   */
  private async savePerformanceSnapshot(
    results: BenchmarkResult[],
    baselineSnapshot: PerformanceSnapshot | null
  ): Promise<void> {
    const benchmarkDir = resolve(__dirname);
    const currentPath = resolve(benchmarkDir, 'performance.current.json');
    const previousPath = resolve(benchmarkDir, 'performance.previous.json');
    const baselinePath = resolve(benchmarkDir, 'performance.baseline.json');

    const snapshot: PerformanceSnapshot = {
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      results,
    };

    // Load previous snapshot if exists
    let previousSnapshot: PerformanceSnapshot | null = null;
    if (existsSync(currentPath)) {
      try {
        const content = await readFile(currentPath, 'utf-8');
        previousSnapshot = JSON.parse(content);
      } catch {
        console.warn('Warning: Could not read previous performance snapshot');
      }
    }

    // Rotate files: current → previous
    if (previousSnapshot) {
      // Delete old previous.json if it exists
      if (existsSync(previousPath)) {
        await unlink(previousPath);
      }
      // Rename current.json to previous.json
      await rename(currentPath, previousPath);
      console.log('Previous results saved to performance.previous.json');
    }

    // Save new current.json
    await writeFile(currentPath, JSON.stringify(snapshot, null, 2));
    console.log('Current results saved to performance.current.json');

    // Check if we should update baseline (if performance improved)
    if (baselineSnapshot) {
      const shouldUpdate = this.checkBaselineUpdate(results, baselineSnapshot);
      if (shouldUpdate.update) {
        const updatedBaseline = {
          date: snapshot.date,
          timestamp: snapshot.timestamp,
          version: 'v4.0.0',
          description: 'Baseline performance (updated after improvements)',
          results,
        };
        await writeFile(baselinePath, JSON.stringify(updatedBaseline, null, 2));
        console.log(
          `\n🎉 Baseline updated! ${shouldUpdate.improvedCount} benchmark(s) showed improvement`
        );
      }
    }

    // Compare and display differences
    if (previousSnapshot) {
      this.displayComparison(previousSnapshot, snapshot);
    }
  }

  /**
   * Check if baseline should be updated based on performance improvements
   * Returns true if majority of benchmarks improved
   */
  private checkBaselineUpdate(
    current: BenchmarkResult[],
    baseline: PerformanceSnapshot
  ): { update: boolean; improvedCount: number } {
    const baselineMap = new Map(baseline.results.map((r) => [r.name, r]));
    let improvedCount = 0;
    let totalComparable = 0;

    for (const result of current) {
      const baselineResult = baselineMap.get(result.name);
      if (baselineResult) {
        totalComparable++;
        // Consider improvement if current is at least 5% faster
        if (result.hz > baselineResult.hz * 1.05) {
          improvedCount++;
        }
      }
    }

    // Update baseline if at least 50% of benchmarks improved
    const shouldUpdate = totalComparable > 0 && improvedCount >= totalComparable * 0.5;
    return { update: shouldUpdate, improvedCount };
  }

  /**
   * Display performance comparison between two snapshots
   */
  private displayComparison(previous: PerformanceSnapshot, current: PerformanceSnapshot): void {
    console.log('\n📊 Performance Comparison (vs previous run)');
    console.log(`Previous: ${previous.date} | Current: ${current.date}\n`);

    const resultsMap = new Map(current.results.map((r) => [r.name, r]));
    const previousMap = new Map(previous.results.map((r) => [r.name, r]));

    let improvements = 0;
    let regressions = 0;

    console.log('┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ Benchmark                          │ Previous  │ Current   │ Change │');
    console.log('├─────────────────────────────────────────────────────────────────────┤');

    for (const [name, currentResult] of resultsMap) {
      const previousResult = previousMap.get(name);

      if (!previousResult) {
        console.log(
          `│ ${this.pad(name, 34)} │ ${this.pad('N/A', 9)} │ ${this.pad(this.formatHz(currentResult.hz), 9)} │ ${this.pad('NEW', 6)} │`
        );
        continue;
      }

      const changePercent = ((currentResult.hz - previousResult.hz) / previousResult.hz) * 100;
      const changeStr =
        changePercent > 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`;

      const icon = changePercent > 5 ? '🟢' : changePercent < -5 ? '🔴' : '⚪';

      if (changePercent > 5) improvements++;
      if (changePercent < -5) regressions++;

      console.log(
        `│ ${this.pad(name, 34)} │ ` +
          `${this.pad(this.formatHz(previousResult.hz), 9)} │ ` +
          `${this.pad(this.formatHz(currentResult.hz), 9)} │ ` +
          `${icon} ${this.pad(changeStr, 4)} │`
      );
    }

    console.log('└─────────────────────────────────────────────────────────────────────┘');

    if (improvements > 0 || regressions > 0) {
      console.log(`\nSummary: ${improvements} improvements 🟢 | ${regressions} regressions 🔴`);
    } else {
      console.log('\nSummary: No significant changes (< ±5%)');
    }
  }

  private formatHz(hz: number): string {
    if (hz >= 1000) {
      return `${(hz / 1000).toFixed(1)}K`;
    }
    return hz.toFixed(1);
  }

  private pad(str: string, length: number): string {
    return str.padEnd(length).substring(0, length);
  }
}
