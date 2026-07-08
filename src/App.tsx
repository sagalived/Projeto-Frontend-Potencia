import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GeneralDashboard from './components/GeneralDashboard';
import FinancialDashboard from './components/FinancialDashboard';
import PurchasingDashboard from './components/PurchasingDashboard';
import Project5DPanel from './components/Project5DPanel';
import { FilterState } from './types';
import {
  getDashboardData,
  LISTA_CLIENTES,
  LISTA_OBRAS,
  LISTA_PERIODOS,
  LISTA_RESPONSAVEIS,
  OBRAS_DETAILS,
} from './data';
import {
  buildDashboardDataFromSnapshot,
  buildSuprimentosData,
  buildRhData,
  buildFinanceiroMensal,
  buildFluxoCaixaDetalhado,
  buildIndicadoresFinanceiros,
  buildUltimasMovimentacoes,
  buildFinanceResults,
  buildComprasKpisReais,
  buildTopFornecedoresReais,
  buildPedidosAbertosReais,
  buildTopComprasReais,
  buildComprasCategoriasReais,
  buildComprasStatusReais,
  DashboardFilterOptions,
  getFilterOptionsFromSnapshot,
  loadSiengeBancoSnapshot,
  SiengeBancoSnapshot,
} from './bancoData';
import { loadNfpgBackupData, syncNfpgBackup } from './api/nfpgBackupApi';
import { loadRfaturadaBackupData, syncRfaturadaBackup } from './api/rfaturadaBackupApi';
import {
  Building2,
  HardHat,
  Users,
  Award,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  ChevronRight,
  CheckCircle,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';

type DatePreset = 'ultimos30' | 'mesAtual' | 'trimestre' | 'custom';

export default function App() {
  const API_MIN_DATE = '2026-01-01';
  const API_MAX_DATE = '2027-01-01';

  const formatAsIsoDate = (value: Date) => value.toISOString().slice(0, 10);

  const clampDate = (isoDate: string) => {
    if (isoDate < API_MIN_DATE) return API_MIN_DATE;
    if (isoDate > API_MAX_DATE) return API_MAX_DATE;
    return isoDate;
  };

  const buildDefaultDateRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);

    const startDate = clampDate(formatAsIsoDate(start));
    const endDate = clampDate(formatAsIsoDate(today));

    return {
      startDate: startDate <= endDate ? startDate : endDate,
      endDate: endDate >= startDate ? endDate : startDate,
    };
  };

  const buildRangeFromPreset = (preset: Exclude<DatePreset, 'custom'>) => {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);

    if (preset === 'ultimos30') {
      start.setDate(start.getDate() - 30);
    } else if (preset === 'mesAtual') {
      start.setDate(1);
    } else {
      start.setMonth(start.getMonth() - 2);
    }

    const startDate = clampDate(formatAsIsoDate(start));
    const endDate = clampDate(formatAsIsoDate(end));

    return {
      startDate: startDate <= endDate ? startDate : endDate,
      endDate: endDate >= startDate ? endDate : startDate,
    };
  };

  const defaultFilterOptions: DashboardFilterOptions = {
    obras: LISTA_OBRAS,
    periodos: LISTA_PERIODOS,
    clientes: LISTA_CLIENTES,
    responsaveis: LISTA_RESPONSAVEIS,
  };

  const [activeTab, setActiveTab] = useState<string>('visao_geral');
  const [filters, setFilters] = useState<FilterState>({
    obra: 'Todas',
    periodo: 'Este Mês',
    cliente: 'Todos',
    responsavel: 'Todos'
  });
  const [snapshot, setSnapshot] = useState<SiengeBancoSnapshot | null>(null);
  const [baseSnapshot, setBaseSnapshot] = useState<SiengeBancoSnapshot | null>(null);
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions>(defaultFilterOptions);
  const [dateRange, setDateRange] = useState(buildDefaultDateRange);
  const [datePreset, setDatePreset] = useState<DatePreset>('ultimos30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadSiengeBancoSnapshot().then(loadedSnapshot => {
      if (cancelled || !loadedSnapshot) {
        return;
      }

      setBaseSnapshot(loadedSnapshot);
      setSnapshot(loadedSnapshot);
      setFilterOptions(getFilterOptionsFromSnapshot(loadedSnapshot));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFilters(prev => ({
      obra: filterOptions.obras.includes(prev.obra) ? prev.obra : 'Todas',
      periodo: filterOptions.periodos.includes(prev.periodo) ? prev.periodo : filterOptions.periodos[0],
      cliente: filterOptions.clientes.includes(prev.cliente) ? prev.cliente : 'Todos',
      responsavel: filterOptions.responsaveis.includes(prev.responsavel) ? prev.responsavel : 'Todos',
    }));
  }, [filterOptions]);

  const applyBackupDataToSnapshot = (
    base: SiengeBancoSnapshot,
    payload: {
      startDate: string;
      endDate: string;
      nfpg: { items: Array<Record<string, unknown>>; total: number };
      rfaturada: { items: Array<Record<string, unknown>>; total: number };
    },
  ): SiengeBancoSnapshot => {
    return {
      ...base,
      financeiro: {
        ...base.financeiro,
        periodoFiltro: {
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
        datasets: {
          ...(base.financeiro.datasets || {}),
          notasFiscaisCompra: {
            fetchedAt: new Date().toISOString(),
            total: payload.nfpg.total,
            pages: 1,
            items: payload.nfpg.items,
          },
          movimentacoesCaixaBancos: {
            fetchedAt: new Date().toISOString(),
            total: payload.rfaturada.total,
            pages: 1,
            items: payload.rfaturada.items,
          },
        },
      },
    };
  };

  useEffect(() => {
    if (!baseSnapshot) {
      return;
    }

    let cancelled = false;

    Promise.all([
      loadNfpgBackupData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
      loadRfaturadaBackupData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    ])
      .then(([nfpgData, rfaturadaData]) => {
        if (cancelled) {
          return;
        }

        setSnapshot(
          applyBackupDataToSnapshot(baseSnapshot, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            nfpg: {
              items: nfpgData.items,
              total: nfpgData.total,
            },
            rfaturada: {
              items: rfaturadaData.items,
              total: rfaturadaData.total,
            },
          }),
        );
      })
      .catch(error => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Falha ao carregar dados das pastas de backup.';
        setRefreshError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [baseSnapshot, dateRange.startDate, dateRange.endDate]);

  const handleRefreshFromSienge = async () => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);

      const normalizedRange = {
        startDate: clampDate(dateRange.startDate),
        endDate: clampDate(dateRange.endDate),
      };

      if (normalizedRange.startDate > normalizedRange.endDate) {
        setDateRange({
          startDate: normalizedRange.endDate,
          endDate: normalizedRange.endDate,
        });
        throw new Error('A data inicial não pode ser maior que a data final.');
      }

      if (!baseSnapshot) {
        throw new Error('Snapshot base não carregado para aplicar atualização local.');
      }

      await Promise.all([syncNfpgBackup(), syncRfaturadaBackup()]);

      const [nfpgData, rfaturadaData] = await Promise.all([
        loadNfpgBackupData(normalizedRange),
        loadRfaturadaBackupData(normalizedRange),
      ]);

      setSnapshot(
        applyBackupDataToSnapshot(baseSnapshot, {
          startDate: normalizedRange.startDate,
          endDate: normalizedRange.endDate,
          nfpg: {
            items: nfpgData.items,
            total: nfpgData.total,
          },
          rfaturada: {
            items: rfaturadaData.items,
            total: rfaturadaData.total,
          },
        }),
      );
      setDateRange(normalizedRange);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar dados do Sienge.';
      setRefreshError(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDatePreset('custom');
      return;
    }

    setDatePreset(preset);
    setDateRange(buildRangeFromPreset(preset));
  };

  // Calculate dashboard data dynamically based on active filters
  const dashboardData = useMemo(() => {
    return snapshot
      ? buildDashboardDataFromSnapshot(snapshot, filters)
      : getDashboardData(filters);
  }, [snapshot, filters]);

  const availableProjects = useMemo(() => {
    if (snapshot) {
      return dashboardData.availableProjects;
    }

    return Object.values(OBRAS_DETAILS);
  }, [snapshot, dashboardData]);

  // Real data memos from Sienge snapshot
  const suprimentosData = useMemo(() => snapshot ? buildSuprimentosData(snapshot) : null, [snapshot]);
  const rhData = useMemo(() => snapshot ? buildRhData(snapshot) : null, [snapshot]);
  const financeiroMensal = useMemo(() => snapshot ? buildFinanceiroMensal(snapshot) : null, [snapshot]);
  const comprasKpisReais = useMemo(() => snapshot ? buildComprasKpisReais(snapshot) : null, [snapshot]);
  const topFornecedoresReais = useMemo(() => snapshot ? buildTopFornecedoresReais(snapshot) : null, [snapshot]);
  const pedidosAbertosReais = useMemo(() => snapshot ? buildPedidosAbertosReais(snapshot) : null, [snapshot]);
  const topComprasReais = useMemo(() => snapshot ? buildTopComprasReais(snapshot) : null, [snapshot]);
  const comprasCategoriasReais = useMemo(() => snapshot ? buildComprasCategoriasReais(snapshot) : null, [snapshot]);
  const comprasStatusReais = useMemo(() => snapshot ? buildComprasStatusReais(snapshot) : null, [snapshot]);
  const financeResultsReais = useMemo(() => snapshot ? buildFinanceResults(snapshot) : null, [snapshot]);
  const fluxoCaixaDetalhadoReais = useMemo(() => snapshot ? buildFluxoCaixaDetalhado(snapshot) : null, [snapshot]);
  const indicadoresFinanceirosReais = useMemo(() => snapshot ? buildIndicadoresFinanceiros(snapshot) : null, [snapshot]);
  const ultimasMovimentacoesReais = useMemo(() => snapshot ? buildUltimasMovimentacoes(snapshot) : null, [snapshot]);

  // Handler to switch to 5D visualization of a specific project
  const handleViewProject5D = (projectName: string) => {
    const selectedProject = availableProjects.find(project => project.name === projectName);
    setFilters(prev => ({
      ...prev,
      obra: projectName,
      cliente: selectedProject && filterOptions.clientes.includes(selectedProject.cliente) ? selectedProject.cliente : prev.cliente,
      responsavel: selectedProject && filterOptions.responsaveis.includes(selectedProject.gerenteObra) ? selectedProject.gerenteObra : prev.responsavel,
    }));
    setActiveTab('5d_obra');
  };

  return (
    <div translate="no" className="flex h-screen w-screen bg-[#060b16] text-slate-300 overflow-hidden font-sans select-none">
      {/* 1. Left Sidebar Navigation & Filters */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filters={filters}
        setFilters={setFilters}
        options={filterOptions}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filters={filters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          activePreset={datePreset}
          onSelectPreset={handleSelectPreset}
          onRefreshFromSienge={handleRefreshFromSienge}
          isRefreshing={isRefreshing}
          refreshError={refreshError}
        />

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto bg-[#070c19]">
          {/* Active Tab View Switcher */}

          {activeTab === 'visao_geral' && (
            <GeneralDashboard data={dashboardData} />
          )}

          {activeTab === 'financeiro' && (
            <FinancialDashboard data={{
              ...dashboardData,
              financeResults: financeResultsReais ?? dashboardData.financeResults,
              fluxoCaixaDetalhado: fluxoCaixaDetalhadoReais ?? dashboardData.fluxoCaixaDetalhado,
              indicadoresFinanceiros: indicadoresFinanceirosReais ?? dashboardData.indicadoresFinanceiros,
              ultimasMovimentacoes: ultimasMovimentacoesReais ?? dashboardData.ultimasMovimentacoes,
              fluxoCaixaMensal: financeiroMensal
                ? financeiroMensal.map(r => ({ mes: r.mes, projetado: parseFloat((r.projetado / 1000000).toFixed(2)), realizado: r.isProjection ? 0 : parseFloat((r.compras / 1000000).toFixed(2)) }))
                : dashboardData.fluxoCaixaMensal,
            }} />
          )}

          {activeTab === 'compras' && (
            <PurchasingDashboard data={{
              ...dashboardData,
              kpis: comprasKpisReais ? { ...dashboardData.kpis, ...comprasKpisReais } : dashboardData.kpis,
              topFornecedores: topFornecedoresReais ?? dashboardData.topFornecedores,
              pedidosEmAberto: pedidosAbertosReais ?? dashboardData.pedidosEmAberto,
              comprasCategoria: comprasCategoriasReais ?? dashboardData.comprasCategoria,
              comprasStatus: comprasStatusReais ?? dashboardData.comprasStatus,
              curvaSData: financeiroMensal
                ? (() => {
                    const lastReal = financeiroMensal.filter(r => !r.isProjection && r.compras > 0);
                    const maxCompras = lastReal.reduce((s, r) => s + r.compras, 0);
                    let cum = 0;
                    return financeiroMensal.map(r => {
                      cum += r.compras;
                      const pct = maxCompras === 0 ? 0 : parseFloat(((cum / maxCompras) * 100).toFixed(1));
                      return { mes: r.mes, previstoFisico: Math.min(100, parseFloat((pct * 1.06).toFixed(1))), realizadoFisico: r.isProjection ? 0 : pct, realizadoFinanceiro: r.isProjection ? 0 : parseFloat((pct * 0.94).toFixed(1)) };
                    });
                  })()
                : dashboardData.curvaSData,
            }} />
          )}

          {activeTab === '5d_obra' && (
            <div className="p-6">
              <Project5DPanel projectDetails={dashboardData.projectDetails} />
            </div>
          )}

          {/* OBRAS: Project Directory Page */}
          {activeTab === 'obras' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Diretório de Obras em Execução</h2>
                  <p className="text-xs text-slate-500 mt-1">Visão integrada das obras ativas do Grupo Potencial.</p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  Total: 3 Projetos Ativos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableProjects.map(project => {
                  const progress = Math.round(
                    project.cronograma.reduce((sum, c) => sum + c.concluido, 0) / project.cronograma.length
                  );
                  return (
                    <div
                      key={project.id}
                      className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg hover:border-orange-500/50 transition-all duration-200"
                    >
                      <div className="p-5 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.tipo}</span>
                            <h3 className="font-extrabold text-white text-sm mt-1">{project.name}</h3>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                            project.datas.atrasoDias > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {project.datas.atrasoDias > 0 ? 'Atenção' : 'No Prazo'}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Progresso Físico Médio</span>
                            <span className="text-orange-400 font-mono">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-1.5 text-xs border-t border-slate-800/60 pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cliente:</span>
                            <span className="font-semibold text-slate-300">{project.cliente}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Valor Contratado:</span>
                            <span className="font-bold text-white">R$ {(project.valorContratado / 1000000).toFixed(2)} Mi</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gerente:</span>
                            <span className="font-semibold text-slate-300">{project.gerenteObra}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewProject5D(project.name)}
                        className="w-full py-2.5 bg-[#101b38] hover:bg-orange-600 hover:text-white text-orange-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Ver Detalhes & Engenharia 5D
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUPRIMENTOS Page */}
          {activeTab === 'suprimentos' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Suprimentos — Comprado e Entregue no Último Mês</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {suprimentosData ? `Período: ${suprimentosData.lastMonthLabel} · ${suprimentosData.pedidosCount} pedidos · ${suprimentosData.entreguesCount} entregues` : 'Carregando dados do Sienge...'}
                  </p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  ERP Sienge — Dados em Tempo Real
                </span>
              </div>

              {/* KPI cards */}
              {suprimentosData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col gap-1 shadow-md">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Comprado (Mês)</span>
                    <span className="text-base font-black text-white">R$ {(suprimentosData.totalComprado / 1000000).toFixed(2).replace('.', ',')} Mi</span>
                    <span className="text-[9px] text-slate-400">{suprimentosData.pedidosCount} pedidos emitidos</span>
                  </div>
                  <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col gap-1 shadow-md">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Entregue (Mês)</span>
                    <span className="text-base font-black text-emerald-400">R$ {(suprimentosData.totalEntregue / 1000000).toFixed(2).replace('.', ',')} Mi</span>
                    <span className="text-[9px] text-slate-400">{suprimentosData.entreguesCount} pedidos entregues</span>
                  </div>
                  <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col gap-1 shadow-md">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Taxa de Entrega</span>
                    <span className="text-base font-black text-white">
                      {suprimentosData.pedidosCount > 0 ? ((suprimentosData.entreguesCount / suprimentosData.pedidosCount) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="text-[9px] text-slate-400">Pedidos FULLY_DELIVERED</span>
                  </div>
                  <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col gap-1 shadow-md">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pendentes de Entrega</span>
                    <span className="text-base font-black text-amber-400">{suprimentosData.pedidosCount - suprimentosData.entreguesCount}</span>
                    <span className="text-[9px] text-slate-400">Pedidos em aberto</span>
                  </div>
                </div>
              )}

              {/* Comprado no último mês */}
              <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Pedidos do Último Mês — Por Valor (Sienge)</h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {suprimentosData ? `${suprimentosData.comprado.length} maiores pedidos` : '—'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-3">Pedido</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Descrição</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {(suprimentosData?.comprado ?? []).map((item, idx) => {
                        const statusColor =
                          item.status === 'FULLY_DELIVERED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          item.status === 'PARTIALLY_DELIVERED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          item.status === 'PENDING' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                          'text-slate-400 bg-slate-500/10 border-slate-700/40';
                        const statusLabel =
                          item.status === 'FULLY_DELIVERED' ? 'Entregue' :
                          item.status === 'PARTIALLY_DELIVERED' ? 'Parcial' :
                          item.status === 'PENDING' ? 'Pendente' : item.status;
                        return (
                          <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">#{item.orderNumber}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.date?.slice(5).replace('-', '/')}/{item.date?.slice(0, 4)}</td>
                            <td className="py-2.5 px-3 font-semibold max-w-xs truncate">{item.description || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(item.totalPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${statusColor}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {!suprimentosData && (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-xs">Carregando dados do Sienge...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Entregues no último mês */}
              {suprimentosData && suprimentosData.entregue.length > 0 && (
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">✓ Entregues no Canteiro — {suprimentosData.lastMonthLabel}</h3>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{suprimentosData.entregue.length} pedidos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5 px-3">Pedido</th>
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Descrição</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3 text-right">Valor</th>
                          <th className="py-2.5 px-3 text-right">Autorizado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {suprimentosData.entregue.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">#{item.orderNumber}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.date?.slice(5).replace('-', '/')}/{item.date?.slice(0, 4)}</td>
                            <td className="py-2.5 px-3 font-semibold max-w-xs truncate">{item.description || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(item.totalPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${item.authorized ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                                {item.authorized ? 'Sim' : 'Não'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RH Page */}
          {activeTab === 'rh' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Gestão de Recursos Humanos</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {rhData ? `${rhData.totalUsuarios} usuários ativos no ERP · ${rhData.usuariosObras} em obras · ${rhData.usuariosCompras} em compras` : 'Carregando dados do Sienge...'}
                  </p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  ERP Sienge — Dados em Tempo Real
                </span>
              </div>

              {/* Personnel stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: 'USUÁRIOS ERP ATIVOS', val: rhData ? `${rhData.totalUsuarios} usuários` : '—', desc: 'Registros ativos no Sienge', icon: Users },
                  { title: 'RESPONSÁVEIS POR OBRAS', val: rhData ? `${rhData.usuariosObras} usuários` : '—', desc: 'Com vínculo a empreendimentos', icon: HardHat },
                  { title: 'COMPRADORES ATIVOS', val: rhData ? `${rhData.usuariosCompras} usuários` : '—', desc: 'Com pedidos de compra', icon: Award },
                  { title: 'CONTAS BANCÁRIAS', val: snapshot ? `${snapshot.financeiro.datasets?.contasCorrentes?.total ?? 0} contas` : '—', desc: 'Integradas ao ERP', icon: Clock }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{stat.title}</span>
                        <span className="text-base font-black text-white mt-1">{stat.val}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{stat.desc}</span>
                      </div>
                      <div className="p-2 bg-orange-600/10 text-orange-400 border border-orange-500/10 rounded-lg shrink-0">
                        <Icon size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Usuários reais do ERP */}
              {rhData && (
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Usuários Registrados no ERP Sienge</h3>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      Sincronizado em {new Date(rhData.fetchedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5 px-4">Usuário</th>
                          <th className="py-2.5 px-3">Atuação</th>
                          <th className="py-2.5 px-3">Última Obra / Pedido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {rhData.usuarios.map((u, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 px-4 font-semibold">{u.nome}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex gap-1 flex-wrap">
                                {u.fontes.includes('obras') && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Obras</span>
                                )}
                                {u.fontes.includes('compras') && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Compras</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                              {u.ultimaObra ?? (u.ultimoPedido ? `Pedido #${u.ultimoPedido}` : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUALIDADE Page */}
          {activeTab === 'qualidade' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Garantia e Gestão de Qualidade</h2>
                  <p className="text-xs text-slate-500 mt-1">Auditorias, PBQP-H, ensaios tecnológicos e conformidades.</p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  Certificação ISO 9001 e PBQP-H Nível A
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PBQP-H indicators */}
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
                    <Award size={14} className="text-orange-500" />
                    Auditoria PBQP-H
                  </h3>
                  <div className="flex flex-col gap-3 flex-1 justify-center">
                    {[
                      { item: 'Conformidade de Materiais', rate: 97.4 },
                      { item: 'Controle Tecnológico Concreto', rate: 100.0 },
                      { item: 'Rastreabilidade de Ensaios', rate: 95.8 },
                      { item: 'Qualificação de Fornecedores', rate: 91.2 }
                    ].map((row, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">{row.item}</span>
                          <span className="text-emerald-400 font-mono">{row.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Concrete testing logs */}
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4">
                    Últimos Ensaios de Compressão de Concreto (Fck)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                          <th className="py-2 px-3">Obra / Local</th>
                          <th className="py-2 px-2">Idade</th>
                          <th className="py-2 px-2 text-right">Fck Projetado</th>
                          <th className="py-2 px-2 text-right">Fck Obtido</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {[
                          { loc: 'Escola Dinâmica - Laje 1º Pav.', age: '28 dias', proj: '30 MPa', obt: '34.2 MPa', status: 'Aprovado' },
                          { loc: 'Edifício Sol - Estacas Fund.', age: '28 dias', proj: '40 MPa', obt: '42.8 MPa', status: 'Aprovado' },
                          { loc: 'Galpão Sul - Piso Industrial', age: '7 dias', proj: '35 MPa', obt: '28.1 MPa', status: 'Aguardando' },
                          { loc: 'Escola Dinâmica - Pilares', age: '28 dias', proj: '30 MPa', obt: '31.5 MPa', status: 'Aprovado' }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[11px]">{row.loc}</td>
                            <td className="py-2.5 px-2 text-slate-400 text-[11px]">{row.age}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-400 text-[11px]">{row.proj}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[11px] font-bold text-white">{row.obt}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                row.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RELATÓRIOS Page */}
          {activeTab === 'relatorios' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Central de Relatórios Executivos</h2>
                  <p className="text-xs text-slate-500 mt-1">Exportação de planilhas e relatórios consolidados em tempo real.</p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  Gerador BI Automatizado
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: 'Status Físico-Financeiro', format: 'PDF / XLSX', size: '2.4 MB', desc: 'Relatório Curva S e prazos.' },
                  { title: 'Consolidado Compras', format: 'PDF / CSV', size: '1.8 MB', desc: 'Relação de insumos e cotações.' },
                  { title: 'Fechamento de Caixa', format: 'XLSX Only', size: '4.1 MB', desc: 'Entradas e saídas de obras.' },
                  { title: 'Boletim Diário de Obra', format: 'PDF Document', size: '12.5 MB', desc: 'Relatório fotográfico integral.' }
                ].map((rep, idx) => (
                  <div key={idx} className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-44 hover:border-orange-500/40 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-orange-400 font-mono font-bold tracking-widest uppercase">{rep.format}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{rep.size}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5 uppercase tracking-wider">{rep.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1">{rep.desc}</p>
                    </div>
                    <button className="w-full mt-4 py-2 bg-[#101b38] hover:bg-orange-600 hover:text-white rounded-lg text-[10px] font-bold text-orange-400 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer">
                      <Download size={12} />
                      Baixar Relatório
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
