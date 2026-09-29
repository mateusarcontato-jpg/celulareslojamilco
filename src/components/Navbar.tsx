import React from 'react';
import { 
  Smartphone, 
  Plus, 
  Download, 
  FileText, 
  Building2, 
  Cloud, 
  CloudCheck, 
  LogIn, 
  LogOut,
  User as UserIcon 
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentStore: string;
  stores: string[];
  onSelectStore: (store: string) => void;
  onOpenNewDeviceModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenPdfReportModal: () => void;
  totalDevicesCount: number;
  isFirebaseConnected?: boolean;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
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
  currentUser = null,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="bg-zinc-950 text-white border-b-2 border-red-600 sticky top-0 z-30 no-print shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark - Amilco Home Center */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  AMILCO HOME CENTER
                </h1>
                <span className="text-[11px] bg-red-600 text-white font-bold px-2 py-0.5 rounded tracking-wide">
                  PATRIMÔNIO
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-400 font-medium hidden sm:block">
                  Controle de Celulares e Termos de Responsabilidade
                </p>
                {/* Status da Nuvem Firebase */}
                <span 
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    isFirebaseConnected 
                      ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800' 
                      : 'bg-amber-950/70 text-amber-400 border-amber-800'
                  }`}
                  title={isFirebaseConnected ? 'Sincronização em tempo real via Firebase Firestore ativa' : 'Operando offline'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{isFirebaseConnected ? 'Firebase Nuvem' : 'Local'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2 & 3: Store Selector and Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* Auth Google */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 py-1 px-2 rounded-lg">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Usuário'} 
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-xs font-semibold text-zinc-200 hidden lg:inline max-w-[100px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'Usuário'}
                </span>
                <button
                  onClick={onLogout}
                  className="text-zinc-400 hover:text-red-400 p-0.5 ml-0.5"
                  title="Sair da conta Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : onLogin ? (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Entrar com conta Google"
              >
                <LogIn className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            ) : null}

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
