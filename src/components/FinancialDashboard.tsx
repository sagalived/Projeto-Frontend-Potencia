import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  DollarSign,
  Percent,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  KPIData,
  CurvaSData,
  CostDistributionItem,
  FinanceResultRow,
  FluxoCaixaDetalhadoRow,
  FinanceIndicator,
  FinanceTransaction,
  FluxoCaixaMensalData
} from '../types';

interface FinancialDashboardProps {
  data: {
    kpis: KPIData;
    curvaSData: CurvaSData[];
    custoDist: CostDistributionItem[];
    financeResults: FinanceResultRow[];
    fluxoCaixaDetalhado: FluxoCaixaDetalhadoRow[];
    indicadoresFinanceiros: FinanceIndicator[];
    ultimasMovimentacoes: FinanceTransaction[];
    fluxoCaixaMensal: FluxoCaixaMensalData[];
  };
}

export default function FinancialDashboard({ data }: FinancialDashboardProps) {
  const {
    kpis,
    curvaSData,
    custoDist,
    financeResults,
    fluxoCaixaDetalhado,
    indicadoresFinanceiros,
    ultimasMovimentacoes,
    fluxoCaixaMensal
  } = data;

  const COLORS_DIST = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

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

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in select-text">
      {/* 1. Top KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {/* Receita Contratada */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Receita Contratada</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.receitaContratada)}</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              12,6% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-blue-600/10 text-blue-400 border border-blue-500/10 rounded-lg shrink-0">
            <DollarSign size={16} />
          </div>
        </div>

        {/* Receita Faturada */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Receita Faturada</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.receitaFaturada || 0)}</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              8,2% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded-lg shrink-0">
            <Layers size={16} />
          </div>
        </div>

        {/* Custo Real Acumulado */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Custo Real Acumulado</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.custoReal)}</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowDownRight size={10} />
              5,4% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-amber-600/10 text-amber-400 border border-amber-500/10 rounded-lg shrink-0">
            <TrendingDown size={16} />
          </div>
        </div>

        {/* Margem Real */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Margem Real</span>
            <span className="text-base font-black text-emerald-400">{kpis.margemReal.toFixed(1).replace('.', ',')}%</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              2,1 p.p. vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 rounded-lg shrink-0">
            <Percent size={16} />
          </div>
        </div>

        {/* Fluxo de Caixa Projetado */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">F.C. Projetado</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.fluxoCaixaProjetado || 0)}</span>
            <span className="text-[9px] text-slate-500 font-bold">Saldo em 31/05/2025</span>
          </div>
          <div className="p-2 bg-teal-600/10 text-teal-400 border border-teal-500/10 rounded-lg shrink-0">
            <Calendar size={16} />
          </div>
        </div>

        {/* Fluxo de Caixa Real */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">F.C. Real</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.fluxoCaixaReal || 0)}</span>
            <span className="text-[9px] text-slate-500 font-bold">Saldo em 31/05/2025</span>
          </div>
          <div className="p-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 rounded-lg shrink-0">
            <CheckCircle size={16} />
          </div>
        </div>

        {/* Desvio Orçamentário */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Desvio Orçamentário</span>
            <span className="text-base font-black text-emerald-400">{kpis.desvioOrcamentario}%</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowDownRight size={10} />
              -1,2 p.p. vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 rounded-lg shrink-0">
            <TrendingUp size={16} />
          </div>
        </div>
      </div>

      {/* 2. Charts Row (Curva S, Fluxo Caixa Mensal, Composição de Custos, Análise Desvio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* S-Curve */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            CURVA S - FÍSICO X FINANCEIRO
          </h4>
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curvaSData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px' }}
                  itemStyle={{ fontSize: '9px', padding: '1px 0' }}
                />
                <Line name="Prev" type="monotone" dataKey="previstoFisico" stroke="#64748b" strokeDasharray="3 3" dot={false} />
                <Line name="Fís" type="monotone" dataKey="realizadoFisico" stroke="#10b981" strokeWidth={2} dot={{ r: 1.5 }} />
                <Line name="Fin" type="monotone" dataKey="realizadoFinanceiro" stroke="#f97316" strokeWidth={2} dot={{ r: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cash Flow (Projected vs Realized) */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            FLUXO DE CAIXA MENSAL (PROJETADO X REALIZADO)
          </h4>
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoCaixaMensal} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px' }}
                  itemStyle={{ fontSize: '9px', padding: '1px 0' }}
                />
                <Legend iconSize={5} iconType="rect" wrapperStyle={{ fontSize: '8px', paddingTop: '4px' }} />
                <Bar name="Projetado" dataKey="projetado" fill="#2563eb" radius={[2, 2, 0, 0]} />
                <Bar name="Realizado" dataKey="realizado" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Composition Doughnut */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            COMPOSIÇÃO DE CUSTOS (ACUMULADO)
          </h4>
          <div className="grid grid-cols-12 items-center flex-1">
            <div className="col-span-5 h-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={custoDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {custoDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_DIST[index % COLORS_DIST.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-extrabold text-white">R$ 7,62M</span>
                <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Custo Real</span>
              </div>
            </div>
            <div className="col-span-7 flex flex-col gap-1 pl-2 text-[10px]">
              {custoDist.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS_DIST[index % COLORS_DIST.length] }}
                    />
                    <span className="text-slate-400 text-[10px] truncate max-w-[65px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deviation Analysis */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-2">
            ANÁLISE DE DESVIO POR ETAPA
          </h4>
          <div className="overflow-x-auto overflow-y-auto max-h-[145px] pr-1">
            <table className="w-full text-left text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                  <th className="py-1 px-1">Etapa</th>
                  <th className="py-1 px-1 text-right">Previsto</th>
                  <th className="py-1 px-1 text-right">Realizado</th>
                  <th className="py-1 px-1 text-right">Desvio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {[
                  { etapa: 'Serviços Inic.', prev: 450000, real: 430000, desv: -20000 },
                  { etapa: 'Fundação', prev: 1280000, real: 1250000, desv: -30000 },
                  { etapa: 'Estrutura', prev: 5200000, real: 5420000, desv: 220000 },
                  { etapa: 'Alvenaria', prev: 3150000, real: 2970000, desv: -180000 },
                  { etapa: 'Cobertura', prev: 2100000, real: 2160000, desv: 60000 }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-1 font-semibold">{row.etapa}</td>
                    <td className="py-1.5 px-1 text-right font-mono text-[9px]">{formatCurrencyRaw(row.prev)}</td>
                    <td className="py-1.5 px-1 text-right font-mono text-[9px]">{formatCurrencyRaw(row.real)}</td>
                    <td className={`py-1.5 px-1 text-right font-mono font-bold ${row.desv < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.desv < 0 ? `-${formatCurrencyRaw(Math.abs(row.desv))}` : `+${formatCurrencyRaw(row.desv)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Demonstrativo, F.C. Detalhado, Indicadores, Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DEMONSTRATIVO DE RESULTADO */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            DEMONSTRATIVO DE RESULTADO (ACUMULADO)
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-2 text-right">Previsto</th>
                  <th className="py-2 px-2 text-right">Realizado</th>
                  <th className="py-2 px-3 text-right">Desvio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {financeResults.map((row, idx) => {
                  const isMargin = row.descricao.includes('Margem');
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                      <td className="py-2 px-3 font-semibold text-[11px]">{row.descricao}</td>
                      <td className="py-2 px-2 text-right font-mono text-[11px]">
                        {isMargin ? `${row.previsto.toFixed(1)}%` : formatCurrencyRaw(row.previsto)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[11px]">
                        {isMargin ? `${row.realizado.toFixed(1)}%` : formatCurrencyRaw(row.realizado)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono text-[11px] font-bold ${
                        row.percentualDesvio < 0
                          ? 'text-emerald-400'
                          : row.percentualDesvio > 0
                            ? 'text-red-400'
                            : 'text-slate-400'
                      }`}>
                        {isMargin
                          ? `${row.desvio.toFixed(1)} p.p.`
                          : row.desvio < 0
                            ? `-${formatCurrencyRaw(Math.abs(row.desvio))}`
                            : row.desvio > 0
                              ? `+${formatCurrencyRaw(row.desvio)}`
                              : '0'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FLUXO DE CAIXA DETALHADO */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            FLUXO DE CAIXA DETALHADO (PRÓXIMOS 6 MESES)
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2 px-2">Mês</th>
                  <th className="py-2 px-2 text-right">Entradas</th>
                  <th className="py-2 px-2 text-right">Saídas</th>
                  <th className="py-2 px-2 text-right">Saldo R.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {fluxoCaixaDetalhado.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="py-2 px-2 font-semibold text-[11px] text-slate-400">{row.mes}</td>
                    <td className="py-2 px-2 text-right font-mono text-[11px] text-emerald-400">+{formatCurrencyRaw(row.entradas)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[11px] text-red-400">-{formatCurrencyRaw(row.saidas)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[11px] font-bold">{formatCurrencyRaw(row.saldoReal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INDICADORES FINANCEIROS */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            INDICADORES FINANCEIROS
          </h4>
          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            {indicadoresFinanceiros.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-300 leading-tight truncate max-w-[130px]">{ind.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-emerald-400">
                    {ind.value.toString().replace('.', ',')}{ind.name.includes('%') ? '%' : ''}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{ind.metaLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÚLTIMAS MOVIMENTAÇÕES */}
        <div className="lg:col-span-2 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            ÚLTIMAS MOVIMENTAÇÕES
          </h4>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {ultimasMovimentacoes.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-900/20 p-2 rounded border border-slate-800/40 text-[10px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-bold font-mono">{t.data}</span>
                  <span className="text-slate-200 font-semibold leading-tight truncate max-w-[100px]" title={t.descricao}>
                    {t.descricao}
                  </span>
                </div>
                <span className={`font-mono font-bold ${t.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'}{formatCurrencyRaw(t.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
