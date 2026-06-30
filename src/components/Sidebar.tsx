import React from 'react';
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
  RotateCcw,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { FilterState } from '../types';
import {
  LISTA_OBRAS,
  LISTA_PERIODOS,
  LISTA_CLIENTES,
  LISTA_RESPONSAVEIS
} from '../data';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  filters,
  setFilters
}: SidebarProps) {
  // Navigation Menu Items with their respective IDs and Icons
  const menuItems = [
    { id: 'visao_geral', label: 'VISÃO GERAL', icon: LayoutDashboard },
    { id: 'obras', label: 'OBRAS', icon: Building2 },
    { id: '5d_obra', label: '5D DA OBRA', icon: Box },
    { id: 'financeiro', label: 'FINANCEIRO', icon: TrendingUp },
    { id: 'suprimentos', label: 'SUPRIMENTOS', icon: Truck },
    { id: 'rh', label: 'RH', icon: Users },
    { id: 'compras', label: 'COMPRAS', icon: ShoppingCart },
    { id: 'qualidade', label: 'QUALIDADE', icon: Award },
    { id: 'relatorios', label: 'RELATÓRIOS', icon: FileText }
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };

      // Logical cascading: if a specific project is selected, auto-select its client and manager
      if (key === 'obra') {
        if (value === 'Escola Municipal Dinâmica') {
          updated.cliente = 'Prefeitura Municipal';
          updated.responsavel = 'Eng. João Silva';
        } else if (value === 'Edifício Residencial Sol') {
          updated.cliente = 'Sol Empreendimentos';
          updated.responsavel = 'Eng. Maria Santos';
        } else if (value === 'Galpão Logístico Sul') {
          updated.cliente = 'LogiLog Transportes';
          updated.responsavel = 'Eng. Ricardo Dias';
        } else {
          updated.cliente = 'Todos';
          updated.responsavel = 'Todos';
        }
      }

      return updated;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      obra: 'Todas',
      periodo: 'Este Mês',
      cliente: 'Todos',
      responsavel: 'Todos'
    });
  };

  return (
    <aside className="w-64 bg-[#0a1120] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-full overflow-y-auto select-none">
      {/* Brand Logo & Area */}
      <div className="p-4 border-b border-slate-800 flex flex-col gap-1 items-start justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20">
            GP
          </div>
          <div>
            <span className="font-bold tracking-wider text-white text-base">GRUPO</span>
            <span className="font-bold tracking-wider text-orange-500 text-base ml-1">POTENCIAL</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">BI & INTEL CORP</p>
      </div>

      {/* Navegação Section */}
      <div className="p-4">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Navegação</p>
        <nav className="flex flex-col gap-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 text-orange-400 bg-orange-500/5'
                    : 'hover:bg-slate-800/40 hover:text-white border-l-4 border-transparent text-slate-400'
                }`}
              >
                <Icon size={16} className={`${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filtros Section */}
      <div className="p-4 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={12} className="text-orange-500" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Filtros</p>
          </div>
          <button
            onClick={handleClearFilters}
            title="Limpar Filtros"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-orange-400 transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Obra Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500">Obra</label>
            <div className="relative">
              <select
                value={filters.obra}
                onChange={e => handleFilterChange('obra', e.target.value)}
                className="w-full bg-[#111c30] text-slate-200 border border-slate-800 rounded-lg py-1.5 px-2.5 pr-8 text-xs font-medium focus:outline-none focus:border-orange-500/60 appearance-none cursor-pointer"
              >
                {LISTA_OBRAS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Periodo Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500">Período</label>
            <div className="relative">
              <select
                value={filters.periodo}
                onChange={e => handleFilterChange('periodo', e.target.value)}
                className="w-full bg-[#111c30] text-slate-200 border border-slate-800 rounded-lg py-1.5 px-2.5 pr-8 text-xs font-medium focus:outline-none focus:border-orange-500/60 appearance-none cursor-pointer"
              >
                {LISTA_PERIODOS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Cliente Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500">Cliente</label>
            <div className="relative">
              <select
                value={filters.cliente}
                onChange={e => handleFilterChange('cliente', e.target.value)}
                className="w-full bg-[#111c30] text-slate-200 border border-slate-800 rounded-lg py-1.5 px-2.5 pr-8 text-xs font-medium focus:outline-none focus:border-orange-500/60 appearance-none cursor-pointer"
              >
                {LISTA_CLIENTES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Responsavel Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500">Responsável</label>
            <div className="relative">
              <select
                value={filters.responsavel}
                onChange={e => handleFilterChange('responsavel', e.target.value)}
                className="w-full bg-[#111c30] text-slate-200 border border-slate-800 rounded-lg py-1.5 px-2.5 pr-8 text-xs font-medium focus:outline-none focus:border-orange-500/60 appearance-none cursor-pointer"
              >
                {LISTA_RESPONSAVEIS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear Filters Button explicitly on bottom */}
        <button
          onClick={handleClearFilters}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold tracking-wider transition-all border border-slate-700/50 cursor-pointer"
        >
          <RotateCcw size={12} />
          Limpar Filtros
        </button>
      </div>

      {/* Footer Info Area */}
      <div className="p-4 border-t border-slate-800 bg-[#070c18] flex flex-col gap-1 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <RefreshCw size={10} className="text-emerald-500 animate-spin-slow" />
          <span className="font-semibold tracking-wider text-slate-400">ÚLTIMA ATUALIZAÇÃO</span>
        </div>
        <p className="font-mono text-[11px] text-slate-300 pl-3.5">20/05/2025 08:30</p>
      </div>
    </aside>
  );
}
