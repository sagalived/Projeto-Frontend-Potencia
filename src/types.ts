export interface FilterState {
  obra: string;
  periodo: string;
  cliente: string;
  responsavel: string;
}

export interface KPIData {
  receitaContratada: number;
  custoPrevisto: number;
  custoReal: number;
  margemPrevista: number;
  margemReal: number;
  obrasEmAndamento: number;
  obrasPublicas: number;
  obrasPrivadas: number;
  avancoMedio: number;
  // Extra fields for Finance view
  receitaFaturada?: number;
  fluxoCaixaProjetado?: number;
  fluxoCaixaReal?: number;
  desvioOrcamentario?: number;
  // Extra fields for Purchase view
  totalCompradoMes?: number;
  totalCompradoAcumulado?: number;
  economiaObtidaAcumulada?: number;
  percentualEconomia?: number;
  pedidosEmAberto?: number;
  atrasosEntrega?: number;
  comprasEmergenciais?: number;
  totalPendingValue?: number;
  totalLateValue?: number;
}

export interface CurvaSData {
  mes: string;
  previstoFisico: number;
  realizadoFisico: number;
  realizadoFinanceiro: number;
}

export interface CostDistributionItem {
  name: string;
  value: number;
  percentage: number;
}

export interface StatusObrasItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface Project5DDetails {
  id: string;
  name: string;
  cliente: string;
  tipo: string;
  contrato: string;
  valorContratado: number;
  prazoContratual: string;
  gerenteObra: string;
  descricaoEscopo: string;
  quantitativos: {
    label: string;
    value: string;
  }[];
  cronograma: {
    etapa: string;
    concluido: number;
    color: string;
  }[];
  datas: {
    terminoPrevisto: string;
    terminoReprogramado: string;
    atrasoDias: number;
  };
  custosEtapa: {
    etapa: string;
    previsto: number;
    realizado: number;
    desvio: number;
    percentualDesvio: number;
  }[];
}

export interface TopCompra {
  item: string;
  fornecedor: string;
  valor: number;
  status: 'Entregue' | 'Em Trânsito' | 'Pendente' | 'Cancelado';
}

export interface FluxoCaixaData {
  mes: string;
  previsto: number;
  realizado: number;
}

export interface FluxoCaixaMensalData {
  mes: string;
  projetado: number;
  realizado: number;
}

export interface DesempenhoIndicator {
  name: string;
  value: number;
  meta: number;
  type: 'produtividade' | 'qualidade' | 'seguranca' | 'cronograma';
}

export interface Alerta {
  id: string;
  text: string;
  severity: 'warning' | 'critical' | 'info';
}

export interface FinanceResultRow {
  descricao: string;
  previsto: number;
  realizado: number;
  desvio: number;
  percentualDesvio: number;
}

export interface FluxoCaixaDetalhadoRow {
  mes: string;
  entradas: number;
  saidas: number;
  saldoProjetado: number;
  saldoReal: number;
  isProjection?: boolean;
}

export interface FinanceIndicator {
  name: string;
  value: number;
  metaLabel: string;
  status: 'success' | 'warning' | 'danger';
}

export interface FinanceTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
}

export interface ComprasCategoriaItem {
  name: string;
  value: number;
  percentage: number;
}

export interface ComprasStatusItem {
  name: string;
  value: number;
  percentage: number;
}

export interface TopFornecedor {
  fornecedor: string;
  comprado: number;
  participacao: number;
  economia: number;
  economiaPercentual: number;
}

export interface PedidoAbertoRow {
  pedido: string;
  data: string;
  fornecedor: string;
  categoria: string;
  valor: number;
  prevEntrega: string;
  status: 'Confirmado' | 'Em Aprovação' | 'Aguardando Entrega' | 'Cotação';
}

export interface ComprasEtapaRow {
  etapa: string;
  previsto: number;
  comprado: number;
  executado: number;
  desvio: number;
  desvioPercentual: number;
}

