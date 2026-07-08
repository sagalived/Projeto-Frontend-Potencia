import {
  LISTA_CLIENTES,
  LISTA_OBRAS,
  LISTA_PERIODOS,
  LISTA_RESPONSAVEIS,
  getDashboardData,
} from './data';
import { FilterState, Project5DDetails } from './types';

type BancoCollection<T> = {
  items?: T[];
};

type FinanceDataset<T> = {
  items?: T[];
};

type Enterprise = {
  id: number;
  name: string;
  companyId?: number;
  companyName?: string;
  cnpj?: string | null;
  type?: string;
  adress?: string | null;
  creationDate?: string | null;
  modificationDate?: string | null;
  createdBy?: string | null;
  modifiedBy?: string | null;
  buildingTypeDescription?: string | null;
  enterpriseObservation?: string | null;
  commercialName?: string | null;
};

type Customer = {
  id: number;
  name: string;
};

type Company = {
  id: number;
  name: string;
  tradeName?: string | null;
};

type PurchaseOrder = {
  id: number;
  formattedPurchaseOrderId?: string;
  status?: string;
  authorized?: boolean;
  deliveryLate?: boolean;
  supplierId?: number | null;
  buildingId?: number | null;
  costCenterId?: number | null;
  buyerId?: string | null;
  date?: string | null;
  totalAmount?: number;
  internalNotes?: string | null;
  notes?: string | null;
  paymentCondition?: string | null;
  createdAt?: string | null;
};

type CheckingAccount = {
  accountNumber?: string;
  accountName?: string | null;
  accountType?: { id?: string; description?: string };
  agencyNumber?: string | null;
  bankNumber?: string | null;
  bankName?: string | null;
  companyId?: number;
  companyName?: string;
  accountStatus?: string;
};

type AccountBalance = {
  companyId?: number;
  companyName?: string;
  accountNumber?: string;
  accountName?: string | null;
  balance?: number;
  date?: string | null;
};

type AccountStatement = {
  id?: number;
  companyId?: number;
  accountNumber?: string;
  date?: string | null;
  description?: string | null;
  documentNumber?: string | null;
  value?: number;
  balance?: number;
  type?: string | null;
  statementType?: string | null;
  statementTypeNotes?: string | null;
};

type FinanceSnapshot = {
  fetchedAt?: string;
  periodoFiltro?: { startDate?: string; endDate?: string };
  datasets?: {
    contasCorrentes?: FinanceDataset<CheckingAccount>;
    saldosContas?: FinanceDataset<AccountBalance>;
    extratoContas?: FinanceDataset<AccountStatement>;
  };
  errors?: Array<{ resource?: string; path?: string; status?: number | null; message?: string }>;
};

export type PurchaseOrderItem = {
  orderId?: number | null;
  orderNumber?: string | null;
  buildingId?: number | null;
  supplierId?: number | null;
  supplierName?: string | null;
  date?: string | null;
  status?: string;
  authorized?: boolean;
  deliveryLate?: boolean;
  internalNotes?: string;
  resourceId?: string | null;
  resourceDescription?: string | null;
  quantity?: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  unit?: string | null;
};

export type ComprasItensSnapshot = {
  fetchedAt?: string;
  period?: string;
  totalOrders?: number;
  total?: number;
  errors?: number;
  items?: PurchaseOrderItem[];
};

export type UsuarioItem = {
  id: string;
  nome: string;
  fontes: string[];
  ultimaObra?: string;
  ultimoPedido?: string;
};

export type RhSnapshot = {
  fetchedAt?: string;
  datasets?: {
    funcionarios?: FinanceDataset<unknown>;
    cargos?: FinanceDataset<unknown>;
    departamentos?: FinanceDataset<unknown>;
  };
  errors?: Array<{ resource?: string; path?: string; status?: number | null; message?: string }>;
};

export type SiengeBancoSnapshot = {
  obras: BancoCollection<Enterprise>;
  clientes: BancoCollection<Customer>;
  empresas: BancoCollection<Company>;
  compras: BancoCollection<PurchaseOrder>;
  financeiro: FinanceSnapshot;
  usuarios: BancoCollection<UsuarioItem> & { status?: string; message?: string };
  insumos: BancoCollection<unknown>;
  comprasItens?: ComprasItensSnapshot;
  rh?: RhSnapshot;
};

export type DashboardFilterOptions = {
  obras: string[];
  periodos: string[];
  clientes: string[];
  responsaveis: string[];
};

const DEFAULT_FILTER_OPTIONS: DashboardFilterOptions = {
  obras: LISTA_OBRAS,
  periodos: LISTA_PERIODOS,
  clientes: LISTA_CLIENTES,
  responsaveis: LISTA_RESPONSAVEIS,
};

const CATEGORY_LABELS = [
  'Serviços Iniciais',
  'Fundação',
  'Estrutura',
  'Alvenaria',
  'Cobertura',
  'Instalações',
  'Acabamentos',
  'Entrega',
];

function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map(value => value.trim()))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
}

function parseIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateBR(value?: string | null) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return '-';
  }

  return parsed.toLocaleDateString('pt-BR');
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

function classifyEnterpriseType(name: string) {
  const upper = name.toUpperCase();
  if (/(PREFEITURA|IFCE|ESCOLA|UNIVERSIDADE|HOSPITAL|MUNICIPAL|ESTADUAL|FEDERAL)/.test(upper)) {
    return 'Obra Pública';
  }

  return 'Obra Privada';
}

function derivePurchaseCategory(order: PurchaseOrder) {
  const text = `${order.internalNotes || ''} ${order.notes || ''}`.toUpperCase();

  if (/(ACO|FERRO|TELHA|METAL)/.test(text)) return 'Aço e Ferragens';
  if (/(CIMENTO|CONCRETO|ARGAMASSA|BRITA|AREIA)/.test(text)) return 'Concreto e Cimento';
  if (/(FIO|CABO|ELETR|HIDRA|TUBO|PVC)/.test(text)) return 'Instalações';
  if (/(CERAM|PORCEL|GESSO|PISO|TINTA|PORTA|JANELA)/.test(text)) return 'Acabamentos';
  if (/(MAQUINA|EQUIP|BETONEIRA|ANDAIME|FERRAMENTA)/.test(text)) return 'Equipamentos';

  return 'Outros';
}

function buildMonthlySeries(orders: PurchaseOrder[]) {
  const sourceOrders = orders.filter(order => parseIsoDate(order.date));
  const fallbackMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (sourceOrders.length === 0) {
    return fallbackMonths.map(mes => ({ mes, total: 0 }));
  }

  const latestDate = sourceOrders
    .map(order => parseIsoDate(order.date) as Date)
    .sort((left, right) => left.getTime() - right.getTime())
    .at(-1) as Date;

  const year = latestDate.getFullYear();
  // Always use 2026 if the latest data is from 2025 or earlier (data migration)
  const targetYear = year < 2026 ? 2026 : year;
  const buckets = new Map<number, number>();

  for (const order of sourceOrders) {
    const parsed = parseIsoDate(order.date);
    if (!parsed || parsed.getFullYear() !== targetYear) {
      continue;
    }

    const month = parsed.getMonth();
    buckets.set(month, (buckets.get(month) || 0) + (order.totalAmount || 0));
  }

  return fallbackMonths.map((mes, index) => ({
    mes,
    total: parseFloat(((buckets.get(index) || 0) / 1000000).toFixed(2)),
  }));
}

function deriveProgress(enterprise: Enterprise, relatedOrders: PurchaseOrder[]) {
  const orderVolume = relatedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const delayPenalty = relatedOrders.filter(order => order.deliveryLate).length * 4;
  const activityBonus = Math.min(60, Math.round(orderVolume / 250000));
  const recencyBase = enterprise.modificationDate?.startsWith('2026') ? 28 : enterprise.modificationDate?.startsWith('2025') ? 18 : 12;

  return Math.max(8, Math.min(98, recencyBase + activityBonus - delayPenalty));
}

function buildProjectDetails(enterprise: Enterprise, relatedOrders: PurchaseOrder[]): Project5DDetails {
  const totalComprado = relatedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const atrasoDias = relatedOrders.filter(order => order.deliveryLate).length * 3;
  const progresso = deriveProgress(enterprise, relatedOrders);
  // Only show a financial value if there are actual purchase orders linked
  const valorContratado = totalComprado > 0 ? Math.round(totalComprado * 1.18) : 0;
  const etapaPesos = [0.08, 0.12, 0.22, 0.14, 0.12, 0.14, 0.12, 0.06];
  const cronograma = CATEGORY_LABELS.map((etapa, index) => {
    const stageProgress = Math.max(0, Math.min(100, progresso - index * 11));
    return {
      etapa,
      concluido: stageProgress,
      color: stageProgress >= 90 ? 'bg-emerald-500' : stageProgress > 0 ? 'bg-amber-500' : 'bg-slate-700',
    };
  });

  const custosEtapa = CATEGORY_LABELS.map((etapa, index) => {
    const previsto = valorContratado * etapaPesos[index];
    const realizedFactor = Math.max(0, Math.min(1.08, cronograma[index].concluido / 100));
    const realizado = previsto * realizedFactor;
    const desvio = realizado - previsto;
    return {
      etapa,
      previsto: Math.round(previsto),
      realizado: Math.round(realizado),
      desvio: Math.round(desvio),
      percentualDesvio: previsto === 0 ? 0 : parseFloat(((desvio / previsto) * 100).toFixed(1)),
    };
  });

  return {
    id: String(enterprise.id),
    name: enterprise.name,
    cliente: enterprise.companyName || enterprise.commercialName || 'Não informado',
    tipo: classifyEnterpriseType(enterprise.name),
    contrato: enterprise.cnpj ? `CNPJ ${enterprise.cnpj}` : `Empresa ${enterprise.companyId || '-'}`,
    valorContratado: Math.round(valorContratado),
    prazoContratual: `${formatDateBR(enterprise.creationDate)} a ${formatDateBR(enterprise.modificationDate)}`,
    gerenteObra: enterprise.modifiedBy || enterprise.createdBy || 'Não informado',
    descricaoEscopo:
      enterprise.enterpriseObservation ||
      enterprise.adress ||
      'Empreendimento sincronizado do Sienge sem descrição complementar cadastrada.',
    quantitativos: [
      { label: 'Empresa', value: enterprise.companyName || '-' },
      { label: 'Tipo cadastral', value: enterprise.buildingTypeDescription || enterprise.type || '-' },
      { label: 'Centro de custo/obra', value: String(enterprise.id) },
      { label: 'Pedidos vinculados', value: String(relatedOrders.length) },
      { label: 'Comprado acumulado', value: `R$ ${(totalComprado / 1000000).toFixed(2)} Mi` },
    ],
    cronograma,
    datas: {
      terminoPrevisto: formatDateBR(enterprise.modificationDate),
      terminoReprogramado: formatDateBR(enterprise.modificationDate),
      atrasoDias,
    },
    custosEtapa,
  };
}

function getEnterpriseOrders(enterprise: Enterprise, orders: PurchaseOrder[]) {
  return orders.filter(order => order.buildingId === enterprise.id || order.costCenterId === enterprise.id);
}

function mapPurchaseStatus(status?: string) {
  switch (status) {
    case 'PENDING':
      return 'Em Aprovação';
    case 'PARTIALLY_DELIVERED':
      return 'Aguardando Entrega';
    case 'FULLY_DELIVERED':
      return 'Confirmado';
    case 'CANCELED':
      return 'Cotação';
    default:
      return 'Em Aprovação';
  }
}

export async function loadSiengeBancoSnapshot(): Promise<SiengeBancoSnapshot | null> {
  try {
    const required = ['obras', 'clientes', 'empresas', 'compras', 'financeiro', 'usuarios', 'insumos'] as const;
    const optional = ['comprasItens', 'rh'] as const;

    const requiredResponses = await Promise.all(
      required.map(file =>
        fetch(`/banco/${file}.json`, { cache: 'no-store' }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${file}.json (${response.status})`);
          }
          return response.json();
        }),
      ),
    );

    const optionalResponses = await Promise.allSettled(
      optional.map(file =>
        fetch(`/banco/${file}.json`, { cache: 'no-store' }).then(response => {
          if (!response.ok) return null;
          return response.json();
        }),
      ),
    );

    const [obras, clientes, empresas, compras, financeiro, usuarios, insumos] = requiredResponses;
    const [comprasItensResult, rhResult] = optionalResponses;
    const comprasItens = comprasItensResult.status === 'fulfilled' ? comprasItensResult.value : undefined;
    const rh = rhResult.status === 'fulfilled' ? rhResult.value : undefined;

    return { obras, clientes, empresas, compras, financeiro, usuarios, insumos, comprasItens, rh } as SiengeBancoSnapshot;
  } catch (error) {
    console.error('Falha ao carregar snapshots do banco Sienge.', error);
    return null;
  }
}

export function getFilterOptionsFromSnapshot(snapshot: SiengeBancoSnapshot): DashboardFilterOptions {
  const allEnterprises = snapshot.obras.items || [];
  const customers = snapshot.clientes.items || [];
  const companies = snapshot.empresas.items || [];
  const purchases = snapshot.compras.items || [];

  // Only expose obras that have at least one purchase order linked
  const enterpriseIdsWithOrders = new Set(
    purchases.flatMap(o => [o.buildingId, o.costCenterId].filter((id): id is number => id != null)),
  );
  const enterprises = allEnterprises.filter(e => enterpriseIdsWithOrders.has(e.id));

  const obras = ['Todas', ...uniqueSorted(enterprises.map(item => item.name))];
  const clientes = ['Todos', ...uniqueSorted([
    ...companies.map(item => item.tradeName || item.name),
    ...customers.map(item => item.name),
  ])];
  const responsaveis = ['Todos', ...uniqueSorted([
    ...enterprises.map(item => item.modifiedBy || item.createdBy),
    ...purchases.map(item => item.buyerId),
  ])];

  return {
    obras: obras.length > 1 ? obras : DEFAULT_FILTER_OPTIONS.obras,
    periodos: LISTA_PERIODOS,
    clientes: clientes.length > 1 ? clientes : DEFAULT_FILTER_OPTIONS.clientes,
    responsaveis: responsaveis.length > 1 ? responsaveis : DEFAULT_FILTER_OPTIONS.responsaveis,
  };
}

// ─── Suprimentos helpers ───────────────────────────────────────────────────

export type SuprimentoRow = {
  description: string;
  orderId: number;
  orderNumber: string;
  buildingId: number | null;
  supplierId: number | null;
  date: string;
  status: string;
  authorized: boolean;
  totalPrice: number;
  category: string;
};

export function buildSuprimentosData(snapshot: SiengeBancoSnapshot): {
  lastMonthLabel: string;
  comprado: SuprimentoRow[];
  entregue: SuprimentoRow[];
  totalComprado: number;
  totalEntregue: number;
  pedidosCount: number;
  entreguesCount: number;
} {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthYYYYMM = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthLabel = lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Try comprasItens first, fall back to compras
  const sourceItems: PurchaseOrderItem[] = snapshot.comprasItens?.items?.filter(
    item => item.date && item.date.startsWith(lastMonthYYYYMM),
  ) ?? [];

  const sourceOrders: PurchaseOrder[] = snapshot.compras.items?.filter(
    order => order.date && order.date.startsWith(lastMonthYYYYMM),
  ) ?? [];

  function toRow(source: PurchaseOrder | PurchaseOrderItem): SuprimentoRow {
    const isPO = 'internalNotes' in source && !('resourceDescription' in source);
    const order = source as PurchaseOrder;
    const item = source as PurchaseOrderItem;
    return {
      description: isPO
        ? (order.internalNotes || order.notes || `Pedido ${order.formattedPurchaseOrderId ?? order.id}`).split('\n')[0].trim().slice(0, 80)
        : (item.resourceDescription || item.internalNotes || `Pedido ${item.orderNumber ?? item.orderId}`).split('\n')[0].trim().slice(0, 80),
      orderId: Number(isPO ? order.id : item.orderId),
      orderNumber: isPO ? (order.formattedPurchaseOrderId ?? String(order.id)) : (item.orderNumber ?? String(item.orderId)),
      buildingId: isPO ? (order.buildingId ?? null) : (item.buildingId ?? null),
      supplierId: isPO ? (order.supplierId ?? null) : (item.supplierId ?? null),
      date: (isPO ? order.date : item.date) ?? '',
      status: (isPO ? order.status : item.status) ?? '',
      authorized: isPO ? Boolean(order.authorized) : Boolean(item.authorized),
      totalPrice: isPO ? (order.totalAmount ?? 0) : (item.totalPrice ?? 0),
      category: derivePurchaseCategory(isPO ? order : { internalNotes: item.internalNotes, notes: '' }),
    };
  }

  const rows: SuprimentoRow[] = sourceItems.length > 0
    ? sourceItems.map(toRow)
    : sourceOrders.map(toRow);

  const comprado = [...rows].sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 20);
  const entregue = comprado.filter(r => r.status === 'FULLY_DELIVERED');

  return {
    lastMonthLabel,
    comprado,
    entregue,
    totalComprado: rows.reduce((s, r) => s + r.totalPrice, 0),
    totalEntregue: rows.filter(r => r.status === 'FULLY_DELIVERED').reduce((s, r) => s + r.totalPrice, 0),
    pedidosCount: sourceOrders.length || rows.length,
    entreguesCount: (sourceOrders.length > 0
      ? sourceOrders.filter(o => o.status === 'FULLY_DELIVERED').length
      : rows.filter(r => r.status === 'FULLY_DELIVERED').length),
  };
}

// ─── RH helpers ───────────────────────────────────────────────────────────

export type RhData = {
  totalUsuarios: number;
  usuariosObras: number;
  usuariosCompras: number;
  usuarios: UsuarioItem[];
  funcionariosErp: number;
  fetchedAt: string;
};

export function buildRhData(snapshot: SiengeBancoSnapshot): RhData {
  const todos = (snapshot.usuarios.items || []) as UsuarioItem[];
  const orders = snapshot.compras.items || [];
  const enterprises = snapshot.obras.items || [];

  // Active buyers: placed at least one purchase order in 2026
  const activeBuyers = new Set(
    orders
      .filter(o => o.date && o.date.startsWith('2026') && o.buyerId)
      .map(o => o.buyerId as string),
  );

  // Active obra managers: modified or created an enterprise in 2025 or later
  const activeObraManagers = new Set(
    enterprises
      .filter(e => (e.modificationDate ?? '') >= '2025' || (e.creationDate ?? '') >= '2025')
      .flatMap(e => [e.modifiedBy, e.createdBy])
      .filter((id): id is string => Boolean(id)),
  );

  // Keep only users with recent activity
  const usuarios = todos.filter(u => activeBuyers.has(u.id) || activeObraManagers.has(u.id));

  const usuariosObras = usuarios.filter(u => u.fontes.includes('obras')).length;
  const usuariosCompras = usuarios.filter(u => u.fontes.includes('compras')).length;
  const funcionariosErp = snapshot.rh?.datasets?.funcionarios?.total ?? 0;

  return {
    totalUsuarios: usuarios.length,
    usuariosObras,
    usuariosCompras,
    usuarios,
    funcionariosErp,
    fetchedAt: snapshot.usuarios.fetchedAt ?? new Date().toISOString(),
  };
}

// ─── Financeiro helpers ───────────────────────────────────────────────────

export type FinanceiroMensalRow = {
  mes: string;
  anoMes: string;
  compras: number;
  pedidos: number;
  projetado: number;
  isProjection: boolean;
};

export function buildFinanceiroMensal(
  snapshot: SiengeBancoSnapshot,
): FinanceiroMensalRow[] {
  const today = new Date();
  // Last 3 months + months to end of current year
  const startMonth = new Date(today);
  startMonth.setMonth(startMonth.getMonth() - 3);
  startMonth.setDate(1);

  const endMonth = new Date(today.getFullYear(), 11, 1); // December

  const orders = snapshot.compras.items || [];
  const statements = (snapshot.financeiro.datasets?.extratoContas?.items ?? []) as AccountStatement[];

  // Build monthly buckets from purchase orders
  const orderBuckets = new Map<string, { total: number; count: number }>();
  for (const order of orders) {
    if (!order.date) continue;
    const ym = order.date.slice(0, 7);
    const existing = orderBuckets.get(ym) || { total: 0, count: 0 };
    existing.total += order.totalAmount ?? 0;
    existing.count += 1;
    orderBuckets.set(ym, existing);
  }

  // Build monthly buckets from real statements (saídas/despesas)
  const expenseBuckets = new Map<string, number>();
  for (const s of statements) {
    if (!s.date) continue;
    if (s.type === 'Expense' || (s.value ?? 0) < 0) {
      const ym = s.date.slice(0, 7);
      expenseBuckets.set(ym, (expenseBuckets.get(ym) ?? 0) + Math.abs(s.value ?? 0));
    }
  }

  const rows: FinanceiroMensalRow[] = [];
  const cursor = new Date(startMonth);

  while (cursor <= endMonth) {
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const isProjection = cursor > today;
    const orderBucket = orderBuckets.get(ym);
    const expenseTotal = expenseBuckets.get(ym) ?? 0;

    // Prefer real expense data; fall back to purchase orders
    let compras = expenseTotal > 0 ? expenseTotal : (orderBucket?.total ?? 0);

    // For projection months, use average of last 3 real months
    if (isProjection && compras === 0) {
      const realMonths = rows.filter(r => !r.isProjection && r.compras > 0);
      const avg = realMonths.length > 0
        ? realMonths.slice(-3).reduce((s, r) => s + r.compras, 0) / Math.min(3, realMonths.length)
        : 0;
      compras = avg;
    }

    rows.push({
      mes: cursor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      anoMes: ym,
      compras,
      pedidos: orderBucket?.count ?? 0,
      projetado: compras * 1.08,
      isProjection,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return rows;
}

export function buildFluxoCaixaDetalhado(snapshot: SiengeBancoSnapshot) {
  const statements = (snapshot.financeiro.datasets?.extratoContas?.items ?? []) as AccountStatement[];
  const rows = buildFinanceiroMensal(snapshot);

  // If we have real statement data, use it for actual months
  if (statements.length > 0) {
    // Group statements by month
    const expenseByMonth = new Map<string, number>();
    const incomeByMonth = new Map<string, number>();
    for (const s of statements) {
      if (!s.date) continue;
      const ym = s.date.slice(0, 7);
      const v = Math.abs(s.value ?? 0);
      if (s.type === 'Expense' || (s.value ?? 0) < 0) {
        expenseByMonth.set(ym, (expenseByMonth.get(ym) ?? 0) + v);
      } else {
        incomeByMonth.set(ym, (incomeByMonth.get(ym) ?? 0) + v);
      }
    }

    return rows.map(r => ({
      mes: `${r.mes}/${r.anoMes.slice(0, 4)}`,
      entradas: r.isProjection
        ? Math.round(r.compras * 1.18)
        : Math.round(incomeByMonth.get(r.anoMes) ?? r.compras * 1.18),
      saidas: r.isProjection
        ? Math.round(r.compras)
        : Math.round(expenseByMonth.get(r.anoMes) ?? r.compras),
      saldoProjetado: Math.round(r.compras * 0.18),
      saldoReal: r.isProjection
        ? 0
        : Math.round((incomeByMonth.get(r.anoMes) ?? 0) - (expenseByMonth.get(r.anoMes) ?? 0)),
      isProjection: r.isProjection,
    }));
  }

  return rows.map(r => ({
    mes: `${r.mes}/${r.anoMes.slice(0, 4)}`,
    entradas: Math.round(r.compras * 1.18),
    saidas: Math.round(r.compras),
    saldoProjetado: Math.round(r.compras * 0.18),
    saldoReal: r.isProjection ? 0 : Math.round(r.compras * 0.12),
    isProjection: r.isProjection,
  }));
}

export function buildIndicadoresFinanceiros(snapshot: SiengeBancoSnapshot) {
  const checkingAccounts = snapshot.financeiro.datasets?.contasCorrentes?.items ?? [];
  const companyCount = new Set(checkingAccounts.map(a => a.companyId)).size;
  const orders = snapshot.compras.items ?? [];
  const authorizedPct = orders.length > 0
    ? parseFloat(((orders.filter(o => o.authorized).length / orders.length) * 100).toFixed(1))
    : 0;
  const totalComprado = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const estimatedRevenue = totalComprado * 1.18;
  const margemReal = estimatedRevenue === 0 ? 0 : ((estimatedRevenue - totalComprado) / estimatedRevenue) * 100;

  return [
    {
      name: 'Contas correntes integradas',
      value: checkingAccounts.length,
      metaLabel: 'meta: > 0',
      status: checkingAccounts.length > 0 ? 'success' : 'warning' as const,
    },
    {
      name: 'Empresas com contas bancárias',
      value: companyCount,
      metaLabel: 'meta: > 1',
      status: companyCount > 1 ? 'success' : 'warning' as const,
    },
    {
      name: 'Margem operacional estimada (%)',
      value: parseFloat(margemReal.toFixed(1)),
      metaLabel: 'meta: > 8%',
      status: (margemReal >= 8 ? 'success' : 'warning') as const,
    },
    {
      name: 'Pedidos autorizados (%)',
      value: authorizedPct,
      metaLabel: 'meta: > 70%',
      status: (authorizedPct >= 70 ? 'success' : 'warning') as const,
    },
  ];
}

export function buildUltimasMovimentacoes(snapshot: SiengeBancoSnapshot) {
  // Use real account statements if available
  const statements = (snapshot.financeiro.datasets?.extratoContas?.items ?? []) as AccountStatement[];
  if (statements.length > 0) {
    return [...statements]
      .filter(s => s.date)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 8)
      .map((s, idx) => ({
        id: String(s.id ?? idx + 1),
        data: formatDateBR(s.date),
        descricao: s.description ?? s.statementTypeNotes ?? s.statementType ?? 'Movimentação financeira',
        valor: Math.abs(s.value ?? 0),
        tipo: (s.type === 'Expense' || (s.value ?? 0) < 0) ? 'saida' : 'entrada' as const,
      }));
  }

  // Fallback: last purchase orders
  const orders = snapshot.compras.items ?? [];
  return [...orders]
    .filter(o => o.date)
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 8)
    .map(o => ({
      id: String(o.id),
      data: formatDateBR(o.date),
      descricao: (o.internalNotes || o.notes || `Pedido ${o.formattedPurchaseOrderId ?? o.id}`).split('\n')[0].trim().slice(0, 60),
      valor: o.totalAmount ?? 0,
      tipo: 'saida' as const,
    }));
}

export function buildFinanceResults(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Use real statement data if available
  const statements = (snapshot.financeiro.datasets?.extratoContas?.items ?? []) as AccountStatement[];
  const orders = snapshot.compras.items ?? [];

  const last3MonthOrders = orders.filter(o => {
    if (!o.date) return false;
    const d = new Date(o.date);
    return d >= threeMonthsAgo && d <= today;
  });
  const totalComprado3m = last3MonthOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  let totalReceita3m = totalComprado3m * 1.18;
  let totalSaidas3m = totalComprado3m;

  if (statements.length > 0) {
    const recent = statements.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d >= threeMonthsAgo && d <= today;
    });
    const incomeReal = recent.filter(s => s.type !== 'Expense' && (s.value ?? 0) > 0).reduce((sum, s) => sum + (s.value ?? 0), 0);
    const expenseReal = recent.filter(s => s.type === 'Expense' || (s.value ?? 0) < 0).reduce((sum, s) => sum + Math.abs(s.value ?? 0), 0);
    if (incomeReal > 0) totalReceita3m = incomeReal;
    if (expenseReal > 0) totalSaidas3m = expenseReal;
  }

  const estimatedPlanned3m = totalComprado3m * 1.06;
  const margemReal = totalReceita3m === 0 ? 0 : ((totalReceita3m - totalSaidas3m) / totalReceita3m) * 100;
  const margemPrevista = totalReceita3m === 0 ? 0 : ((totalReceita3m - estimatedPlanned3m) / totalReceita3m) * 100;

  return [
    {
      descricao: 'Receita (extrato/compras, últ. 3 meses)',
      previsto: totalReceita3m,
      realizado: totalReceita3m,
      desvio: 0,
      percentualDesvio: 0,
    },
    {
      descricao: 'Saídas/Compras (últ. 3 meses)',
      previsto: estimatedPlanned3m,
      realizado: totalSaidas3m,
      desvio: totalSaidas3m - estimatedPlanned3m,
      percentualDesvio: estimatedPlanned3m === 0 ? 0 : parseFloat((((totalSaidas3m - estimatedPlanned3m) / estimatedPlanned3m) * 100).toFixed(1)),
    },
    {
      descricao: 'Margem bruta estimada (%)',
      previsto: margemPrevista,
      realizado: margemReal,
      desvio: margemReal - margemPrevista,
      percentualDesvio: margemReal - margemPrevista,
    },
  ];
}

export function buildComprasKpisReais(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const currentMonthYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthYM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const orders = snapshot.compras.items ?? [];
  const thisPeriodOrders = orders.filter(o => o.date && (o.date.startsWith(currentMonthYM) || o.date.startsWith(lastMonthYM)));
  const lastMonthOrders = orders.filter(o => o.date && o.date.startsWith(lastMonthYM));

  const totalMes = lastMonthOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const totalAcumulado = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const economia = totalAcumulado * 0.03;
  const pendingOrders = orders.filter(o => o.status !== 'FULLY_DELIVERED' && o.status !== 'CANCELED');
  const lateOrders = orders.filter(o => o.deliveryLate);
  const unauthorizedOrders = orders.filter(o => !o.authorized && o.status !== 'CANCELED');
  const emergencyPct = orders.length > 0 ? parseFloat(((unauthorizedOrders.length / orders.length) * 100).toFixed(1)) : 0;

  return {
    totalCompradoMes: parseFloat((totalMes / 1000000).toFixed(2)),
    totalCompradoAcumulado: parseFloat((totalAcumulado / 1000000).toFixed(2)),
    economiaObtidaAcumulada: parseFloat((economia / 1000000).toFixed(2)),
    percentualEconomia: 3.0,
    pedidosEmAberto: pendingOrders.length,
    atrasosEntrega: lateOrders.length,
    comprasEmergenciais: emergencyPct,
    totalPendingValue: pendingOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
    totalLateValue: lateOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0),
  };
}

export function buildTopFornecedoresReais(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthYM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const orders = snapshot.compras.items ?? [];
  const lastMonthOrders = orders.filter(o => o.date && o.date.startsWith(lastMonthYM));
  const totalAcumulado = lastMonthOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const supplierTotals = new Map<string, number>();
  for (const order of lastMonthOrders) {
    const key = order.supplierId ? `Fornecedor #${order.supplierId}` : 'Fornecedor não informado';
    supplierTotals.set(key, (supplierTotals.get(key) || 0) + (order.totalAmount ?? 0));
  }

  return [...supplierTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([fornecedor, comprado]) => ({
      fornecedor,
      comprado,
      participacao: totalAcumulado === 0 ? 0 : parseFloat(((comprado / totalAcumulado) * 100).toFixed(1)),
      economia: comprado * 0.03,
      economiaPercentual: 3.0,
    }));
}

export function buildPedidosAbertosReais(snapshot: SiengeBancoSnapshot) {
  const orders = snapshot.compras.items ?? [];
  return orders
    .filter(o => o.status !== 'FULLY_DELIVERED' && o.status !== 'CANCELED')
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 10)
    .map(o => ({
      pedido: o.formattedPurchaseOrderId ?? String(o.id),
      data: formatDateBR(o.date),
      fornecedor: o.supplierId ? `Fornecedor #${o.supplierId}` : 'Não informado',
      categoria: derivePurchaseCategory(o),
      valor: o.totalAmount ?? 0,
      prevEntrega: formatDateBR(o.date),
      status: mapPurchaseStatus(o.status) as 'Confirmado' | 'Em Aprovação' | 'Aguardando Entrega' | 'Cotação',
    }));
}

export function buildTopComprasReais(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthYM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const orders = snapshot.compras.items ?? [];
  const lastMonthOrders = orders.filter(o => o.date && o.date.startsWith(lastMonthYM));
  const itensSource = snapshot.comprasItens?.items ?? [];

  if (itensSource.length > 0) {
    return itensSource
      .sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0))
      .slice(0, 8)
      .map(item => ({
        item: (item.resourceDescription || item.internalNotes || `Pedido ${item.orderNumber ?? item.orderId}`).split('\n')[0].trim().slice(0, 60),
        fornecedor: item.supplierId ? `Fornecedor #${item.supplierId}` : 'Não informado',
        valor: item.totalPrice ?? 0,
        status: item.status === 'FULLY_DELIVERED' ? 'Entregue' : item.status === 'PARTIALLY_DELIVERED' ? 'Em Trânsito' : item.status === 'CANCELED' ? 'Cancelado' : 'Pendente' as const,
      }));
  }

  return [...lastMonthOrders]
    .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
    .slice(0, 8)
    .map(o => ({
      item: (o.internalNotes || o.notes || `Pedido ${o.formattedPurchaseOrderId ?? o.id}`).split('\n')[0].trim().slice(0, 60),
      fornecedor: o.supplierId ? `Fornecedor #${o.supplierId}` : 'Não informado',
      valor: o.totalAmount ?? 0,
      status: o.status === 'FULLY_DELIVERED' ? 'Entregue' : o.status === 'PARTIALLY_DELIVERED' ? 'Em Trânsito' : o.status === 'CANCELED' ? 'Cancelado' : 'Pendente' as const,
    }));
}

export function buildComprasCategoriasReais(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthYM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const orders = snapshot.compras.items ?? [];
  const lastMonthOrders = orders.filter(o => o.date && o.date.startsWith(lastMonthYM));
  const totalMes = lastMonthOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const categoryTotals = new Map<string, number>();
  for (const order of lastMonthOrders) {
    const cat = derivePurchaseCategory(order);
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + (order.totalAmount ?? 0));
  }

  return [...categoryTotals.entries()]
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalMes === 0 ? 0 : parseFloat(((value / totalMes) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildComprasStatusReais(snapshot: SiengeBancoSnapshot) {
  const today = new Date();
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthYM = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const orders = snapshot.compras.items ?? [];
  const lastMonthOrders = orders.filter(o => o.date && o.date.startsWith(lastMonthYM));
  const total = lastMonthOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const statusTotals = new Map<string, number>();
  for (const order of lastMonthOrders) {
    const st = mapPurchaseStatus(order.status);
    statusTotals.set(st, (statusTotals.get(st) ?? 0) + (order.totalAmount ?? 0));
  }

  return [...statusTotals.entries()].map(([name, value]) => ({
    name,
    value: parseFloat((value / 1000000).toFixed(2)),
    percentage: total === 0 ? 0 : parseFloat(((value / total) * 100).toFixed(1)),
  }));
}

export function buildDashboardDataFromSnapshot(snapshot: SiengeBancoSnapshot, filters: FilterState) {
  const fallback = getDashboardData(filters);
  const enterprises = snapshot.obras.items || [];
  const purchases = snapshot.compras.items || [];
  const checkingAccounts = snapshot.financeiro.datasets?.contasCorrentes?.items || [];

  if (enterprises.length === 0) {
    return {
      ...fallback,
      source: 'fallback',
      availableProjects: Object.values((fallback as typeof fallback & { availableProjects?: Project5DDetails[] }).availableProjects || {}),
    };
  }

  const filteredByObra = filters.obra === 'Todas'
    ? enterprises
    : enterprises.filter(item => item.name === filters.obra);
  const filteredByCliente = filters.cliente === 'Todos'
    ? filteredByObra
    : filteredByObra.filter(item => (item.companyName || '').toUpperCase() === filters.cliente.toUpperCase());
  const filteredEnterprises = filters.responsavel === 'Todos'
    ? filteredByCliente
    : filteredByCliente.filter(item => [item.createdBy, item.modifiedBy].includes(filters.responsavel));

  const scopedEnterprises = filteredEnterprises.length > 0 ? filteredEnterprises : filteredByCliente.length > 0 ? filteredByCliente : filteredByObra.length > 0 ? filteredByObra : enterprises;
  const enterpriseIds = new Set(scopedEnterprises.map(item => item.id));
  const purchasesByScope = purchases.filter(order => {
    if (enterpriseIds.size === 0) {
      return true;
    }

    return enterpriseIds.has(order.buildingId || -1) || enterpriseIds.has(order.costCenterId || -1);
  });

  const purchasesByResponsible = filters.responsavel === 'Todos'
    ? purchasesByScope
    : purchasesByScope.filter(order => order.buyerId === filters.responsavel);
  const scopedPurchases = (() => {
    const series = purchasesByResponsible.filter(order => parseIsoDate(order.date));
    if (series.length === 0) {
      return purchasesByResponsible;
    }

    const latestDate = series
      .map(order => parseIsoDate(order.date) as Date)
      .sort((left, right) => left.getTime() - right.getTime())
      .at(-1) as Date;

    return purchasesByResponsible.filter(order => {
      const parsed = parseIsoDate(order.date);
      if (!parsed) {
        return false;
      }

      if (filters.periodo === 'Este Mês') {
        return parsed.getMonth() === latestDate.getMonth() && parsed.getFullYear() === latestDate.getFullYear();
      }

      if (filters.periodo === 'Último Trimestre') {
        const threshold = new Date(latestDate);
        threshold.setMonth(threshold.getMonth() - 2);
        return parsed >= threshold;
      }

      if (filters.periodo === 'Ano de 2026') {
        return parsed.getFullYear() === 2026;
      }

      return true;
    });
  })();

  // Only build catalog for enterprises that have actual financial data
  const enterprisesWithOrders = scopedEnterprises.filter(
    e => getEnterpriseOrders(e, purchases).length > 0,
  );
  const catalogSource = enterprisesWithOrders.length > 0 ? enterprisesWithOrders : scopedEnterprises;

  const selectedEnterprise =
    (enterprisesWithOrders.length > 0 ? enterprisesWithOrders[0] : scopedEnterprises[0]) || enterprises[0];
  const projectCatalog = catalogSource
    .map(enterprise => buildProjectDetails(enterprise, getEnterpriseOrders(enterprise, purchases)))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  const projectDetails = buildProjectDetails(selectedEnterprise, getEnterpriseOrders(selectedEnterprise, purchases));

  const totalComprado = scopedPurchases.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalCompradoAcumulado = purchasesByScope.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const estimatedRevenue = totalComprado * 1.18;
  const estimatedPlannedCost = totalComprado * 1.06;
  const margemReal = estimatedRevenue === 0 ? 0 : ((estimatedRevenue - totalComprado) / estimatedRevenue) * 100;
  const margemPrevista = estimatedRevenue === 0 ? 0 : ((estimatedRevenue - estimatedPlannedCost) / estimatedRevenue) * 100;
  const progresses = scopedEnterprises.map(enterprise => deriveProgress(enterprise, getEnterpriseOrders(enterprise, purchases)));
  const avancoMedio = progresses.length === 0 ? fallback.kpis.avancoMedio : Math.round(progresses.reduce((sum, value) => sum + value, 0) / progresses.length);
  const publicCount = scopedEnterprises.filter(item => classifyEnterpriseType(item.name) === 'Obra Pública').length;
  const privateCount = Math.max(0, scopedEnterprises.length - publicCount);

  const monthlySeries = buildMonthlySeries(purchasesByScope);
  let cumulative = 0;
  const cumulativeSeries = monthlySeries.map(item => {
    cumulative += item.total;
    return {
      mes: item.mes,
      realizado: parseFloat(cumulative.toFixed(2)),
    };
  });
  const maxCumulative = cumulativeSeries.at(-1)?.realizado || 0;
  const curvaSData = cumulativeSeries.map((item, index) => {
    const realizadoFisico = maxCumulative === 0 ? 0 : parseFloat(((item.realizado / maxCumulative) * 100).toFixed(1));
    const previstoFisico = Math.min(100, parseFloat((realizadoFisico * 1.08 + index * 0.6).toFixed(1)));
    return {
      mes: item.mes,
      previstoFisico,
      realizadoFisico,
      realizadoFinanceiro: parseFloat((realizadoFisico * 0.94).toFixed(1)),
    };
  });

  const categoryTotals = new Map<string, number>();
  for (const order of purchasesByScope) {
    const category = derivePurchaseCategory(order);
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + (order.totalAmount || 0));
  }
  const comprasCategoria = [...categoryTotals.entries()]
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalCompradoAcumulado === 0 ? 0 : parseFloat(((value / totalCompradoAcumulado) * 100).toFixed(1)),
    }))
    .sort((left, right) => right.value - left.value);

  const custoDist = comprasCategoria.length > 0
    ? comprasCategoria.slice(0, 5)
    : fallback.custoDist;

  const statusCounts = {
    'No Prazo': scopedEnterprises.filter(item => getEnterpriseOrders(item, purchases).some(order => order.deliveryLate) === false).length,
    Atenção: scopedEnterprises.filter(item => {
      const lateCount = getEnterpriseOrders(item, purchases).filter(order => order.deliveryLate).length;
      return lateCount > 0 && lateCount <= 3;
    }).length,
    Crítico: scopedEnterprises.filter(item => getEnterpriseOrders(item, purchases).filter(order => order.deliveryLate).length > 3).length,
  };
  const totalStatus = Math.max(1, scopedEnterprises.length);
  const statusObras = [
    { name: 'No Prazo', count: statusCounts['No Prazo'], color: '#10b981' },
    { name: 'Atenção', count: statusCounts['Atenção'], color: '#f59e0b' },
    { name: 'Crítico', count: statusCounts['Crítico'], color: '#ef4444' },
  ].filter(item => item.count > 0 || scopedEnterprises.length === 0).map(item => ({
    ...item,
    percentage: parseFloat(((item.count / totalStatus) * 100).toFixed(1)),
  }));

  const topCompras = [...scopedPurchases]
    .sort((left, right) => (right.totalAmount || 0) - (left.totalAmount || 0))
    .slice(0, 5)
    .map(order => ({
      item: order.internalNotes || order.notes || `Pedido ${order.formattedPurchaseOrderId || order.id}`,
      fornecedor: order.supplierId ? `Fornecedor #${order.supplierId}` : 'Fornecedor não informado',
      valor: order.totalAmount || 0,
      status: order.status === 'FULLY_DELIVERED' ? 'Entregue' : order.status === 'PARTIALLY_DELIVERED' ? 'Em Trânsito' : order.status === 'CANCELED' ? 'Cancelado' : 'Pendente' as const,
    }));

  const fluxoCaixa = monthlySeries.map(item => ({
    mes: item.mes,
    previsto: parseFloat((item.total * 1.06).toFixed(2)),
    realizado: item.total,
  }));
  const fluxoCaixaMensal = monthlySeries.map(item => ({
    mes: item.mes,
    projetado: parseFloat((item.total * 1.08).toFixed(2)),
    realizado: item.total,
  }));

  const indicadores = [
    { name: 'Índice de Produtividade', value: parseFloat((Math.min(1, avancoMedio / 100 + 0.18)).toFixed(2)), meta: 1.0, type: 'produtividade' as const },
    { name: 'Índice de Qualidade', value: 0.93, meta: 0.9, type: 'qualidade' as const },
    { name: 'Índice de Segurança', value: 0.91, meta: 0.9, type: 'seguranca' as const },
    { name: 'Índice de Aderência ao Cronograma', value: parseFloat((Math.max(0.65, 1 - (projectDetails.datas.atrasoDias / 100))).toFixed(2)), meta: 0.9, type: 'cronograma' as const },
  ];

  const alertas = [
    projectDetails.datas.atrasoDias > 0 ? { id: 'delay', text: `Existem ${projectDetails.datas.atrasoDias} dias-equivalentes de atraso nas entregas da obra ${projectDetails.name}.`, severity: projectDetails.datas.atrasoDias > 12 ? 'critical' : 'warning' as const } : null,
    scopedPurchases.filter(order => !order.authorized).length > 0 ? { id: 'approval', text: `${scopedPurchases.filter(order => !order.authorized).length} pedidos ainda aguardam autorização.`, severity: 'warning' as const } : null,
    checkingAccounts.length > 0 ? { id: 'finance', text: `${checkingAccounts.length} contas correntes foram sincronizadas do Sienge.`, severity: 'info' as const } : null,
  ].filter(Boolean);

  const financeResults = [
    { descricao: 'Receita estimada a partir da carteira comprada', previsto: estimatedRevenue, realizado: estimatedRevenue * 0.96, desvio: estimatedRevenue * -0.04, percentualDesvio: -4.0 },
    { descricao: 'Custos de compras sincronizados', previsto: estimatedPlannedCost, realizado: totalComprado, desvio: totalComprado - estimatedPlannedCost, percentualDesvio: estimatedPlannedCost === 0 ? 0 : parseFloat((((totalComprado - estimatedPlannedCost) / estimatedPlannedCost) * 100).toFixed(1)) },
    { descricao: 'Margem estimada', previsto: margemPrevista, realizado: margemReal, desvio: margemReal - margemPrevista, percentualDesvio: margemReal - margemPrevista },
  ];

  const recentMonths = monthlySeries.slice(-6);
  const fluxoCaixaDetalhado = recentMonths.map(item => ({
    mes: `${item.mes}/2026`,
    entradas: Math.round(item.total * 1.18 * 1000000),
    saidas: Math.round(item.total * 1000000),
    saldoProjetado: Math.round(item.total * 0.18 * 1000000),
    saldoReal: Math.round(item.total * 0.12 * 1000000),
  }));

  const indicadoresFinanceiros = [
    { name: 'Contas correntes integradas', value: checkingAccounts.length, metaLabel: 'meta: > 0', status: checkingAccounts.length > 0 ? 'success' : 'warning' as const },
    { name: 'Empresas com contas bancárias', value: new Set(checkingAccounts.map(item => item.companyId)).size, metaLabel: 'meta: > 1', status: 'success' as const },
    { name: 'Margem operacional estimada', value: parseFloat(margemReal.toFixed(1)), metaLabel: 'meta: > 8%', status: margemReal >= 8 ? 'success' : 'warning' as const },
    { name: 'Pedidos autorizados', value: parseFloat((((scopedPurchases.filter(item => item.authorized).length) / Math.max(1, scopedPurchases.length)) * 100).toFixed(1)), metaLabel: 'meta: > 70%', status: 'success' as const },
  ];

  const ultimasMovimentacoes = [...scopedPurchases]
    .sort((left, right) => new Date(right.createdAt || right.date || 0).getTime() - new Date(left.createdAt || left.date || 0).getTime())
    .slice(0, 5)
    .map(order => ({
      id: String(order.id),
      data: formatDateBR(order.date),
      descricao: order.internalNotes || order.notes || `Pedido ${order.formattedPurchaseOrderId || order.id}`,
      valor: order.totalAmount || 0,
      tipo: 'saida' as const,
    }));

  const statusTotals = new Map<string, number>();
  for (const order of purchasesByScope) {
    const status = mapPurchaseStatus(order.status);
    statusTotals.set(status, (statusTotals.get(status) || 0) + (order.totalAmount || 0));
  }
  const comprasStatus = [...statusTotals.entries()].map(([name, value]) => ({
    name,
    value: parseFloat((value / 1000000).toFixed(2)),
    percentage: totalCompradoAcumulado === 0 ? 0 : parseFloat(((value / totalCompradoAcumulado) * 100).toFixed(1)),
  }));

  const supplierTotals = new Map<string, number>();
  for (const order of purchasesByScope) {
    const key = order.supplierId ? `Fornecedor #${order.supplierId}` : 'Fornecedor não informado';
    supplierTotals.set(key, (supplierTotals.get(key) || 0) + (order.totalAmount || 0));
  }
  const topFornecedores = [...supplierTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([fornecedor, comprado]) => ({
      fornecedor,
      comprado,
      participacao: totalCompradoAcumulado === 0 ? 0 : parseFloat(((comprado / totalCompradoAcumulado) * 100).toFixed(1)),
      economia: comprado * 0.03,
      economiaPercentual: 3.0,
    }));

  const pendingOrders = purchasesByScope
    .filter(order => order.status !== 'FULLY_DELIVERED')
    .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
    .slice(0, 8);
  const pedidosEmAberto = pendingOrders.map(order => ({
    pedido: order.formattedPurchaseOrderId || String(order.id),
    data: formatDateBR(order.date),
    fornecedor: order.supplierId ? `Fornecedor #${order.supplierId}` : 'Fornecedor não informado',
    categoria: derivePurchaseCategory(order),
    valor: order.totalAmount || 0,
    prevEntrega: formatDateBR(order.date),
    status: mapPurchaseStatus(order.status) as 'Confirmado' | 'Em Aprovação' | 'Aguardando Entrega' | 'Cotação',
  }));

  const comprasEtapa = projectDetails.custosEtapa.map(item => ({
    etapa: item.etapa,
    previsto: item.previsto,
    comprado: item.realizado,
    executado: item.previsto === 0 ? 0 : parseFloat(((item.realizado / item.previsto) * 100).toFixed(1)),
    desvio: item.desvio,
    desvioPercentual: item.percentualDesvio,
  }));

  return {
    ...fallback,
    source: 'sienge-banco',
    filters,
    availableProjects: projectCatalog,
    kpis: {
      receitaContratada: parseFloat((estimatedRevenue / 1000000).toFixed(2)),
      custoPrevisto: parseFloat((estimatedPlannedCost / 1000000).toFixed(2)),
      custoReal: parseFloat((totalComprado / 1000000).toFixed(2)),
      margemPrevista: parseFloat(margemPrevista.toFixed(2)),
      margemReal: parseFloat(margemReal.toFixed(2)),
      obrasEmAndamento: scopedEnterprises.length,
      obrasPublicas: publicCount,
      obrasPrivadas: privateCount,
      avancoMedio,
      receitaFaturada: parseFloat(((estimatedRevenue * 0.96) / 1000000).toFixed(2)),
      fluxoCaixaProjetado: parseFloat((monthlySeries.reduce((sum, item) => sum + item.total * 1.08, 0)).toFixed(2)),
      fluxoCaixaReal: parseFloat((monthlySeries.reduce((sum, item) => sum + item.total, 0)).toFixed(2)),
      desvioOrcamentario: parseFloat((((totalComprado - estimatedPlannedCost) / Math.max(1, estimatedPlannedCost)) * 100).toFixed(1)),
      totalCompradoMes: monthlySeries.at(-1)?.total || 0,
      totalCompradoAcumulado: parseFloat((totalCompradoAcumulado / 1000000).toFixed(2)),
      economiaObtidaAcumulada: parseFloat(((totalCompradoAcumulado * 0.03) / 1000000).toFixed(2)),
      percentualEconomia: 3.0,
      pedidosEmAberto: pendingOrders.length,
      atrasosEntrega: purchasesByScope.filter(order => order.deliveryLate).length,
      comprasEmergenciais: purchasesByScope.filter(order => !order.authorized).length,
    },
    projectDetails,
    curvaSData,
    custoDist,
    statusObras,
    topCompras,
    fluxoCaixa,
    fluxoCaixaMensal,
    indicadores,
    alertas,
    financeResults,
    fluxoCaixaDetalhado,
    indicadoresFinanceiros,
    ultimasMovimentacoes,
    comprasCategoria,
    comprasStatus,
    topFornecedores,
    pedidosEmAberto,
    comprasEtapa,
  };
}