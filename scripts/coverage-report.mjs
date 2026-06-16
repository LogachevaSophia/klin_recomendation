#!/usr/bin/env node
/**
 * Генератор отчёта по покрытию автотестами для научной работы.
 * Запуск: node scripts/coverage-report.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORT_DIR = join(ROOT, 'coverage-report');

const SYSTEMS = [
  {
    id: 'klin-rec-editor',
    name: 'Редактор схем клинических рекомендаций (klin-rec)',
    cwd: ROOT,
    cmd: 'npm run test:coverage',
    summaryPath: join(ROOT, 'coverage/coverage-summary.json'),
    modules: ['clinrecProcessMapper', 'permissions'],
  },
  {
    id: 'prompt-comparison',
    name: 'Стратегии промптинга для сравнения графов',
    cwd: ROOT,
    summaryPath: join(ROOT, 'coverage/coverage-summary.json'),
    modules: ['graphDiff', 'promptStrategies'],
  },
  {
    id: 'execution-engine',
    name: 'Движок исполнения визуальных алгоритмов',
    cwd: ROOT,
    summaryPath: join(ROOT, 'coverage/coverage-summary.json'),
    modules: [
      'ExecutionEngine',
      'nodeHandlers',
      'conditionEvaluator',
    ],
  },
  {
    id: 'iam-gateway',
    name: 'IAM / API Gateway (iam-service)',
    cwd: join(ROOT, '..', 'iam-service'),
    cmd: 'npm run test:coverage',
    summaryPath: join(ROOT, '..', 'iam-service/coverage/coverage-summary.json'),
    modules: [
      'policy-engine',
      'permission.service',
      'user.service',
      'clinrec-client',
      'auth.middleware',
      'rest-proxy',
      'config',
    ],
  },
];

function run(cmd, cwd) {
  console.log(`\n> ${cmd} (${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function pct(summary, key) {
  const v = summary?.[key]?.pct;
  return typeof v === 'number' ? v : 0;
}

function loadSummary(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function moduleCoverage(summary, moduleName) {
  if (!summary) return null;
  const key = Object.keys(summary).find(
    (k) => k.includes(moduleName) && !k.endsWith('.test.ts') && !k.endsWith('.test.js'),
  );
  if (!key) return null;
  const s = summary[key];
  return {
    lines: s.lines.pct,
    statements: s.statements.pct,
    functions: s.functions.pct,
    branches: s.branches.pct,
  };
}

function avgPct(cov) {
  if (!cov) return 0;
  return Math.round((cov.lines + cov.statements + cov.functions + cov.branches) / 4);
}

/** Среднее по ключевым модулям подсистемы (lines/statements/functions/branches). */
function avgAcrossModules(moduleCovs, key) {
  const covs = moduleCovs.filter(Boolean);
  if (covs.length === 0) return 0;
  return covs.reduce((sum, c) => sum + c[key], 0) / covs.length;
}

function bar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

mkdirSync(REPORT_DIR, { recursive: true });

run('npm run test:coverage', ROOT);
run('npm run test:coverage', join(ROOT, '..', 'iam-service'));

const klinSummary = loadSummary(join(ROOT, 'coverage/coverage-summary.json'));
const iamSummary = loadSummary(join(ROOT, '..', 'iam-service/coverage/coverage-summary.json'));

const rows = SYSTEMS.map((sys) => {
  const summary = sys.id === 'iam-gateway' ? iamSummary : klinSummary;
  const total = summary?.total ?? {};
  const moduleCovs = sys.modules.map((m) => moduleCoverage(summary, m)).filter(Boolean);
  const moduleAvg =
    moduleCovs.length > 0
      ? Math.round(moduleCovs.reduce((a, c) => a + avgPct(c), 0) / moduleCovs.length)
      : avgPct({
          lines: pct(total, 'lines'),
          statements: pct(total, 'statements'),
          functions: pct(total, 'functions'),
          branches: pct(total, 'branches'),
        });

  const fromModules =
    moduleCovs.length > 0
      ? {
          lines: avgAcrossModules(moduleCovs, 'lines'),
          statements: avgAcrossModules(moduleCovs, 'statements'),
          functions: avgAcrossModules(moduleCovs, 'functions'),
          branches: avgAcrossModules(moduleCovs, 'branches'),
        }
      : null;

  const fromTotal = {
    lines: pct(total, 'lines'),
    statements: pct(total, 'statements'),
    functions: pct(total, 'functions'),
    branches: pct(total, 'branches'),
  };

  // IAM — итог по сервису; подсистемы klin-rec — среднее по ключевым модулям
  const metrics =
    sys.id === 'iam-gateway' ? fromTotal : (fromModules ?? fromTotal);

  return {
    id: sys.id,
    name: sys.name,
    lines: metrics.lines,
    statements: metrics.statements,
    functions: metrics.functions,
    branches: metrics.branches,
    moduleAvg,
    modules: sys.modules.map((m) => ({
      name: m,
      coverage: moduleCoverage(summary, m),
    })),
  };
});

const md = `# Отчёт по покрытию автотестами

Дата генерации: ${new Date().toISOString().slice(0, 10)}

## Сводная таблица по системам

| № | Система | Lines % | Statements % | Functions % | Branches % | Среднее по модулям |
|---|---------|---------|--------------|-------------|------------|-------------------|
${rows
  .map(
    (r, i) =>
      `| ${i + 1} | ${r.name} | ${r.lines.toFixed(1)} | ${r.statements.toFixed(1)} | ${r.functions.toFixed(1)} | ${r.branches.toFixed(1)} | ${r.moduleAvg.toFixed(1)} |`,
  )
  .join('\n')}

## Визуализация (ASCII)

${rows
  .map(
    (r) =>
      `**${r.name}**\nLines:       ${bar(r.lines)} ${r.lines.toFixed(1)}%\nStatements:  ${bar(r.statements)} ${r.statements.toFixed(1)}%\nFunctions:   ${bar(r.functions)} ${r.functions.toFixed(1)}%\nBranches:    ${bar(r.branches)} ${r.branches.toFixed(1)}%\n`,
  )
  .join('\n')}

## Детализация по ключевым модулям

${rows
  .map((r) => {
    const modLines = r.modules
      .map((m) => {
        if (!m.coverage) return `| ${m.name} | — | — | — | — |`;
        return `| ${m.name} | ${m.coverage.lines.toFixed(1)} | ${m.coverage.statements.toFixed(1)} | ${m.coverage.functions.toFixed(1)} | ${m.coverage.branches.toFixed(1)} |`;
      })
      .join('\n');
    return `### ${r.name}\n\n| Модуль | Lines | Statements | Functions | Branches |\n|--------|-------|------------|-----------|----------|\n${modLines}\n`;
  })
  .join('\n')}

## Команды запуска тестов

\`\`\`bash
# klin_recomendation (редактор, движок, сравнение)
cd klin_recomendation && npm test
cd klin_recomendation && npm run test:coverage

# iam-service (аутентификация, API Gateway)
cd iam-service && npm test
cd iam-service && npm run test:coverage
\`\`\`
`;

writeFileSync(join(REPORT_DIR, 'COVERAGE_REPORT.md'), md);

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Покрытие автотестами — клинические рекомендации</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #f8f9fa; }
    h1 { color: #1a1a2e; }
    table { border-collapse: collapse; width: 100%; background: #fff; margin: 1rem 0; }
    th, td { border: 1px solid #dee2e6; padding: 0.6rem 1rem; text-align: left; }
    th { background: #e9ecef; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1200px; }
    canvas { background: #fff; padding: 1rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  </style>
</head>
<body>
  <h1>Покрытие автотестами микросервисной МИС</h1>
  <p>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</p>

  <table>
    <thead>
      <tr><th>Система</th><th>Lines</th><th>Statements</th><th>Functions</th><th>Branches</th></tr>
    </thead>
    <tbody>
      ${rows.map((r) => `<tr><td>${r.name}</td><td>${r.lines.toFixed(1)}%</td><td>${r.statements.toFixed(1)}%</td><td>${r.functions.toFixed(1)}%</td><td>${r.branches.toFixed(1)}%</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="charts">
    <canvas id="barChart"></canvas>
    <canvas id="radarChart"></canvas>
  </div>

  <script>
    const labels = ${JSON.stringify(rows.map((r) => r.name.replace(/\\(.+\\)/, '').trim()))};
    const lines = ${JSON.stringify(rows.map((r) => r.lines))};
    const stmts = ${JSON.stringify(rows.map((r) => r.statements))};
    const funcs = ${JSON.stringify(rows.map((r) => r.functions))};
    const branches = ${JSON.stringify(rows.map((r) => r.branches))};

    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Lines', data: lines, backgroundColor: '#4361ee' },
          { label: 'Statements', data: stmts, backgroundColor: '#3a86ff' },
          { label: 'Functions', data: funcs, backgroundColor: '#06d6a0' },
          { label: 'Branches', data: branches, backgroundColor: '#ffd166' },
        ],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Покрытие по системам (%)' } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });

    new Chart(document.getElementById('radarChart'), {
      type: 'radar',
      data: {
        labels: ['Lines', 'Statements', 'Functions', 'Branches'],
        datasets: labels.map((name, i) => ({
          label: name.slice(0, 30),
          data: [lines[i], stmts[i], funcs[i], branches[i]],
          fill: true,
          opacity: 0.2,
        })),
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Профиль покрытия' } },
        scales: { r: { beginAtZero: true, max: 100 } },
      },
    });
  </script>
</body>
</html>`;

writeFileSync(join(REPORT_DIR, 'coverage-dashboard.html'), html);
writeFileSync(join(REPORT_DIR, 'coverage-data.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));

console.log(`\nОтчёты сохранены в ${REPORT_DIR}/`);
console.log('  - COVERAGE_REPORT.md');
console.log('  - coverage-dashboard.html');
console.log('  - coverage-data.json');
