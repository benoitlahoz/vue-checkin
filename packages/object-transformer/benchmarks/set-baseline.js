#!/usr/bin/env node

/**
 * Set current benchmark results as new baseline
 *
 * Usage: node benchmarks/set-baseline.js [--force]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const currentPath = path.join(__dirname, 'performance.current.json');
const baselinePath = path.join(__dirname, 'performance.baseline.json');

async function setBaseline(force = false) {
  // Check if current.json exists
  if (!fs.existsSync(currentPath)) {
    console.error('❌ No current benchmark results found. Run `yarn bench --run` first.');
    process.exit(1);
  }

  // Load current results
  const currentData = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));

  // Check if baseline exists and prompt for confirmation
  if (fs.existsSync(baselinePath) && !force) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('⚠️  Baseline already exists. This will overwrite it. Continue? (y/N) ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }
  }

  // Create new baseline
  const baseline = {
    date: currentData.date,
    timestamp: currentData.timestamp,
    version: 'v4.0.0',
    description: 'Baseline performance (manually set)',
    results: currentData.results,
  };

  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  console.log('✅ Baseline updated successfully!');
  console.log(`   Date: ${baseline.date}`);
  console.log(`   Benchmarks: ${baseline.results.length}`);
}

const force = process.argv.includes('--force');
setBaseline(force);
