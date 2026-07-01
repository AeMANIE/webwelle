#!/usr/bin/env node
/**
 * Builds n8n workflow JSON from outbound/n8n/snippets/*.js
 * Ein Workflow (outbound-v1) = gemeinsamer Static-Data-Store für Analyse + API.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snippets = join(root, 'n8n', 'snippets');
const outDir = join(root, 'n8n', 'workflows');
mkdirSync(outDir, { recursive: true });

function readSnippet(name) {
  return readFileSync(join(snippets, name), 'utf8');
}

function webhookNode(id, name, path, method = 'POST', position = [0, 0]) {
  return {
    parameters: {
      httpMethod: method,
      path,
      responseMode: 'responseNode',
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position,
    webhookId: id,
  };
}

function codeNode(id, name, jsCode, position) {
  return {
    parameters: { mode: 'runOnceForAllItems', jsCode },
    id,
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
  };
}

function respondJson(id, name, bodyExpr, codeExpr, position) {
  return {
    parameters: {
      respondWith: 'json',
      responseBody: bodyExpr,
      options: {
        responseCode: codeExpr,
        responseHeaders: {
          entries: [
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Headers', value: 'Content-Type, X-Outbound-Secret' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' },
          ],
        },
      },
    },
    id,
    name,
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position,
  };
}

const pipelineCode = readSnippet('full-pipeline.js');
const apiCode = readSnippet('api-handler.js');

const unified = {
  name: 'outbound-v1',
  nodes: [
    webhookNode('ob-analyze-wh', 'Webhook Analyze', 'outbound-analyze', 'POST', [0, 0]),
    codeNode('ob-analyze-run', 'Run Pipeline', pipelineCode, [280, 0]),
    respondJson('ob-analyze-resp', 'Respond Analyze', '={{ $json }}', 200, [560, 0]),

    webhookNode('ob-status-wh', 'Webhook Status', 'outbound-status', 'GET', [0, 200]),
    webhookNode('ob-draft-get-wh', 'Webhook Draft GET', 'outbound-draft', 'GET', [0, 320]),
    webhookNode('ob-draft-patch-wh', 'Webhook Draft POST', 'outbound-draft-update', 'POST', [0, 440]),
    webhookNode('ob-send-wh', 'Webhook Send', 'outbound-send', 'POST', [0, 560]),
    webhookNode('ob-options-wh', 'Webhook OPTIONS', 'outbound-options', 'OPTIONS', [0, 680]),
    codeNode('ob-api-handler', 'API Handler', apiCode, [280, 440]),
    respondJson(
      'ob-api-resp',
      'Respond API',
      '={{ $json.__response ? JSON.parse($json.body) : $json }}',
      '={{ $json.statusCode || 200 }}',
      [560, 440]
    ),
  ],
  connections: {
    'Webhook Analyze': { main: [[{ node: 'Run Pipeline', type: 'main', index: 0 }]] },
    'Run Pipeline': { main: [[{ node: 'Respond Analyze', type: 'main', index: 0 }]] },
    'Webhook Status': { main: [[{ node: 'API Handler', type: 'main', index: 0 }]] },
    'Webhook Draft GET': { main: [[{ node: 'API Handler', type: 'main', index: 0 }]] },
    'Webhook Draft POST': { main: [[{ node: 'API Handler', type: 'main', index: 0 }]] },
    'Webhook Send': { main: [[{ node: 'API Handler', type: 'main', index: 0 }]] },
    'Webhook OPTIONS': { main: [[{ node: 'API Handler', type: 'main', index: 0 }]] },
    'API Handler': { main: [[{ node: 'Respond API', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  tags: ['outbound', 'webwelle'],
};

writeFileSync(join(outDir, 'outbound-v1.json'), JSON.stringify(unified, null, 2));

// Legacy split exports (gleicher Code, nur zur Referenz – nicht deployen)
writeFileSync(join(outDir, 'outbound-analyze-v1.json'), JSON.stringify({ ...unified, name: 'outbound-analyze-v1-REF' }, null, 2));

console.log('Built:', join(outDir, 'outbound-v1.json'));
console.log('Deploy: node outbound/scripts/sync-outbound-workflows.mjs --activate');
