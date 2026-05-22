import type { RuntimeCommandContext, RuntimeCommandResult } from '@tjalve/qube-cli/runtime';
import { getDefaults, loadConfig } from './config/index.js';
import { runGh } from './gh.js';
import { applyLabelPlan, computeLabelPlan, getDesiredLabels, parseGhLabelList, type LabelSpec } from './labels.js';
import { commandFailure, flagEnabled, outputJson } from './runtime_result.js';

export async function handleLabelsSetup(context: RuntimeCommandContext): Promise<RuntimeCommandResult> {
  const dryRun = flagEnabled(context, 'dry-run');
  const config = (await loadConfig()) || getDefaults();
  let listResult: { stdout: string };
  try {
    listResult = await runGh(['label', 'list', '--json', 'name,color,description', '--limit', '1000']);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return commandFailure(context, { ok: false, command: 'labels setup', dryRun, error: message }, message);
  }
  const plan = computeLabelPlan(parseGhLabelList(listResult.stdout), getDesiredLabels(config));
  const hadChanges = plan.created.length > 0 || plan.updated.length > 0;
  if (flagEnabled(context, 'json')) {
    const applied = !dryRun && hadChanges;
    if (applied) await applyLabelPlan(plan);
    return { jsonStdout: outputJson({ ok: true, command: 'labels setup', dryRun, applied, created: plan.created, updated: plan.updated, unchanged: plan.unchanged, skipped: plan.skipped }) };
  }
  if (!dryRun && hadChanges) await applyLabelPlan(plan);
  return { stdout: formatLabelsSetup(plan, dryRun, hadChanges) };
}

function formatLabelsSetup(plan: ReturnType<typeof computeLabelPlan>, dryRun: boolean, hadChanges: boolean): string {
  const lines = [`aie labels setup${dryRun ? ' (dry-run)' : ''}`, ''];
  addLabelGroup(lines, 'Created', plan.created);
  addLabelGroup(lines, 'Updated (color or description drift)', plan.updated);
  addLabelGroup(lines, 'Unchanged', plan.unchanged);
  addLabelGroup(lines, 'Skipped (unrelated to Executor)', plan.skipped);
  if (!hadChanges) lines.push('All configured labels are already up to date.');
  else if (dryRun) lines.push('', 'Re-run without --dry-run to apply the changes.');
  else lines.push('', 'Changes applied successfully.');
  return `${lines.join('\n')}\n`;
}

function addLabelGroup(lines: string[], title: string, labels: LabelSpec[]): void {
  if (labels.length === 0) return;
  lines.push(`${title}:`);
  for (const item of labels) lines.push(`  ${item.name} (color: ${item.color}, description: ${item.description})`);
  lines.push('');
}
