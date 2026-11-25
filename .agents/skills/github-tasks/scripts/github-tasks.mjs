#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const ghBin = process.env.GH_BIN || 'gh';
const command = process.argv[2];
const args = parseArgs(process.argv.slice(3));
const write = Boolean(args.write);
const agentLabel = 'agent-task';
// The GitHub Project that tracks task status. New issues land in Backlog and closed ones in Done through the
// project's own workflows; `start` moves an issue to In progress.
const projectOwner = process.env.GH_PROJECT_OWNER || 'enet71';
const projectNumber = process.env.GH_PROJECT_NUMBER || '2';
const statusFieldName = 'Status';
const inProgressStatus = 'In progress';
const typeLabels = new Map([
  ['bug', 'type:bug'],
  ['tech-debt', 'type:tech-debt'],
  ['task', 'type:task'],
  ['cleanup', 'type:cleanup'],
]);

if (!command || command === '--help' || command === '-h' || args.help || args.h) {
  printHelp();
  process.exit(command ? 0 : 1);
}

ensureGh();

if (command === 'create') {
  createIssue();
} else if (command === 'list') {
  listIssues();
} else if (command === 'close') {
  closeIssue();
} else if (command === 'start') {
  startIssue();
} else if (command === 'labels') {
  ensureTaskLabels();
} else {
  fail(`Unknown command: ${command}`);
}

function createIssue() {
  const title = stringArg('title');
  const type = stringArg('type');
  const body = stringArg('body');
  const typeLabel = typeLabels.get(type);

  if (!title) {
    fail('Missing required --title.');
  }

  if (!typeLabel) {
    fail(`Missing or invalid --type. Use one of: ${[...typeLabels.keys()].join(', ')}.`);
  }

  if (!body) {
    fail('Missing required --body with validated task details.');
  }

  const labels = [agentLabel, typeLabel, ...multiArg('label')];

  if (!write) {
    console.log('GitHub task create dry-run.');
    console.log(`title: ${title}`);
    console.log(`type: ${type}`);
    console.log(`labels: ${labels.join(', ')}`);
    console.log('');
    console.log(body);
    return;
  }

  ensureLabels([agentLabel, typeLabel]);

  const result = gh(['issue', 'create', '--title', title, '--body', body, ...labels.flatMap((label) => ['--label', label])]);
  const url = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /\/issues\/\d+$/.test(line));
  const number = url?.match(/\/issues\/(\d+)$/)?.[1];

  if (!number) {
    fail(`Could not parse created issue number from GitHub CLI output: ${result.stdout}`);
  }

  console.log(`Created GitHub task #${number}: ${url}`);
}

function listIssues() {
  const state = stringArg('state') || 'open';
  const type = stringArg('type');
  const labels = [agentLabel];

  if (type) {
    const typeLabel = typeLabels.get(type);

    if (!typeLabel) {
      fail(`Invalid --type. Use one of: ${[...typeLabels.keys()].join(', ')}.`);
    }

    labels.push(typeLabel);
  }

  const issues = ghJson([
    'issue',
    'list',
    '--state',
    state,
    '--limit',
    stringArg('limit') || '50',
    ...labels.flatMap((label) => ['--label', label]),
    '--json',
    'number,state,title,labels,url',
  ]);

  if (issues.length === 0) {
    console.log('No matching GitHub tasks found.');
    return;
  }

  for (const issue of issues) {
    const issueLabels = issue.labels.map((label) => label.name).join(', ');
    console.log(`#${issue.number} [${issue.state}] ${issue.title}`);
    console.log(`labels: ${issueLabels}`);
    console.log(issue.url);
    console.log('');
  }
}

function closeIssue() {
  const issue = stringArg('issue');
  const reason = stringArg('reason') || 'completed';

  if (!issue) {
    fail('Missing required --issue number.');
  }

  if (!['completed', 'not planned', 'duplicate'].includes(reason)) {
    fail('Invalid --reason. Use completed, not planned, or duplicate.');
  }

  if (!write) {
    console.log('GitHub task close dry-run.');
    console.log(`issue: #${issue}`);
    console.log(`reason: ${reason}`);
    return;
  }

  gh(['issue', 'close', issue, '--reason', reason]);
  console.log(`Closed GitHub task #${issue} with reason "${reason}".`);
}

// Sets the issue's Status in the project to In progress, adding the issue to the project when it is not there yet.
function startIssue() {
  const issue = stringArg('issue');

  if (!issue) {
    fail('Missing required --issue number.');
  }

  if (!write) {
    console.log('GitHub task start dry-run.');
    console.log(`issue: #${issue}`);
    console.log(`project: ${projectOwner}/${projectNumber}, ${statusFieldName} = ${inProgressStatus}`);
    return;
  }

  const issueUrl = ghJson(['issue', 'view', issue, '--json', 'url']).url;
  const projectId = ghJson(['project', 'view', projectNumber, '--owner', projectOwner, '--format', 'json']).id;
  const statusField = ghJson(['project', 'field-list', projectNumber, '--owner', projectOwner, '--format', 'json']).fields.find(
    (field) => field.name === statusFieldName,
  );
  const option = statusField?.options?.find((candidate) => candidate.name === inProgressStatus);

  if (!option) {
    fail(`The project has no "${statusFieldName}" field with the "${inProgressStatus}" option.`);
  }

  // Adding an issue that is already in the project returns its existing item.
  const item = ghJson(['project', 'item-add', projectNumber, '--owner', projectOwner, '--url', issueUrl, '--format', 'json']);

  gh(['project', 'item-edit', '--id', item.id, '--project-id', projectId, '--field-id', statusField.id, '--single-select-option-id', option.id]);
  console.log(`Moved GitHub task #${issue} to "${inProgressStatus}".`);
}

function ensureTaskLabels() {
  const labels = [agentLabel, ...typeLabels.values()];

  if (!write) {
    console.log('GitHub task labels dry-run.');
    console.log(`labels: ${labels.join(', ')}`);
    return;
  }

  ensureLabels(labels);
  console.log(`Ensured GitHub task labels: ${labels.join(', ')}`);
}

function ensureLabels(labels) {
  const existingLabels = new Set(ghJson(['label', 'list', '--limit', '200', '--json', 'name']).map((label) => label.name));

  for (const label of labels) {
    if (existingLabels.has(label)) {
      continue;
    }

    gh(['label', 'create', label, '--description', labelDescription(label), '--color', labelColor(label)]);
  }
}

function labelDescription(label) {
  if (label === agentLabel) {
    return 'Tasks created or managed through the repository agent';
  }

  if (label.startsWith('type:')) {
    return `Agent task type ${label.slice('type:'.length)}`;
  }

  return 'Repository task label';
}

function labelColor(label) {
  if (label === agentLabel) {
    return '7057ff';
  }

  if (label === 'type:bug') {
    return 'd73a4a';
  }

  if (label === 'type:tech-debt') {
    return 'fbca04';
  }

  if (label === 'type:cleanup') {
    return 'cfd3d7';
  }

  return '0e8a16';
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = rawArgs[index + 1];
    const value = next && !next.startsWith('--') ? next : true;

    if (value !== true) {
      index += 1;
    }

    if (parsed[key] === undefined) {
      parsed[key] = value;
    } else if (Array.isArray(parsed[key])) {
      parsed[key].push(value);
    } else {
      parsed[key] = [parsed[key], value];
    }
  }

  return parsed;
}

function stringArg(name) {
  const value = args[name];

  if (Array.isArray(value)) {
    return String(value.at(-1));
  }

  return typeof value === 'string' ? value : '';
}

function multiArg(name) {
  const value = args[name];

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === 'string' ? [value] : [];
}

function ensureGh() {
  gh(['--version']);
  gh(['auth', 'status']);
}

function ghJson(ghArgs) {
  const result = gh(ghArgs);

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`GitHub CLI did not return valid JSON for "gh ${ghArgs.join(' ')}": ${error.message}`);
  }
}

function gh(ghArgs) {
  const result = spawnSync(ghBin, ghArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    fail(
      `Failed to run "${ghBin} ${ghArgs.join(' ')}": ${result.error.message}. ` +
        'If gh is installed outside PATH, set GH_BIN to the full gh executable path.',
    );
  }

  if (result.status !== 0) {
    fail(`Command failed: ${ghBin} ${ghArgs.join(' ')}\n${result.stderr || result.stdout}`);
  }

  return result;
}

function printHelp() {
  console.log(`Usage:
  node .agents/skills/github-tasks/scripts/github-tasks.mjs create --type bug --title "..." --body "..." [--label extra] [--write]
  node .agents/skills/github-tasks/scripts/github-tasks.mjs list [--state open|closed|all] [--type bug|tech-debt|task|cleanup]
  node .agents/skills/github-tasks/scripts/github-tasks.mjs start --issue 123 [--write]
  node .agents/skills/github-tasks/scripts/github-tasks.mjs close --issue 123 [--reason completed|"not planned"] [--write]
  node .agents/skills/github-tasks/scripts/github-tasks.mjs labels [--write]

Write operations are dry-run unless --write is present.`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
