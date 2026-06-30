import { useState } from 'react';
import {
  FileText,
  Map,
  Layers,
  Clock,
  CircleDollarSign,
  Maximize2,
  Minimize2,
  TrendingDown,
  RotateCw,
  Building2,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Project5DDetails } from '../types';
import { OBRAS_DETAILS, VISUAL_ASSETS as assets } from '../data';

interface Project5DPanelProps {
  projectDetails: Project5DDetails;
}

export default function Project5DPanel({ projectDetails }: Project5DPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'1D' | '2D' | '3D' | '4D' | '5D'>('1D');
  const [is3DRotating, setIs3DRotating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const subTabs = [
    { id: '1D' as const, label: '1D - ESCOPO', icon: FileText, desc: 'Escopo & Especificações' },
    { id: '2D' as const, label: '2D - PLANTA', icon: Map, desc: 'Projetos & Desenhos' },
    { id: '3D' as const, label: '3D - MODELO', icon: Layers, desc: 'Modelagem BIM 3D' },
    { id: '4D' as const, label: '4D - TEMPO (CRONOGRAMA)', icon: Clock, desc: 'Linha do Tempo' },
    { id: '5D' as const, label: '5D - CUSTOS', icon: CircleDollarSign, desc: 'Custos por Etapa' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      {/* Title / Banner of Section */}
      <div className="bg-[#101b38] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-orange-500 animate-pulse" />
          <h3 className="text-xs md:text-sm font-extrabold tracking-wider text-white uppercase">
            VISUALIZAÇÃO 5D DA OBRA - {projectDetails.name.toUpperCase()}
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
          INTEGRAÇÃO BIM & ERP
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-[440px]">
        {/* Left Side: Photo Render and Contract Metadata */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-[#070c18] flex flex-col p-4 justify-between">
          <div className="flex flex-col gap-3">
            {/* School Main Render Photo */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 group h-44 bg-slate-950 flex items-center justify-center">
              <img
                src={assets.render}
                alt={projectDetails.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-slate-950/70 text-slate-200 px-2 py-0.5 rounded-md backdrop-blur-xs">
                Render Maquete Eletrônica
              </span>
            </div>

            {/* Contract Info Table */}
            <div className="flex flex-col gap-1.5 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Cliente:</span>
                <span className="font-semibold text-white">{projectDetails.cliente}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tipo:</span>
                <span className="font-semibold text-white">{projectDetails.tipo}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Contrato:</span>
                <span className="font-semibold text-white">{projectDetails.contrato}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Valor Contratado:</span>
                <span className="font-bold text-orange-400">{formatCurrency(projectDetails.valorContratado)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Prazo Contratual:</span>
                <span className="font-semibold text-white text-[11px]">{projectDetails.prazoContratual}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gerente da Obra:</span>
                <span className="font-semibold text-white text-[11px] flex items-center gap-1">
                  <User size={10} className="text-orange-500" />
                  {projectDetails.gerenteObra}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed content view (1D - 5D) */}
        <div className="lg:col-span-8 flex flex-col bg-[#091024]">
          {/* Sub-tab Selection Header */}
          <div className="grid grid-cols-5 border-b border-slate-800 text-center text-xs">
            {subTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  title={tab.desc}
                  className={`py-3 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 font-bold transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#121c38] text-orange-400 border-orange-500'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0d1630]'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
                  <span className="text-[9px] md:text-xs tracking-wider">{tab.id} - {tab.id === '1D' ? 'ESCOPO' : tab.id === '2D' ? 'PLANTA' : tab.id === '3D' ? 'MODELO' : tab.id === '4D' ? 'TEMPO' : 'CUSTOS'}</span>
                </button>
              );
            })}
          </div>

          {/* Active Panel View */}
          <div className="p-5 flex-1 overflow-y-auto h-[340px] select-text">
            {activeSubTab === '1D' && (
              <div className="flex flex-col gap-4 animate-fade-in text-slate-300">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-orange-500 tracking-wider mb-2">Descrição do Escopo</h4>
                  <p className="text-xs bg-[#0b1329] p-3 rounded-lg border border-slate-800/80 leading-relaxed text-slate-200">
                    {projectDetails.descricaoEscopo}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-orange-500 tracking-wider mb-2">Quantitativos principais</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {projectDetails.quantitativos.map((q, idx) => (
                      <div key={idx} className="bg-[#0e1630] border border-slate-800 p-2.5 rounded-lg flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{q.label}</span>
                        <span className="text-sm font-bold text-white mt-1">{q.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === '2D' && (
              <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in relative">
                <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-56 bg-white w-full max-w-[340px] p-2 flex items-center justify-center">
                  <img
                    src={assets.planta}
                    alt="Planta Baixa 2D"
                    referrerPolicy="no-referrer"
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-h-48 object-contain transition-transform duration-200"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 bg-slate-900/80 p-1 rounded backdrop-blur-xs border border-slate-800">
                    <button
                      onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))}
                      className="p-1 hover:bg-slate-800 rounded text-xs text-white font-bold cursor-pointer"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.2))}
                      className="p-1 hover:bg-slate-800 rounded text-xs text-white font-bold cursor-pointer"
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:bg-slate-800 rounded text-[9px] text-white tracking-widest font-bold cursor-pointer"
                      title="Reset"
                    >
                      RESET
                    </button>
                  </div>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer">
                  <Map size={12} />
                  VER PLANTAS COMPLETAS (PDF)
                </button>
              </div>
            )}

            {activeSubTab === '3D' && (
              <div className="flex flex-col items-center justify-center h-full gap-3 animate-fade-in relative">
                <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-56 bg-slate-950 w-full max-w-[340px] flex items-center justify-center">
                  <img
                    src={assets.modelo3d}
                    alt="Modelo 3D Estrutural"
                    referrerPolicy="no-referrer"
                    className={`max-h-48 object-contain transition-transform duration-1000 ${is3DRotating ? 'rotate-360 duration-5000 ease-linear infinite' : ''}`}
                  />
                  {is3DRotating && (
                    <div className="absolute inset-0 bg-orange-500/5 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-orange-400 bg-slate-950/80 px-2 py-1 rounded border border-orange-500/30">
                        ROTAÇÃO ATIVA SKELETON-CAD
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIs3DRotating(!is3DRotating)}
                  className={`px-4 py-2 ${is3DRotating ? 'bg-orange-500' : 'bg-orange-600 hover:bg-orange-500'} text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer`}
                >
                  <RotateCw size={12} className={is3DRotating ? 'animate-spin' : ''} />
                  {is3DRotating ? 'PARAR ROTAÇÃO' : 'GIRAR MODELO 3D'}
                </button>
              </div>
            )}

            {activeSubTab === '4D' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* 4D Cronograma bars */}
                <div className="flex flex-col gap-2 bg-[#0b1329] p-3.5 rounded-lg border border-slate-800">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-800/60 pb-1.5">% Concluído por Etapa</h5>
                  <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                    {projectDetails.cronograma.map((c, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{c.etapa}</span>
                          <span className={`font-mono font-bold ${c.concluido === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>{c.concluido}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${c.color}`}
                            style={{ width: `${c.concluido}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Milestones & Delay indicator */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-[#0d1630] border border-slate-800/80 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Término Previsto</span>
                    <span className="text-xs font-bold text-slate-300 mt-1">{projectDetails.datas.terminoPrevisto}</span>
                  </div>
                  <div className="bg-[#0d1630] border border-slate-800/80 p-2.5 rounded-lg text-center flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Término Reprogramado</span>
                    <span className="text-xs font-bold text-amber-400 mt-1">{projectDetails.datas.terminoReprogramado}</span>
                  </div>
                  <div className={`border p-2.5 rounded-lg text-center flex flex-col justify-center ${projectDetails.datas.atrasoDias > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                    <span className="text-[9px] uppercase tracking-widest font-bold">Atraso</span>
                    <span className="text-xs font-extrabold mt-1 flex items-center justify-center gap-1">
                      {projectDetails.datas.atrasoDias > 0 ? (
                        <>
                          <AlertTriangle size={11} className="animate-bounce" />
                          {projectDetails.datas.atrasoDias} dias
                        </>
                      ) : (
                        <>
                          <CheckCircle size={11} />
                          No Prazo
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === '5D' && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="bg-[#0b1329] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                  {/* Table title bar */}
                  <div className="bg-[#101b38] px-4 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                    <span>Custo por Etapa (R$)</span>
                    <span className="font-mono text-emerald-400">INTEGRAÇÃO SIENGE</span>
                  </div>

                  {/* Scrollable small table */}
                  <div className="overflow-x-auto overflow-y-auto max-h-[220px]">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-[#0d152b] text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-4 sticky top-0 bg-[#0d152b]">Etapa</th>
                          <th className="py-2.5 px-3 sticky top-0 bg-[#0d152b] text-right">Previsto</th>
                          <th className="py-2.5 px-3 sticky top-0 bg-[#0d152b] text-right">Realizado</th>
                          <th className="py-2.5 px-3 sticky top-0 bg-[#0d152b] text-right">Desvio</th>
                          <th className="py-2.5 px-4 sticky top-0 bg-[#0d152b] text-right">% Desvio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {projectDetails.custosEtapa.map((row, idx) => {
                          const isTotal = false; // Totals are calculated dynamically
                          const isOver = row.desvio > 0;
                          const isZero = row.realizado === 0 && row.previsto > 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors text-slate-200">
                              <td className="py-2 px-4 font-semibold text-[11px]">{row.etapa}</td>
                              <td className="py-2 px-3 text-right font-mono text-[11px]">{formatCurrency(row.previsto)}</td>
                              <td className="py-2 px-3 text-right font-mono text-[11px]">{row.realizado === 0 ? '—' : formatCurrency(row.realizado)}</td>
                              <td className={`py-2 px-3 text-right font-mono text-[11px] font-bold ${row.desvio < 0 ? 'text-emerald-400' : row.desvio > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {row.desvio === 0 ? '0' : row.desvio < 0 ? `-${formatCurrency(Math.abs(row.desvio))}` : `+${formatCurrency(row.desvio)}`}
                              </td>
                              <td className={`py-2 px-4 text-right font-mono text-[11px] font-bold ${row.percentualDesvio < 0 ? 'text-emerald-400' : row.percentualDesvio > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {row.percentualDesvio === 0 ? '0,0%' : `${row.percentualDesvio.toFixed(1)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {/* Summary Total Row */}
                        <tr className="bg-[#101b38] border-t-2 border-slate-800 font-extrabold text-white text-[11px]">
                          <td className="py-2.5 px-4 uppercase tracking-wider">TOTAL</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrency(projectDetails.custosEtapa.reduce((sum, item) => sum + item.previsto, 0))}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrency(projectDetails.custosEtapa.reduce((sum, item) => sum + item.realizado, 0))}
                          </td>
                          {(() => {
                            const prevSum = projectDetails.custosEtapa.reduce((sum, item) => sum + item.previsto, 0);
                            const realSum = projectDetails.custosEtapa.reduce((sum, item) => sum + item.realizado, 0);
                            const totalDesvio = realSum - prevSum;
                            const percent = (totalDesvio / prevSum) * 100;
                            return (
                              <>
                                <td className={`py-2.5 px-3 text-right font-mono ${totalDesvio < 0 ? 'text-emerald-400' : totalDesvio > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                  {totalDesvio === 0 ? '0' : totalDesvio < 0 ? `-${formatCurrency(Math.abs(totalDesvio))}` : `+${formatCurrency(totalDesvio)}`}
                                </td>
                                <td className={`py-2.5 px-4 text-right font-mono ${percent < 0 ? 'text-emerald-400' : percent > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                  {percent.toFixed(1)}%
                                </td>
                              </>
                            );
                          })()}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
