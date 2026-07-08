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
  ShoppingCart,
  Percent,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  DollarSign,
  Briefcase
} from 'lucide-react';
import {
  KPIData,
  CurvaSData,
  ComprasCategoriaItem,
  ComprasStatusItem,
  TopFornecedor,
  PedidoAbertoRow,
  ComprasEtapaRow
} from '../types';

interface PurchasingDashboardProps {
  data: {
    kpis: KPIData;
    curvaSData: CurvaSData[];
    comprasCategoria: ComprasCategoriaItem[];
    comprasStatus: ComprasStatusItem[];
    topFornecedores: TopFornecedor[];
    pedidosEmAberto: PedidoAbertoRow[];
    comprasEtapa: ComprasEtapaRow[];
  };
}

export default function PurchasingDashboard({ data }: PurchasingDashboardProps) {
  const {
    kpis,
    curvaSData,
    comprasCategoria,
    comprasStatus,
    topFornecedores,
    pedidosEmAberto,
    comprasEtapa
  } = data;

  const COLORS_CATEGORIA = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
  const COLORS_STATUS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b'];

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

  // Helper for rendering status circles/badges
  const getStatusStyle = (status: PedidoAbertoRow['status']) => {
    switch (status) {
      case 'Confirmado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Em Aprovação': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Aguardando Entrega': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Cotação': return 'bg-slate-500/15 text-slate-300 border-slate-700/35';
    }
  };

  // Dummy monthly comparison for the bottom right bar chart (as shown in image 3)
  const monthlyPurchaseChartData = [
    { name: 'Jan', Compras: 1.2, Economia: 0.1 },
    { name: 'Fev', Compras: 1.8, Economia: 0.15 },
    { name: 'Mar', Compras: 2.1, Economia: 0.12 },
    { name: 'Abr', Compras: 2.48, Economia: 0.18 },
    { name: 'Mai', Compras: 2.8, Economia: 0.22 },
    { name: 'Jun', Compras: 2.2, Economia: 0.14 }
  ].map(item => ({
    ...item,
    Compras: parseFloat((item.Compras * (kpis.totalCompradoMes || 2.48) / 2.48).toFixed(2)),
    Economia: parseFloat((item.Economia * (kpis.totalCompradoMes || 2.48) / 2.48).toFixed(2))
  }));

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in select-text">
      {/* 1. KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {/* Total Comprado Mês */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Comprado (Mês)</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.totalCompradoMes || 0)}</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              15,3% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-blue-600/10 text-blue-400 border border-blue-500/10 rounded-lg shrink-0">
            <ShoppingCart size={16} />
          </div>
        </div>

        {/* Total Comprado Acumulado */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Comprado (Acum.)</span>
            <span className="text-base font-black text-white">{formatCurrencyMi(kpis.totalCompradoAcumulado || 0)}</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              9,8% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded-lg shrink-0">
            <Briefcase size={16} />
          </div>
        </div>

        {/* Economia Obtida */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Economia Obtida (Acum.)</span>
            <span className="text-base font-black text-white">
              {kpis.economiaObtidaAcumulada && kpis.economiaObtidaAcumulada >= 1
                ? formatCurrencyMi(kpis.economiaObtidaAcumulada)
                : `${(kpis.economiaObtidaAcumulada || 0.78 * 1000).toFixed(0)} Mil`
              }
            </span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} />
              6,2% vs mês ant.
            </span>
          </div>
          <div className="p-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 rounded-lg shrink-0">
            <DollarSign size={16} />
          </div>
        </div>

        {/* % Economia */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">% Economia</span>
            <span className="text-base font-black text-emerald-400">{kpis.percentualEconomia || 0}%</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle size={10} />
              meta: &gt; 5%
            </span>
          </div>
          <div className="p-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 rounded-lg shrink-0">
            <Percent size={16} />
          </div>
        </div>

        {/* Pedidos em Aberto */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pedidos em Aberto</span>
            <span className="text-base font-black text-white">{kpis.pedidosEmAberto || 0}</span>
            <span className="text-[9px] text-slate-500 font-bold">
              {kpis.totalPendingValue != null && kpis.totalPendingValue > 0
                ? `Valor: ${kpis.totalPendingValue >= 1000000 ? `R$ ${(kpis.totalPendingValue/1000000).toFixed(2)} Mi` : `R$ ${(kpis.totalPendingValue/1000).toFixed(0)} Mil`}`
                : 'Pedidos não finalizados'}
            </span>
          </div>
          <div className="p-2 bg-amber-600/10 text-amber-400 border border-amber-500/10 rounded-lg shrink-0">
            <ShoppingCart size={16} />
          </div>
        </div>

        {/* Atrasos de Entrega */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Atrasos de Entrega</span>
            <span className="text-base font-black text-white">{kpis.atrasosEntrega || 0}</span>
            <span className="text-[9px] text-slate-500 font-bold">
              {kpis.totalLateValue != null && kpis.totalLateValue > 0
                ? `Valor: ${kpis.totalLateValue >= 1000000 ? `R$ ${(kpis.totalLateValue/1000000).toFixed(2)} Mi` : `R$ ${(kpis.totalLateValue/1000).toFixed(0)} Mil`}`
                : 'Pedidos com deliveryLate'}
            </span>
          </div>
          <div className="p-2 bg-red-600/10 text-red-400 border border-red-500/10 rounded-lg shrink-0">
            <Truck size={16} />
          </div>
        </div>

        {/* Compras Emergenciais */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Compras Emergenciais</span>
            <span className="text-base font-black text-emerald-400">{kpis.comprasEmergenciais || 0}%</span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle size={10} />
              meta: &lt; 10%
            </span>
          </div>
          <div className="p-2 bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 rounded-lg shrink-0">
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* 2. Charts Row (Compras por Categoria, Evolução das Compras, Compras por Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compras por Categoria */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            COMPRAS POR CATEGORIA (ACUMULADO)
          </h4>
          <div className="grid grid-cols-12 items-center flex-1">
            <div className="col-span-5 h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={comprasCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {comprasCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CATEGORIA[index % COLORS_CATEGORIA.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-extrabold text-white">R$ 14,21M</span>
                <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">TOTAL</span>
              </div>
            </div>
            <div className="col-span-7 flex flex-col gap-1 pl-3 text-[10px]">
              {comprasCategoria.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS_CATEGORIA[index % COLORS_CATEGORIA.length] }}
                    />
                    <span className="text-slate-400 text-[10px] truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evolução das Compras */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            EVOLUÇÃO DAS COMPRAS (ACUMULADO)
          </h4>
          <div className="w-full h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curvaSData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px' }}
                  itemStyle={{ fontSize: '9px', padding: '1px 0' }}
                />
                <Legend iconSize={5} iconType="circle" wrapperStyle={{ fontSize: '8px', paddingTop: '4px' }} />
                <Line name="Previsto" type="monotone" dataKey="previstoFisico" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line name="Realizado" type="monotone" dataKey="realizadoFisico" stroke="#10b981" strokeWidth={2} dot={{ r: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compras por Status */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col shadow-md">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3">
            COMPRAS POR STATUS (VALOR)
          </h4>
          <div className="grid grid-cols-12 items-center flex-1">
            <div className="col-span-5 h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={comprasStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {comprasStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-extrabold text-white">R$ 3,65M</span>
                <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">EM ABERTO</span>
              </div>
            </div>
            <div className="col-span-7 flex flex-col gap-1 pl-3 text-[10px]">
              {comprasStatus.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS_STATUS[index % COLORS_STATUS.length] }}
                    />
                    <span className="text-slate-400 text-[10px] truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Top Fornecedores, Pedidos em Aberto, Compras por Etapa, Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TOP 5 FORNECEDORES */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            TOP 5 FORNECEDORES (ACUMULADO)
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2 px-3">Fornecedor</th>
                  <th className="py-2 px-2 text-right">Comprado</th>
                  <th className="py-2 px-2 text-right">Part. %</th>
                  <th className="py-2 px-2 text-right">Economia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {topFornecedores.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[11px] truncate max-w-[110px]">{row.fornecedor}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[11px]">{formatCurrencyRaw(row.comprado)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[11px] text-slate-400">{row.participacao.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[11px] text-emerald-400 font-bold">
                      {formatCurrencyRaw(row.economia)} ({row.economiaPercentual.toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PEDIDOS EM ABERTO */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            PEDIDOS EM ABERTO (RELAÇÃO CRM)
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-[11px] font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[8px] font-bold">
                  <th className="py-2 px-2">Pedido</th>
                  <th className="py-2 px-2">Fornecedor</th>
                  <th className="py-2 px-2 text-right">Valor</th>
                  <th className="py-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {pedidosEmAberto.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="py-2 px-2 font-mono font-bold text-slate-400">{row.pedido}</td>
                    <td className="py-2 px-2 truncate max-w-[70px]" title={row.fornecedor}>{row.fornecedor}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold">{formatCurrencyRaw(row.valor)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${getStatusStyle(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMPRAS POR ETAPA DA OBRA */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            COMPRAS POR ETAPA DA OBRA (ACUMULADO)
          </h4>
          <div className="overflow-x-auto flex-1 max-h-[220px]">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2 px-2">Etapa</th>
                  <th className="py-2 px-2 text-right">Previsto</th>
                  <th className="py-2 px-2 text-right">Comprado</th>
                  <th className="py-2 px-2 text-right">Desvio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {comprasEtapa.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                    <td className="py-2 px-2 font-semibold text-[11px] truncate max-w-[100px]">{row.etapa}</td>
                    <td className="py-2 px-2 text-right font-mono text-[11px]">{formatCurrencyRaw(row.previsto)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[11px]">{formatCurrencyRaw(row.comprado)}</td>
                    <td className={`py-2 px-2 text-right font-mono text-[11px] font-bold ${row.desvio < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.desvio < 0 ? `-${formatCurrencyRaw(Math.abs(row.desvio))}` : `+${formatCurrencyRaw(row.desvio)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ÚLTIMAS MOVIMENTAÇÕES COMPRAS */}
        <div className="lg:col-span-2 bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col shadow-md h-full">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 border-b border-slate-800 pb-2">
            ÚLTIMAS MOVIMENTAÇÕES
          </h4>
          {/* A bar chart representing monthly comparison on the bottom right exactly as in the purchases screen */}
          <div className="w-full h-[180px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPurchaseChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px' }}
                  itemStyle={{ fontSize: '9px', padding: '1px 0' }}
                />
                <Bar name="Compras" dataKey="Compras" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar name="Economia" dataKey="Economia" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
