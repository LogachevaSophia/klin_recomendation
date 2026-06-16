import type { ProcessComparison } from '../api/comparisonTypes';

export type PromptStrategyId =
  | 'zero_shot'
  | 'chain_of_thought'
  | 'structured_json'
  | 'few_shot';

export interface PromptBuildOptions {
  strategy: PromptStrategyId;
  language?: 'ru' | 'en';
}

const FEW_SHOT_EXAMPLE = `
Пример: при добавлении узла «Назначить АПФ-и» и удалении «Контроль АД через 2 недели»
клинический смысл смещается к более агрессивной терапии гипертонии.
`.trim();

function formatSummary(c: ProcessComparison): string {
  const s = c.summary;
  return [
    `Процесс 1: «${c.process1.name}» (${s.totalNodes1} узлов, ${s.totalEdges1} рёбер)`,
    `Процесс 2: «${c.process2.name}» (${s.totalNodes2} узлов, ${s.totalEdges2} рёбер)`,
    `Узлы: +${s.nodesAdded} / −${s.nodesRemoved} / ~${s.nodesModified}`,
    `Рёбра: +${s.edgesAdded} / −${s.edgesRemoved} / ~${s.edgesModified}`,
  ].join('\n');
}

function formatNodeList(c: ProcessComparison): string {
  const lines: string[] = [];
  c.nodes.added.forEach((n) => lines.push(`[+] узел ${n.id}: ${n.data.label}`));
  c.nodes.removed.forEach((n) => lines.push(`[−] узел ${n.id}: ${n.data.label}`));
  c.nodes.modified.forEach((nc) => {
    const parts = [`[~] узел ${nc.node.id}: ${nc.node.data.label}`];
    if (nc.changes?.label) {
      parts.push(`  label: «${nc.changes.label.old}» → «${nc.changes.label.new}»`);
    }
    lines.push(parts.join('\n'));
  });
  return lines.join('\n') || '(изменений узлов нет)';
}

/**
 * Стратегии промптинга для LLM-анализа различий графовых схем клинических рекомендаций.
 */
export function buildComparisonPrompt(
  comparison: ProcessComparison,
  options: PromptBuildOptions,
): string {
  const lang = options.language ?? 'ru';
  const summary = formatSummary(comparison);
  const details = formatNodeList(comparison);

  switch (options.strategy) {
    case 'zero_shot':
      return lang === 'ru'
        ? `Сравни две схемы клинических рекомендаций и опиши клиническое значение отличий.\n\n${summary}\n\n${details}`
        : `Compare two clinical guideline flowcharts and describe the clinical impact of differences.\n\n${summary}\n\n${details}`;

    case 'chain_of_thought':
      return lang === 'ru'
        ? `Проанализируй различия схем пошагово:
1) Структурные изменения (узлы/рёбра)
2) Изменения в последовательности действий
3) Влияние на принятие решений
4) Риски для пациента

${summary}

${details}

Ответ оформи по шагам 1–4.`
        : `Analyze flowchart differences step by step:
1) Structural changes
2) Action sequence changes
3) Decision impact
4) Patient risks

${summary}

${details}`;

    case 'structured_json':
      return lang === 'ru'
        ? `Верни JSON с полями: structural_diff, clinical_impact, risk_level (low|medium|high), recommendations[].

${summary}

${details}`
        : `Return JSON with fields: structural_diff, clinical_impact, risk_level (low|medium|high), recommendations[].

${summary}

${details}`;

    case 'few_shot':
      return lang === 'ru'
        ? `${FEW_SHOT_EXAMPLE}

Теперь проанализируй следующую пару схем аналогично.

${summary}

${details}`
        : `${FEW_SHOT_EXAMPLE}

Now analyze the following pair similarly.

${summary}

${details}`;

    default:
      return buildComparisonPrompt(comparison, { ...options, strategy: 'zero_shot' });
  }
}

/** Все доступные стратегии для A/B-сравнения промптов. */
export function buildAllStrategyPrompts(
  comparison: ProcessComparison,
  language: 'ru' | 'en' = 'ru',
): Record<PromptStrategyId, string> {
  const strategies: PromptStrategyId[] = [
    'zero_shot',
    'chain_of_thought',
    'structured_json',
    'few_shot',
  ];
  return Object.fromEntries(
    strategies.map((s) => [s, buildComparisonPrompt(comparison, { strategy: s, language })]),
  ) as Record<PromptStrategyId, string>;
}
