import { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GeneralDashboard from './components/GeneralDashboard';
import FinancialDashboard from './components/FinancialDashboard';
import PurchasingDashboard from './components/PurchasingDashboard';
import Project5DPanel from './components/Project5DPanel';
import { FilterState } from './types';
import { getDashboardData, OBRAS_DETAILS } from './data';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('visao_geral');
  const [filters, setFilters] = useState<FilterState>({
    obra: 'Todas',
    periodo: 'Este Mês',
    cliente: 'Todos',
    responsavel: 'Todos'
  });

  // Calculate dashboard data dynamically based on active filters
  const dashboardData = useMemo(() => {
    return getDashboardData(filters);
  }, [filters]);

  // Handler to switch to 5D visualization of a specific project
  const handleViewProject5D = (projectName: string) => {
    setFilters(prev => ({
      ...prev,
      obra: projectName,
      cliente: projectName === 'Escola Municipal Dinâmica' ? 'Prefeitura Municipal' : projectName === 'Edifício Residencial Sol' ? 'Sol Empreendimentos' : 'LogiLog Transportes',
      responsavel: projectName === 'Escola Municipal Dinâmica' ? 'Eng. João Silva' : projectName === 'Edifício Residencial Sol' ? 'Eng. Maria Santos' : 'Eng. Ricardo Dias'
    }));
    setActiveTab('5d_obra');
  };

  return (
    <div className="flex h-screen w-screen bg-[#060b16] text-slate-300 overflow-hidden font-sans select-none">
      {/* 1. Left Sidebar Navigation & Filters */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filters={filters}
        setFilters={setFilters}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filters={filters}
        />

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto bg-[#070c19]">
          {/* Active Tab View Switcher */}

          {activeTab === 'visao_geral' && (
            <GeneralDashboard data={dashboardData} />
          )}

          {activeTab === 'financeiro' && (
            <FinancialDashboard data={dashboardData} />
          )}

          {activeTab === 'compras' && (
            <PurchasingDashboard data={dashboardData} />
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
                {Object.values(OBRAS_DETAILS).map(project => {
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
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Controle de Suprimentos & Logística</h2>
                  <p className="text-xs text-slate-500 mt-1">Estoque e movimentação de insumos nos canteiros.</p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  Integração Almoxarifado ERP Sienge
                </span>
              </div>

              {/* Suprimentos items table */}
              <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Status dos Insumos Críticos</h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">Atualizado hoje às 07:00</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-4">Material</th>
                        <th className="py-2.5 px-3">Unidade</th>
                        <th className="py-2.5 px-3 text-right">Estoque Atual</th>
                        <th className="py-2.5 px-3 text-right">Consumo Mensal</th>
                        <th className="py-2.5 px-3 text-right">Mínimo Crítico</th>
                        <th className="py-2.5 px-4 text-right">Status Estoque</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {[
                        { mat: 'Cimento CP-II', uni: 'Saco (50kg)', est: '1.240', cons: '3.500', min: '800', status: 'Estável', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                        { mat: 'Aço CA-50 10mm', uni: 'Tonelada', est: '14,2', cons: '22,0', min: '15,0', status: 'Abaixo do Mínimo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                        { mat: 'Areia Lavada Média', uni: 'm³', est: '450', cons: '1.200', min: '300', status: 'Estável', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                        { mat: 'Brita 1', uni: 'm³', est: '210', cons: '900', min: '250', status: 'Crítico', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                        { mat: 'Bloco Cerâmico 9x19x19', uni: 'Milheiro', est: '35,0', cons: '50,0', min: '12,0', status: 'Estável', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 text-slate-200 transition-colors">
                          <td className="py-3 px-4 font-semibold">{item.mat}</td>
                          <td className="py-3 px-3 text-slate-400">{item.uni}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{item.est}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">{item.cons}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">{item.min}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${item.color}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RH Page */}
          {activeTab === 'rh' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">Gestão de Recursos Humanos</h2>
                  <p className="text-xs text-slate-500 mt-1">Controle de efetivo, segurança laboral e alocação.</p>
                </div>
                <span className="text-xs bg-[#122240] text-orange-400 font-bold px-3 py-1 rounded-md border border-orange-500/20">
                  Integração CRM / Folha Sienge
                </span>
              </div>

              {/* Personnel stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: 'EFETIVO TOTAL', val: '438 colaboradores', desc: 'Próprio e terceirizado', icon: Users },
                  { title: 'ENGENHEIROS ATIVOS', val: '12 residentes', desc: 'Acompanhamento diário', icon: HardHat },
                  { title: 'TREINAMENTOS NR', val: '98% adimplência', desc: 'Meta de segurança laboral', icon: Award },
                  { title: 'TAXA DE ABSENTEÍSMO', val: '1,4%', desc: 'Abaixo da média setorial', icon: Clock }
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
