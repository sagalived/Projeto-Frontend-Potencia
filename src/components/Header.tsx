import {
  LayoutDashboard,
  Building2,
  Box,
  TrendingUp,
  Truck,
  Users,
  ShoppingCart,
  Award,
  FileText,
  Briefcase,
  Calendar,
  Filter
} from 'lucide-react';
import { FilterState } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filters: FilterState;
}

export default function Header({ activeTab, setActiveTab, filters }: HeaderProps) {
  const tabs = [
    { id: 'visao_geral', label: 'VISÃO GERAL', icon: LayoutDashboard, color: 'hover:border-blue-500' },
    { id: 'obras', label: 'OBRAS', icon: Building2, color: 'hover:border-emerald-500' },
    { id: '5d_obra', label: '5D DA OBRA', icon: Box, color: 'hover:border-purple-500' },
    { id: 'financeiro', label: 'FINANCEIRO', icon: TrendingUp, color: 'hover:border-green-500' },
    { id: 'compras', label: 'COMPRAS', icon: ShoppingCart, color: 'hover:border-orange-500' },
    { id: 'suprimentos', label: 'SUPRIMENTOS', icon: Truck, color: 'hover:border-cyan-500' },
    { id: 'rh', label: 'RH', icon: Users, color: 'hover:border-pink-500' },
    { id: 'qualidade', label: 'QUALIDADE', icon: Award, color: 'hover:border-teal-500' },
    { id: 'relatorios', label: 'RELATÓRIOS', icon: FileText, color: 'hover:border-violet-500' }
  ];

  const getTabBadgeColor = (tabId: string) => {
    switch (tabId) {
      case 'visao_geral': return 'bg-blue-600/20 text-blue-400 border-blue-500/40';
      case 'obras': return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40';
      case '5d_obra': return 'bg-purple-600/20 text-purple-400 border-purple-500/40';
      case 'financeiro': return 'bg-green-600/20 text-green-400 border-green-500/40';
      case 'compras': return 'bg-orange-600/20 text-orange-400 border-orange-500/40';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <header className="bg-[#0b1329] border-b border-slate-800 text-white flex flex-col shrink-0 select-none">
      {/* Top Main Header Block */}
      <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title & Integration Subtitles */}
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            POWER BI - CENTRO DE INTELIGÊNCIA DO GRUPO POTENCIAL
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            <span>INTEGRAÇÃO: BITRIX (CRM)</span>
            <span className="text-orange-500">➔</span>
            <span>POWER BI</span>
            <span className="text-orange-500">➔</span>
            <span>SIENGE (ERP)</span>
          </div>
        </div>

        {/* Current State / Filters Indicators - Top Right */}
        <div className="flex items-center gap-4 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <Briefcase size={14} className="text-orange-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Obra Selecionada</span>
              <span className="text-xs font-semibold text-slate-200">{filters.obra}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-orange-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Período</span>
              <span className="text-xs font-semibold text-slate-200">{filters.periodo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Navigation Pill Bar */}
      <div className="px-6 py-1.5 bg-[#090f21] border-t border-slate-800/80 flex items-center overflow-x-auto scrollbar-none gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-wider rounded-md border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#152342] text-orange-400 border-orange-500 shadow-md shadow-orange-500/5'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon size={12} className={`${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
