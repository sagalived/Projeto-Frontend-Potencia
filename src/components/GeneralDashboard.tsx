import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  DollarSign,
  ShoppingCart,
  HardHat,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { FilterState, KPIData, Project5DDetails } from '../types';
import Project5DPanel from './Project5DPanel';

interface GeneralDashboardProps {
  data: {
    kpis: KPIData;
    curvaSData: any[];
    custoDist: any[];
    statusObras: any[];
    topCompras: any[];
    fluxoCaixa: any[];
    indicadores: any[];
    alertas: any[];
    projectDetails: Project5DDetails;
  };
}

export default function GeneralDashboard({ data }: GeneralDashboardProps) {
  const {
    kpis,
    curvaSData,
    custoDist,
    statusObras,
    topCompras,
    fluxoCaixa,
    indicadores,
    alertas,
    projectDetails
  } = data;

  const COLORS_DIST = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
  const COLORS_STATUS = ['#10b981', '#f59e0b', '#ef4444'];

  const formatCurrencyMi = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')} Mi`;
  };

  const formatCurrencyRaw = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const reciboVsMesAnterior = kpis.receitaContratadaVsMesAnterior;
  const hasReciboComparativo = typeof reciboVsMesAnterior === 'number';
  const reciboTrendUp = (reciboVsMesAnterior ?? 0) >= 0;
  const reciboTrendColor = !hasReciboComparativo
    ? 'text-slate-400'
    : reciboTrendUp
      ? 'text-emerald-400'
      : 'text-rose-400';
  const reciboTrendLabel = !hasReciboComparativo
    ? 'Sem base no mês anterior'
    : `${reciboTrendUp ? '+' : ''}${reciboVsMesAnterior.toFixed(1).replace('.', ',')}% vs mês ant.`;

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in select-text">
      {/* 1. KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {/* Receita Contratada */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">RECEITA CONTRATADA</span>
            <span className="text-lg font-black text-white">{formatCurrencyMi(kpis.receitaContratada)}</span>
            <span className={`text-[10px] font-bold flex items-center gap-1 ${reciboTrendColor}`}>
              {!hasReciboComparativo ? (
                <Clock size={12} />
              ) : reciboTrendUp ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {reciboTrendLabel}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/10">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Custo Previsto */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CUSTO PREVISTO</span>
            <span className="text-lg font-black text-white">{formatCurrencyMi(kpis.custoPrevisto)}</span>
            <span className="text-[10px] text-slate-500 font-bold">Orçamento Base</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-600/10 text-amber-400 border border-amber-500/10">
            <Activity size={18} />
          </div>
        </div>

        {/* Custo Real */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CUSTO REAL</span>
            <span className="text-lg font-black text-white">{formatCurrencyMi(kpis.custoReal)}</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ArrowDownRight size={12} />
              -3,8% vs previsto
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10">
            <TrendingDown size={18} />
          </div>
        </div>

        {/* Margem Prevista */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">MARGEM PREVISTA</span>
            <span className="text-lg font-black text-white">{kpis.margemPrevista.toFixed(2).replace('.', ',')}%</span>
            <span className="text-[10px] text-slate-500 font-bold">Meta Executiva</span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/10">
            <Percent size={18} />
          </div>
        </div>

        {/* Margem Real */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">MARGEM REAL</span>
            <span className="text-lg font-black text-emerald-400">{kpis.margemReal.toFixed(2).replace('.', ',')}%</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight size={12} />
              +2,3 p.p. vs previsto
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Obras em Andamento */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">OBRAS EM ANDAMENTO</span>
            <span className="text-lg font-black text-white">{kpis.obrasEmAndamento}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {kpis.obrasPublicas} púb. | {kpis.obrasPrivadas} priv.
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
            <HardHat size={18} />
          </div>
        </div>

        {/* Avanço Médio Dial */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md min-h-[96px] relative overflow-hidden">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AVANÇO MÉDIO</span>
            <span className="text-lg font-black text-white">{kpis.avancoMedio}%</span>
          </div>
          {/* Semicircle Indicator simulation */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
              style={{ width: `${kpis.avancoMedio}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Status Geral</span>
        </div>
      </div>

      {/* 2. Charts Row (Curva S, Custos, Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Curva S */}
        <div className="lg:col-span-5 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
              Avanço Físico X Financeiro (Curva S)
            </h4>
          </div>
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curvaSData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ fontSize: '11px', padding: '1px 0' }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line
                  name="Previsto (Físico)"
                  type="monotone"
                  dataKey="previstoFisico"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  name="Realizado (Físico)"
                  type="monotone"
                  dataKey="realizadoFisico"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  name="Realizado (Financeiro)"
                  type="monotone"
                  dataKey="realizadoFinanceiro"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Custos */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4">
            Distribuição de Custos
          </h4>
          <div className="grid grid-cols-12 items-center flex-1">
            {/* Pie Chart */}
            <div className="col-span-5 h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={custoDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {custoDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_DIST[index % COLORS_DIST.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-black text-white">{formatCurrencyMi(kpis.custoReal)}</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Custo Real</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="col-span-7 flex flex-col gap-1.5 pl-4 text-xs">
              {custoDist.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS_DIST[index % COLORS_DIST.length] }}
                    />
                    <span className="text-slate-400 font-medium text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white text-[11px]">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status das Obras */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4">
            Status das Obras
          </h4>
          <div className="grid grid-cols-12 items-center flex-1">
            {/* Pie Chart */}
            <div className="col-span-6 h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusObras}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusObras.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-white">{kpis.obrasEmAndamento}</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Obras</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="col-span-6 flex flex-col gap-2 pl-3 text-xs">
              {statusObras.map((item, index) => (
                <div key={item.name} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-400 font-bold text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-200 text-[10px] pl-3.5">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 5D BIM & Sienge ERP Interactive Visualizer Panel */}
      <div className="w-full">
        <Project5DPanel projectDetails={projectDetails} />
      </div>

      {/* 4. Bottom Grids (Top compras, Fluxo de caixa, Indicadores, Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Compras do Mês */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Top 5 Compras do Mês</span>
            <span className="text-[9px] font-bold text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10">CRM / ERP</span>
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-2">Fornecedor</th>
                  <th className="py-2.5 px-2 text-right">Valor</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {topCompras.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[11px]">{c.item}</td>
                    <td className="py-2.5 px-2 text-slate-400 text-[11px]">{c.fornecedor}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-[11px]">{formatCurrencyRaw(c.valor)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${
                        c.status === 'Entregue'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : c.status === 'Em Trânsito'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fluxo de Caixa Acumulado */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4 border-b border-slate-800 pb-2">
            Fluxo de Caixa (Acumulado)
          </h4>
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fluxoCaixa} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                  itemStyle={{ fontSize: '10px', padding: '1px 0' }}
                />
                <Legend iconSize={6} iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                <Line name="Previsto" type="monotone" dataKey="previsto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                <Line name="Realizado" type="monotone" dataKey="realizado" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indicadores de Desempenho */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4 border-b border-slate-800 pb-2">
            Indicadores de Desempenho
          </h4>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {indicadores.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/30 p-2 rounded-lg border border-slate-800/60">
                <div className="flex items-center gap-2">
                  {ind.value >= ind.meta ? (
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 animate-pulse" />
                  )}
                  <span className="text-[11px] font-semibold text-slate-300 leading-tight">{ind.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-black ${ind.value >= ind.meta ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ind.value.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">meta: {ind.meta.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="lg:col-span-2 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-4 border-b border-slate-800 pb-2">
            Alertas Ativos
          </h4>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-28">
                <CheckCircle size={22} className="text-emerald-500 mb-1.5" />
                <span className="text-xs font-semibold text-slate-400">Nenhum alerta ativo</span>
              </div>
            ) : (
              alertas.map(al => (
                <div
                  key={al.id}
                  className={`flex gap-2 p-2.5 rounded-lg border text-[10px] leading-snug font-medium ${
                    al.severity === 'critical'
                      ? 'bg-red-500/5 border-red-500/20 text-red-400'
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{al.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
