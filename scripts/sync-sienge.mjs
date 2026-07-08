import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const bancoDir = path.join(cwd, 'banco');
const publicBancoDir = path.join(cwd, 'public', 'banco');

const config = {
  subdomain: process.env.SIENGE_SUBDOMAIN || process.env.VITE_SIENGE_SUBDOMAIN || '',
  apiUser: process.env.SIENGE_API_USER || process.env.VITE_SIENGE_ACCESS_NAME || '',
  apiPassword: process.env.SIENGE_API_PASSWORD || process.env.VITE_SIENGE_TOKEN || '',
  startDate: process.env.SIENGE_START_DATE || '2026-01-01',
  endDate: process.env.SIENGE_END_DATE || new Date().toISOString().slice(0, 10),
};

if (!config.subdomain) {
  throw new Error(
    'Missing SIENGE_SUBDOMAIN. The documented Sienge API URL is https://api.sienge.com.br/{subdominio}/public/api/v1/{recurso}.',
  );
}

const BASE_URL = `https://api.sienge.com.br/${config.subdomain}/public/api/v1`;
const AUTH_HEADER = `Basic ${Buffer.from(`${config.apiUser}:${config.apiPassword}`).toString('base64')}`;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(fileName, data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await Promise.all([
    fs.writeFile(path.join(bancoDir, fileName), serialized, 'utf8'),
    fs.writeFile(path.join(publicBancoDir, fileName), serialized, 'utf8'),
  ]);
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.results,
    payload?.data,
    payload?.items,
    payload?.content,
    payload?.value,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

async function siengeRequest(resourcePath, query = {}) {
  const url = new URL(`${BASE_URL}${resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: AUTH_HEADER,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') && text ? JSON.parse(text) : text;

  if (!response.ok) {
    const error = new Error(`Sienge request failed (${response.status}) for ${url}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function fetchPaged(resourcePath, baseQuery = {}) {
  const limit = 200;
  let offset = 0;
  const allItems = [];
  const pages = [];

  while (true) {
    const payload = await siengeRequest(resourcePath, {
      ...baseQuery,
      limit,
      offset,
    });

    const items = normalizeCollection(payload);
    pages.push(payload);
    allItems.push(...items);

    if (items.length < limit || items.length === 0) {
      break;
    }

    offset += limit;
  }

  return {
    resourcePath,
    fetchedAt: new Date().toISOString(),
    total: allItems.length,
    pages: pages.length,
    items: allItems,
    rawPages: pages,
  };
}

function extractPurchasedProducts(comprasPayload) {
  const products = [];

  for (const order of comprasPayload.items || []) {
    const possibleItems = [
      order.items,
      order.products,
      order.resources,
      order.purchaseItems,
      order.orderItems,
    ].find(Array.isArray);

    if (possibleItems) {
      for (const item of possibleItems) {
        products.push({
          orderId: order.id ?? order.purchaseOrderId ?? null,
          orderNumber: order.number ?? order.purchaseOrderNumber ?? null,
          supplier: order.supplierName ?? order.supplier?.name ?? (order.supplierId ? `Fornecedor #${order.supplierId}` : null),
          date: order.date ?? order.createdAt ?? null,
          productId: item.id ?? item.resourceId ?? item.productId ?? null,
          description: item.description ?? item.name ?? item.resourceDescription ?? order.internalNotes ?? order.notes ?? null,
          quantity: item.quantity ?? item.amount ?? item.orderedQuantity ?? 1,
          unitPrice: item.unitPrice ?? item.price ?? item.value ?? item.totalPrice ?? item.totalValue ?? order.totalAmount ?? null,
          totalPrice: item.totalPrice ?? item.totalValue ?? order.totalAmount ?? null,
        });
      }

      continue;
    }

    const fallbackDescription = order.internalNotes ?? order.notes ?? `Pedido ${order.formattedPurchaseOrderId ?? order.id}`;
    products.push({
      orderId: order.id ?? null,
      orderNumber: order.formattedPurchaseOrderId ?? order.number ?? null,
      supplier: order.supplierName ?? order.supplier?.name ?? (order.supplierId ? `Fornecedor #${order.supplierId}` : null),
      date: order.date ?? order.createdAt ?? null,
      productId: null,
      description: fallbackDescription,
      quantity: 1,
      unitPrice: order.totalAmount ?? null,
      totalPrice: order.totalAmount ?? null,
    });
  }

  return {
    fetchedAt: new Date().toISOString(),
    total: products.length,
    items: products,
  };
}

function deriveUsuarios(obrasPayload, comprasPayload) {
  const users = new Map();
  const register = (username, source, extra = {}) => {
    if (!username) {
      return;
    }

    const current = users.get(username) || {
      id: username,
      nome: username,
      fontes: new Set(),
      ...extra,
    };

    current.fontes.add(source);
    users.set(username, current);
  };

  for (const obra of obrasPayload.items || []) {
    register(obra.createdBy, 'obras', { ultimaObra: obra.name ?? null });
    register(obra.modifiedBy, 'obras', { ultimaObra: obra.name ?? null });
  }

  for (const compra of comprasPayload.items || []) {
    register(compra.buyerId, 'compras', {
      ultimoPedido: compra.formattedPurchaseOrderId ?? compra.id ?? null,
    });
    register(compra.createdBy, 'compras', {
      ultimoPedido: compra.formattedPurchaseOrderId ?? compra.id ?? null,
    });
    register(compra.modifiedBy, 'compras', {
      ultimoPedido: compra.formattedPurchaseOrderId ?? compra.id ?? null,
    });
  }

  const items = [...users.values()]
    .map(user => ({
      ...user,
      fontes: [...user.fontes],
    }))
    .sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'));

  return {
    fetchedAt: new Date().toISOString(),
    status: 'derived-from-sienge-records',
    message: 'Usuários derivados dos responsáveis e autores presentes nas obras e pedidos de compra sincronizados.',
    total: items.length,
    items,
  };
}

async function fetchFinanceiro() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDateStr = threeMonthsAgo.toISOString().slice(0, 10);
  const endOfYearStr = `${today.getFullYear()}-12-31`;

  const datasets = {};
  const errors = [];

  async function fetchWithFallback(candidates, key, hint) {
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const payload = await fetchPaged(candidate.path, candidate.query || {});
        return {
          ...payload,
          endpointUsed: candidate.path,
        };
      } catch (error) {
        lastError = error;
      }
    }

    errors.push({
      resource: key,
      path: candidates.map(c => c.path).join(' | '),
      status: lastError?.status ?? null,
      message: lastError?.message ?? `Falha ao carregar recurso ${key}.`,
      hint,
    });

    return {
      fetchedAt: new Date().toISOString(),
      total: 0,
      pages: 0,
      items: [],
      rawPages: [],
      endpointUsed: null,
    };
  }

  const financeResources = [
    { key: 'contasCorrentes', path: '/checking-accounts' },
    { key: 'saldosContas', path: '/accounts-balances', query: { date: todayStr } },
    {
      key: 'extratoContas',
      path: '/accounts-statements',
      query: { startDate: startDateStr, endDate: endOfYearStr },
    },
  ];

  for (const resource of financeResources) {
    try {
      datasets[resource.key] = await fetchPaged(resource.path, resource.query || {});
    } catch (error) {
      errors.push({
        resource: resource.key,
        path: resource.path,
        status: error.status ?? null,
        message: error.message,
        hint:
          resource.key === 'saldosContas'
            ? 'Tente informar companyId. Endpoint pode exigir parâmetros adicionais.'
            : resource.key === 'extratoContas'
            ? 'Endpoint pode exigir companyId ou accountNumber.'
            : undefined,
      });
    }
  }

  datasets.notasFiscaisCompra = await fetchWithFallback(
    [
      {
        path: '/subsystems/suprimentos/notas-fiscais-compra',
        query: {
          startDate: config.startDate,
          endDate: config.endDate,
        },
      },
      {
        path: '/purchase-invoices',
        query: {
          startDate: config.startDate,
          endDate: config.endDate,
        },
      },
    ],
    'notasFiscaisCompra',
    'Confira se o módulo de Suprimentos está habilitado e se o usuário tem permissão para notas fiscais de compra.',
  );

  datasets.contasPagarParcelas = await fetchWithFallback(
    [
      {
        path: '/subsystems/financeiro/contas-a-pagar/parcelas',
        query: {
          startDate: config.startDate,
          endDate: config.endDate,
          withBankMovements: true,
        },
      },
      {
        path: '/accounts-payable/installments',
        query: {
          startDate: config.startDate,
          endDate: config.endDate,
          withBankMovements: true,
        },
      },
    ],
    'contasPagarParcelas',
    'Endpoint pode exigir parâmetros extras (companyId/buildingId) e permissão de Contas a Pagar.',
  );

  return {
    fetchedAt: new Date().toISOString(),
    periodoFiltro: { startDate: startDateStr, endDate: endOfYearStr },
    datasets,
    errors,
  };
}

async function fetchComprasItensRecentes(comprasPayload) {
  const now = new Date();
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthYYYYMM = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const recentOrders = (comprasPayload.items || []).filter(
    order => order.date && order.date.startsWith(lastMonthYYYYMM),
  );

  const itemResults = [];
  const errors = [];
  // Limit to avoid excessive API calls
  const ordersToFetch = recentOrders.slice(0, 150);

  await Promise.allSettled(
    ordersToFetch.map(async order => {
      try {
        const resp = await siengeRequest(`/purchase-orders/${order.id}/items`);
        const items = normalizeCollection(resp);
        if (items.length > 0) {
          for (const item of items) {
            itemResults.push({
              orderId: order.id,
              orderNumber: order.formattedPurchaseOrderId ?? order.id,
              buildingId: order.buildingId ?? null,
              supplierId: order.supplierId ?? null,
              supplierName: null,
              date: order.date,
              status: order.status,
              authorized: order.authorized,
              deliveryLate: order.deliveryLate,
              internalNotes: order.internalNotes ?? '',
              resourceId: item.resourceId ?? item.id ?? null,
              resourceDescription: item.resourceDescription ?? item.description ?? item.name ?? null,
              quantity: item.quantity ?? item.orderedQuantity ?? 1,
              unitPrice: item.unitPrice ?? item.price ?? null,
              totalPrice: item.totalPrice ?? item.totalValue ?? order.totalAmount ?? null,
              unit: item.unitOfMeasure ?? item.unit ?? null,
            });
          }
        } else {
          itemResults.push({
            orderId: order.id,
            orderNumber: order.formattedPurchaseOrderId ?? order.id,
            buildingId: order.buildingId ?? null,
            supplierId: order.supplierId ?? null,
            supplierName: null,
            date: order.date,
            status: order.status,
            authorized: order.authorized,
            deliveryLate: order.deliveryLate,
            internalNotes: order.internalNotes ?? '',
            resourceId: null,
            resourceDescription: order.internalNotes || order.notes || `Pedido ${order.formattedPurchaseOrderId ?? order.id}`,
            quantity: 1,
            unitPrice: order.totalAmount ?? null,
            totalPrice: order.totalAmount ?? null,
            unit: null,
          });
        }
      } catch (err) {
        errors.push({ orderId: order.id, status: err.status ?? null, message: err.message });
        itemResults.push({
          orderId: order.id,
          orderNumber: order.formattedPurchaseOrderId ?? order.id,
          buildingId: order.buildingId ?? null,
          supplierId: order.supplierId ?? null,
          supplierName: null,
          date: order.date,
          status: order.status,
          authorized: order.authorized,
          deliveryLate: order.deliveryLate,
          internalNotes: order.internalNotes ?? '',
          resourceId: null,
          resourceDescription: order.internalNotes || order.notes || `Pedido ${order.formattedPurchaseOrderId ?? order.id}`,
          quantity: 1,
          unitPrice: order.totalAmount ?? null,
          totalPrice: order.totalAmount ?? null,
          unit: null,
        });
      }
    }),
  );

  return {
    fetchedAt: new Date().toISOString(),
    period: lastMonthYYYYMM,
    totalOrders: recentOrders.length,
    total: itemResults.length,
    errors: errors.length,
    items: itemResults.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0)),
  };
}

async function fetchRH() {
  const datasets = {};
  const errors = [];
  const rhResources = [
    { key: 'funcionarios', path: '/employees' },
    { key: 'cargos', path: '/job-positions' },
    { key: 'departamentos', path: '/departments' },
  ];

  for (const resource of rhResources) {
    try {
      datasets[resource.key] = await fetchPaged(resource.path);
    } catch (error) {
      errors.push({
        resource: resource.key,
        path: resource.path,
        status: error.status ?? null,
        message: error.message,
      });
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    datasets,
    errors,
  };
}

async function main() {
  await ensureDir(bancoDir);
  await ensureDir(publicBancoDir);

  const manifest = {
    generatedAt: new Date().toISOString(),
    config: {
      subdomain: config.subdomain,
      apiUser: config.apiUser,
      startDate: config.startDate,
      endDate: config.endDate,
    },
    notes: [
      'clientes, empresas e obras usam endpoints REST documentados do Sienge.',
      'insumos é derivado dos itens de pedidos de compra (extração de nível de pedido).',
      'comprasItens busca itens individuais de cada pedido do último mês via /purchase-orders/{id}/items.',
      'usuarios é derivado dos responsáveis e autores presentes nas obras e pedidos de compra.',
      'financeiro agrega /checking-accounts, /accounts-balances (com date), /accounts-statements (com startDate/endDate), notas fiscais de compra e parcelas do contas a pagar.',
      'rh tenta /employees, /job-positions e /departments do Sienge.',
    ],
  };

  try {
    const [clientes, empresas, obras, compras, financeiro, rh] = await Promise.all([
      fetchPaged('/customers', { onlyActive: true }),
      fetchPaged('/companies'),
      fetchPaged('/enterprises'),
      fetchPaged('/purchase-orders', {
        startDate: config.startDate,
        endDate: config.endDate,
      }),
      fetchFinanceiro(),
      fetchRH(),
    ]);

    const usuarios = deriveUsuarios(obras, compras);
    const insumos = extractPurchasedProducts(compras);
    const comprasItens = await fetchComprasItensRecentes(compras);

    await Promise.all([
      writeJson('clientes.json', clientes),
      writeJson('empresas.json', empresas),
      writeJson('obras.json', obras),
      writeJson('compras.json', compras),
      writeJson('insumos.json', insumos),
      writeJson('comprasItens.json', comprasItens),
      writeJson('financeiro.json', financeiro),
      writeJson('rh.json', rh),
      writeJson('usuarios.json', usuarios),
      writeJson('manifest.json', manifest),
    ]);

    console.log('Sincronização Sienge concluída. Arquivos gerados em banco/ e public/banco/.');
  } catch (error) {
    manifest.error = {
      message: error.message,
      status: error.status ?? null,
      body: error.body ?? null,
    };

    await writeJson('manifest.json', manifest);

    console.error('Falha ao sincronizar dados do Sienge.');
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();