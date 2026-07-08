import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'path';
import type { IncomingMessage } from 'node:http';
import * as XLSX from 'xlsx';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const NFPG_BACKUP_DIR = path.resolve(__dirname, 'public', 'banco', 'backup', 'NFpg');
const NFPG_CACHE_FILE = path.resolve(NFPG_BACKUP_DIR, 'nfpg-cache.json');
const NFPG_STATE_FILE = path.resolve(NFPG_BACKUP_DIR, 'sync-state.json');
const RFATURADA_BACKUP_DIR = path.resolve(__dirname, 'public', 'banco', 'backup', 'Rfaturada');
const RFATURADA_CACHE_FILE = path.resolve(RFATURADA_BACKUP_DIR, 'rfaturada-cache.json');
const RFATURADA_STATE_FILE = path.resolve(RFATURADA_BACKUP_DIR, 'sync-state.json');
const NFPG_MIN_DATE = '2026-01-01';
const NFPG_MAX_DATE = '2027-01-01';

type SiengeEnv = {
  subdomain: string;
  accessName: string;
  token: string;
  baseUrl?: string;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clampIsoDate(value: string) {
  if (value < NFPG_MIN_DATE) return NFPG_MIN_DATE;
  if (value > NFPG_MAX_DATE) return NFPG_MAX_DATE;
  return value;
}

function getInvoiceDate(invoice: Record<string, unknown>) {
  const raw =
    (invoice.issueDate as string | undefined) ||
    (invoice.movementDate as string | undefined) ||
    (invoice.accountingDate as string | undefined) ||
    (invoice.createdAt as string | undefined) ||
    '';
  return String(raw).slice(0, 10);
}

function getInvoiceKey(invoice: Record<string, unknown>) {
  if (invoice.billId != null) {
    return String(invoice.billId);
  }

  return [
    invoice.companyId ?? '-',
    invoice.number ?? '-',
    getInvoiceDate(invoice),
    invoice.supplierId ?? '-',
  ].join(':');
}

function getMovementDate(movement: Record<string, unknown>) {
  const raw =
    (movement.date as string | undefined) ||
    (movement.movementDate as string | undefined) ||
    (movement.accountingDate as string | undefined) ||
    (movement.bankMovementDate as string | undefined) ||
    (movement.paymentDate as string | undefined) ||
    (movement.settlementDate as string | undefined) ||
    (movement.createdAt as string | undefined) ||
    '';
  return String(raw).slice(0, 10);
}

function getMovementKey(movement: Record<string, unknown>) {
  if (movement.id != null) {
    return String(movement.id);
  }

  return [
    movement.companyId ?? '-',
    movement.accountNumber ?? '-',
    movement.documentNumber ?? '-',
    getMovementDate(movement),
    movement.value ?? movement.amount ?? '-',
  ].join(':');
}

async function ensureNfpgDir() {
  await fs.mkdir(NFPG_BACKUP_DIR, { recursive: true });
}

async function ensureRfaturadaDir() {
  await fs.mkdir(RFATURADA_BACKUP_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeCollection(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const source = payload as Record<string, unknown>;
  const candidates = [source.results, source.data, source.items, source.content, source.value];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Array<Record<string, unknown>>;
    }
  }

  return [];
}

function buildSiengeBaseUrl(env: SiengeEnv) {
  if (env.baseUrl) {
    return env.baseUrl;
  }

  if (!env.subdomain) {
    throw new Error('SIENGE_SUBDOMAIN/VITE_SIENGE_SUBDOMAIN não configurado.');
  }

  return `https://api.sienge.com.br/${env.subdomain}/public/api/v1`;
}

async function siengePagedRequest(
  env: SiengeEnv,
  resourcePath: string,
  query: Record<string, string | number | boolean | undefined | null> = {},
) {
  const baseUrl = buildSiengeBaseUrl(env);
  if (!env.accessName || !env.token) {
    throw new Error('Credenciais do Sienge não configuradas para o servidor local.');
  }

  const authorization = `Basic ${Buffer.from(`${env.accessName}:${env.token}`).toString('base64')}`;
  const limit = 200;
  let offset = 0;
  const allItems: Array<Record<string, unknown>> = [];

  while (true) {
    const url = new URL(`${baseUrl}${resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`}`);
    const params = { ...query, limit, offset };

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value === '') continue;
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(`Sienge API error (${response.status}) em ${resourcePath}: ${raw}`);
    }

    const payload = (await response.json()) as unknown;
    const items = normalizeCollection(payload);
    allItems.push(...items);

    if (items.length < limit || items.length === 0) {
      break;
    }

    offset += limit;
  }

  return allItems;
}

async function fetchPurchaseInvoicesWithFallback(env: SiengeEnv, startDate: string, endDate: string) {
  const candidates = ['/subsystems/suprimentos/notas-fiscais-compra', '/purchase-invoices'];
  let lastError: Error | null = null;

  for (const pathCandidate of candidates) {
    try {
      const items = await siengePagedRequest(env, pathCandidate, { startDate, endDate });
      return {
        endpointUsed: pathCandidate,
        items,
      };
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(lastError?.message || 'Falha ao buscar notas fiscais de compra no Sienge.');
}

async function persistNfpgExcel(items: Array<Record<string, unknown>>) {
  const normalized = items.map(item => ({
    billId: item.billId ?? null,
    companyId: item.companyId ?? null,
    supplierId: item.supplierId ?? null,
    documentId: item.documentId ?? null,
    number: item.number ?? null,
    issueDate: item.issueDate ?? null,
    movementDate: item.movementDate ?? null,
    accountingDate: item.accountingDate ?? null,
    itemsTotalAmount: item.itemsTotalAmount ?? null,
    discount: item.discount ?? null,
    freightAmount: item.freightAmount ?? null,
    notes: item.notes ?? null,
    createdAt: item.createdAt ?? null,
    modifiedAt: item.modifiedAt ?? null,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(normalized);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'NFpg');

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 13);
  const latestFile = path.resolve(NFPG_BACKUP_DIR, 'NFpg.xlsx');
  const snapshotFile = path.resolve(NFPG_BACKUP_DIR, `NFpg-${stamp}.xlsx`);
  XLSX.writeFile(workbook, latestFile);
  XLSX.writeFile(workbook, snapshotFile);
}

async function fetchBankMovementsWithFallback(env: SiengeEnv, startDate: string, endDate: string) {
  const updatedAfter = `${startDate}T00:00:00Z`;
  const candidates: Array<{ path: string; query: Record<string, string>; sourceType: 'installments' | 'movements' }> = [
    {
      path: '/subsystems/financeiro/contas-a-receber/parcelas',
      query: { withBankMovements: 'true', updatedAfter },
      sourceType: 'installments',
    },
    {
      path: '/subsystems/financeiro/contas-a-receber/parcelas',
      query: { withBankMovements: 'true', startDate, endDate },
      sourceType: 'installments',
    },
    {
      path: '/accounts-receivable/installments',
      query: { withBankMovements: 'true', updatedAfter },
      sourceType: 'installments',
    },
    {
      path: '/accounts-receivable/installments',
      query: { withBankMovements: 'true', startDate, endDate },
      sourceType: 'installments',
    },
    {
      path: '/subsystems/financeiro/contas-a-receber/liquidacoes',
      query: { updatedAfter },
      sourceType: 'movements',
    },
    {
      path: '/subsystems/financeiro/contas-a-receber/liquidacoes',
      query: { startDate, endDate },
      sourceType: 'movements',
    },
    {
      path: '/subsystems/financeiro/contas-a-receber/baixas',
      query: { updatedAfter },
      sourceType: 'movements',
    },
    {
      path: '/subsystems/financeiro/contas-a-receber/baixas',
      query: { startDate, endDate },
      sourceType: 'movements',
    },
  ];
  let lastError: Error | null = null;

  const pickNumeric = (source: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  };

  const normalizeDirectMovement = (movement: Record<string, unknown>) => {
    const value = pickNumeric(movement, ['bankMovementValue', 'settlementValue', 'paidAmount', 'amount', 'value']);
    const company = (movement.company as Record<string, unknown> | undefined) || undefined;
    const document = (movement.document as Record<string, unknown> | undefined) || undefined;

    return {
      id: movement.id ?? movement.movementId ?? movement.bankMovementId ?? null,
      companyId: movement.companyId ?? company?.id ?? null,
      accountNumber: movement.accountNumber ?? movement.bankAccountNumber ?? null,
      accountName: movement.accountName ?? movement.bankAccountName ?? null,
      date:
        movement.bankMovementDate ??
        movement.paymentDate ??
        movement.settlementDate ??
        movement.date ??
        movement.movementDate ??
        movement.accountingDate ??
        null,
      documentNumber: movement.documentNumber ?? document?.number ?? movement.installmentNumber ?? null,
      description: movement.description ?? movement.history ?? movement.notes ?? 'Liquidação contas a receber',
      type: movement.type ?? movement.movementType ?? movement.entryType ?? 'ENTRADA',
      value,
      createdAt: movement.createdAt ?? null,
      modifiedAt: movement.modifiedAt ?? null,
      sourceEndpoint: 'contas-a-receber',
    } as Record<string, unknown>;
  };

  const normalizeInstallmentMovements = (installments: Array<Record<string, unknown>>) => {
    const normalized: Array<Record<string, unknown>> = [];

    for (const installment of installments) {
      const nested = [
        installment.bankMovements,
        installment.bankMovement,
        installment.movimentacoesBancarias,
        installment.movements,
        installment.liquidacoes,
        installment.baixas,
      ];

      const rawMovements = nested.find(entry => Array.isArray(entry));
      const movements = Array.isArray(rawMovements) ? (rawMovements as Array<Record<string, unknown>>) : [];
      if (movements.length === 0) {
        continue;
      }

      for (const movement of movements) {
        const value = pickNumeric(movement, ['bankMovementValue', 'settlementValue', 'paidAmount', 'amount', 'value']);
        const document = (movement.document as Record<string, unknown> | undefined) || undefined;

        normalized.push({
          id:
            movement.id ??
            movement.movementId ??
            movement.bankMovementId ??
            `${installment.id ?? installment.installmentId ?? installment.number ?? 'installment'}-${movement.date ?? movement.bankMovementDate ?? movement.settlementDate ?? movement.paymentDate ?? movement.createdAt ?? 'movement'}-${value}`,
          companyId: movement.companyId ?? installment.companyId ?? null,
          accountNumber: movement.accountNumber ?? movement.bankAccountNumber ?? installment.accountNumber ?? null,
          accountName: movement.accountName ?? movement.bankAccountName ?? installment.accountName ?? null,
          date:
            movement.bankMovementDate ??
            movement.paymentDate ??
            movement.settlementDate ??
            movement.date ??
            movement.movementDate ??
            movement.accountingDate ??
            installment.paymentDate ??
            installment.settlementDate ??
            installment.dueDate ??
            null,
          documentNumber:
            movement.documentNumber ??
            document?.number ??
            installment.documentNumber ??
            installment.number ??
            installment.installmentNumber ??
            null,
          description:
            movement.description ??
            movement.history ??
            movement.notes ??
            installment.description ??
            installment.notes ??
            'Liquidação contas a receber',
          type: movement.type ?? movement.movementType ?? movement.entryType ?? installment.type ?? 'ENTRADA',
          value,
          createdAt: movement.createdAt ?? installment.createdAt ?? null,
          modifiedAt: movement.modifiedAt ?? installment.modifiedAt ?? null,
          receivableId: installment.id ?? installment.installmentId ?? null,
          sourceEndpoint: '/subsystems/financeiro/contas-a-receber/parcelas',
        });
      }
    }

    return normalized;
  };

  for (const candidate of candidates) {
    try {
      const payloadItems = await siengePagedRequest(env, candidate.path, candidate.query);
      const items = candidate.sourceType === 'installments'
        ? normalizeInstallmentMovements(payloadItems)
        : payloadItems.map(normalizeDirectMovement);

      return {
        endpointUsed: candidate.path,
        queryUsed: candidate.query,
        items,
      };
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(lastError?.message || 'Falha ao buscar dados de receita faturada no Sienge.');
}

async function persistRfaturadaExcel(items: Array<Record<string, unknown>>) {
  const normalized = items.map(item => ({
    id: item.id ?? null,
    companyId: item.companyId ?? null,
    accountNumber: item.accountNumber ?? null,
    accountName: item.accountName ?? null,
    date: item.date ?? item.movementDate ?? item.accountingDate ?? null,
    documentNumber: item.documentNumber ?? null,
    description: item.description ?? item.history ?? item.notes ?? null,
    type: item.type ?? item.movementType ?? item.entryType ?? null,
    value: item.value ?? item.amount ?? null,
    createdAt: item.createdAt ?? null,
    modifiedAt: item.modifiedAt ?? null,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(normalized);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rfaturada');

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 13);
  const latestFile = path.resolve(RFATURADA_BACKUP_DIR, 'Rfaturada.xlsx');
  const snapshotFile = path.resolve(RFATURADA_BACKUP_DIR, `Rfaturada-${stamp}.xlsx`);
  XLSX.writeFile(workbook, latestFile);
  XLSX.writeFile(workbook, snapshotFile);
}

async function syncRfaturada(env: SiengeEnv) {
  await ensureRfaturadaDir();
  const cache = await readJsonFile<{ items: Array<Record<string, unknown>> }>(RFATURADA_CACHE_FILE, { items: [] });
  const state = await readJsonFile<{ lastSyncAt?: string }>(RFATURADA_STATE_FILE, {});
  const today = toIsoDate(new Date());

  const hasCache = Array.isArray(cache.items) && cache.items.length > 0;
  const startDate = hasCache
    ? clampIsoDate(toIsoDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)))
    : NFPG_MIN_DATE;
  const endDate = clampIsoDate(today);

  let endpointUsed = 'cache-only';
  let queryUsed: Record<string, string> = {};
  let freshItems: Array<Record<string, unknown>> = [];
  let syncError: string | null = null;

  try {
    const fetched = await fetchBankMovementsWithFallback(env, startDate, endDate);
    endpointUsed = fetched.endpointUsed;
    queryUsed = fetched.queryUsed;
    freshItems = fetched.items;
  } catch (error) {
    syncError = error instanceof Error ? error.message : 'Falha ao sincronizar Rfaturada no Sienge.';
    endpointUsed = 'unavailable';
    queryUsed = { attemptedUpdatedAfter: `${startDate}T00:00:00Z` };
  }

  const merged = new Map<string, Record<string, unknown>>();
  for (const item of cache.items || []) {
    merged.set(getMovementKey(item), item);
  }
  for (const item of freshItems) {
    merged.set(getMovementKey(item), item);
  }

  const mergedItems = [...merged.values()]
    .filter(item => {
      const movementDate = getMovementDate(item);
      return movementDate >= NFPG_MIN_DATE && movementDate <= NFPG_MAX_DATE;
    })
    .sort((a, b) => getMovementDate(b).localeCompare(getMovementDate(a)));

  await writeJsonFile(RFATURADA_CACHE_FILE, {
    generatedAt: new Date().toISOString(),
    endpointUsed,
    queryUsed,
    syncError,
    range: { startDate: NFPG_MIN_DATE, endDate },
    total: mergedItems.length,
    items: mergedItems,
  });

  await writeJsonFile(RFATURADA_STATE_FILE, {
    lastSyncAt: new Date().toISOString(),
    previousSyncAt: state.lastSyncAt || null,
    incrementalWindow: { startDate, endDate },
    endpointUsed,
    queryUsed,
    syncError,
    total: mergedItems.length,
  });

  await persistRfaturadaExcel(mergedItems);

  return {
    endpointUsed,
    queryUsed,
    total: mergedItems.length,
    fetchedInWindow: freshItems.length,
    incrementalWindow: { startDate, endDate },
    lastSyncAt: new Date().toISOString(),
    syncError,
  };
}

async function syncNfpg(env: SiengeEnv) {
  await ensureNfpgDir();
  const cache = await readJsonFile<{ items: Array<Record<string, unknown>> }>(NFPG_CACHE_FILE, { items: [] });
  const state = await readJsonFile<{ lastSyncAt?: string }>(NFPG_STATE_FILE, {});
  const today = toIsoDate(new Date());

  const hasCache = Array.isArray(cache.items) && cache.items.length > 0;
  const startDate = hasCache
    ? clampIsoDate(toIsoDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)))
    : NFPG_MIN_DATE;
  const endDate = clampIsoDate(today);

  const { endpointUsed, items: freshItems } = await fetchPurchaseInvoicesWithFallback(env, startDate, endDate);

  const merged = new Map<string, Record<string, unknown>>();
  for (const item of cache.items || []) {
    merged.set(getInvoiceKey(item), item);
  }
  for (const item of freshItems) {
    merged.set(getInvoiceKey(item), item);
  }

  const mergedItems = [...merged.values()]
    .filter(item => {
      const invoiceDate = getInvoiceDate(item);
      return invoiceDate >= NFPG_MIN_DATE && invoiceDate <= NFPG_MAX_DATE;
    })
    .sort((a, b) => getInvoiceDate(b).localeCompare(getInvoiceDate(a)));

  await writeJsonFile(NFPG_CACHE_FILE, {
    generatedAt: new Date().toISOString(),
    endpointUsed,
    range: { startDate: NFPG_MIN_DATE, endDate },
    total: mergedItems.length,
    items: mergedItems,
  });

  await writeJsonFile(NFPG_STATE_FILE, {
    lastSyncAt: new Date().toISOString(),
    previousSyncAt: state.lastSyncAt || null,
    incrementalWindow: { startDate, endDate },
    endpointUsed,
    total: mergedItems.length,
  });

  await persistNfpgExcel(mergedItems);

  return {
    endpointUsed,
    total: mergedItems.length,
    fetchedInWindow: freshItems.length,
    incrementalWindow: { startDate, endDate },
    lastSyncAt: new Date().toISOString(),
  };
}

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function createNfpgPlugin(env: SiengeEnv): Plugin {
  return {
    name: 'nfpg-local-backup-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const url = new URL(req.url, 'http://localhost:3000');

        if (url.pathname === '/api/nfpg/data' && req.method === 'GET') {
          try {
            await ensureNfpgDir();
            const cache = await readJsonFile<{ items?: Array<Record<string, unknown>>; generatedAt?: string }>(
              NFPG_CACHE_FILE,
              { items: [] },
            );
            const state = await readJsonFile<{ lastSyncAt?: string }>(NFPG_STATE_FILE, {});

            const requestedStart = clampIsoDate(url.searchParams.get('startDate') || NFPG_MIN_DATE);
            const requestedEnd = clampIsoDate(url.searchParams.get('endDate') || NFPG_MAX_DATE);
            const startDate = requestedStart <= requestedEnd ? requestedStart : requestedEnd;
            const endDate = requestedEnd >= requestedStart ? requestedEnd : requestedStart;

            const filtered = (cache.items || []).filter(item => {
              const invoiceDate = getInvoiceDate(item);
              return invoiceDate >= startDate && invoiceDate <= endDate;
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              source: 'backup-folder',
              startDate,
              endDate,
              total: filtered.length,
              generatedAt: cache.generatedAt || null,
              lastSyncAt: state.lastSyncAt || null,
              items: filtered,
            }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: error instanceof Error ? error.message : 'Falha ao carregar backup NFpg.' }));
            return;
          }
        }

        if (url.pathname === '/api/nfpg/sync' && req.method === 'POST') {
          try {
            await readRequestBody(req);
            const result = await syncNfpg(env);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, ...result }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: error instanceof Error ? error.message : 'Falha no sync NFpg.' }));
            return;
          }
        }

        if (url.pathname === '/api/rfaturada/data' && req.method === 'GET') {
          try {
            await ensureRfaturadaDir();
            const cache = await readJsonFile<{ items?: Array<Record<string, unknown>>; generatedAt?: string }>(
              RFATURADA_CACHE_FILE,
              { items: [] },
            );
            const state = await readJsonFile<{ lastSyncAt?: string }>(RFATURADA_STATE_FILE, {});

            const requestedStart = clampIsoDate(url.searchParams.get('startDate') || NFPG_MIN_DATE);
            const requestedEnd = clampIsoDate(url.searchParams.get('endDate') || NFPG_MAX_DATE);
            const startDate = requestedStart <= requestedEnd ? requestedStart : requestedEnd;
            const endDate = requestedEnd >= requestedStart ? requestedEnd : requestedStart;

            const filtered = (cache.items || []).filter(item => {
              const movementDate = getMovementDate(item);
              return movementDate >= startDate && movementDate <= endDate;
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              source: 'backup-folder',
              startDate,
              endDate,
              total: filtered.length,
              generatedAt: cache.generatedAt || null,
              lastSyncAt: state.lastSyncAt || null,
              items: filtered,
            }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: error instanceof Error ? error.message : 'Falha ao carregar backup Rfaturada.' }));
            return;
          }
        }

        if (url.pathname === '/api/rfaturada/sync' && req.method === 'POST') {
          try {
            await readRequestBody(req);
            const result = await syncRfaturada(env);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, ...result }));
            return;
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: error instanceof Error ? error.message : 'Falha no sync Rfaturada.' }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const rawEnv = loadEnv(mode, process.cwd(), '');
  const env: SiengeEnv = {
    subdomain: rawEnv.SIENGE_SUBDOMAIN || rawEnv.VITE_SIENGE_SUBDOMAIN || '',
    accessName: rawEnv.SIENGE_API_USER || rawEnv.VITE_SIENGE_ACCESS_NAME || '',
    token: rawEnv.SIENGE_API_PASSWORD || rawEnv.VITE_SIENGE_TOKEN || '',
    baseUrl: rawEnv.VITE_SIENGE_BASE_URL || '',
  };

  return {
    plugins: [react(), tailwindcss(), createNfpgPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
