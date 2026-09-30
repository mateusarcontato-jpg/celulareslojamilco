import React from 'react';
import { 
  Smartphone, 
  Plus, 
  Download, 
  FileText, 
  Building2, 
  LogIn, 
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { TechnicianUser } from '../types/auth';

interface NavbarProps {
  currentStore: string;
  stores: string[];
  onSelectStore: (store: string) => void;
  onOpenNewDeviceModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenPdfReportModal: () => void;
  totalDevicesCount: number;
  isFirebaseConnected?: boolean;
  currentTechnician: TechnicianUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStore,
  stores,
  onSelectStore,
  onOpenNewDeviceModal,
  onOpenImportExportModal,
  onOpenPdfReportModal,
  totalDevicesCount,
  isFirebaseConnected = true,
  currentTechnician,
  onOpenLoginModal,
  onLogout,
}) => {
  return (
    <header className="bg-zinc-950 text-white border-b-2 border-red-600 sticky top-0 z-30 no-print shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Ícone do Celular & Título Amilco Home Center */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm font-bold shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  AMILCO HOME CENTER
                </h1>
                <span className="text-[11px] bg-red-600 text-white font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  PATRIMÔNIO
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-400 font-medium hidden sm:block">
                  Controle de Celulares e Termos de Responsabilidade
                </p>
                {/* Status discreto e disfarçado da Nuvem */}
                <span 
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 select-none pl-1"
                  title={isFirebaseConnected ? 'Conexão em tempo real ativa' : 'Modo local'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-500/70' : 'bg-zinc-600'}`}></span>
                  <span className="text-zinc-500 font-normal">Sincronizado</span>
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2 & 3: Store Selector and Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Store dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Building2 className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-zinc-400 hidden sm:inline">Loja:</span>
              <select
                value={currentStore}
                onChange={(e) => onSelectStore(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="TODAS" className="bg-zinc-900 text-white">Todas as Lojas</option>
                {stores.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Relatório PDF */}
            <button
              onClick={onOpenPdfReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              title="Filtrar e exportar relatório oficial em PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Relatório PDF</span>
            </button>

            {/* Excel / Backup */}
            <button
              onClick={onOpenImportExportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap hidden md:inline-flex shadow-xs cursor-pointer"
              title="Importar ou exportar planilha Excel"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Planilha</span>
            </button>

            {/* Sessão do Técnico / Autenticação */}
            {currentTechnician ? (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 py-1 px-2.5 rounded-lg">
                {currentTechnician.avatarUrl ? (
                  <img 
                    src={currentTechnician.avatarUrl} 
                    alt={currentTechnician.name} 
                    className="w-6 h-6 rounded-full border border-red-500/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {currentTechnician.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">
                    {currentTechnician.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {currentTechnician.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-red-600 rounded-md transition-colors ml-1 cursor-pointer border border-zinc-700/60 shadow-xs"
                  title="Encerrar sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500 rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Acessar com login e senha"
              >
                <LogIn className="w-3.5 h-3.5 text-red-500" />
                <span>Entrar</span>
              </button>
            )}

            {/* Novo Celular Button in Amilco Red */}
            <button
              onClick={onOpenNewDeviceModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Celular</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
