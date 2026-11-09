import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Plus,
  Download,
  FileText,
  Building2,
  LogIn,
  LogOut,
  FolderCheck,
  Upload,
} from 'lucide-react';
import { TechnicianUser } from '../types/auth';

interface NavbarProps {
  currentStore: string;
  stores: string[];
  onSelectStore: (store: string) => void;
  onOpenNewDeviceModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenPdfReportModal: () => void;
  onOpenSignedDirectoryModal?: () => void;
  signedTermsCount?: number;
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
  onOpenSignedDirectoryModal,
  signedTermsCount = 0,
  isFirebaseConnected = true,
  currentTechnician,
  onOpenLoginModal,
  onLogout,
}) => {
  const [customLogo, setCustomLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('amilco_store_logo_v1') || '';
    } catch {
      return '';
    }
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCustomLogo(result);
        try {
          localStorage.setItem('amilco_store_logo_v1', result);
        } catch (err) {
          console.error('Erro ao salvar logotipo da loja:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="bg-zinc-950 text-white border-b border-zinc-800 sticky top-0 z-30 no-print">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Espaço para Logotipo da Loja (Maior e estendido para os lados) */}
          <div className="flex items-center gap-3 min-w-0">
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <div
              onClick={() => logoInputRef.current?.click()}
              className="h-14 min-w-[180px] sm:min-w-[220px] max-w-[320px] flex items-center justify-start shrink-0 cursor-pointer overflow-hidden transition-all group relative py-1"
              title="Clique para definir ou alterar o logotipo da loja"
            >
              {customLogo ? (
                <img src={customLogo} alt="Logotipo da Loja" className="w-full h-full object-contain object-left max-h-13" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-white bg-zinc-900 px-3.5 py-2.5 rounded-xl border border-zinc-800">
                  <Upload className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="truncate">Definir Logotipo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-white tracking-wide rounded">
                Alterar Logotipo
              </div>
            </div>

            {/* Status da Nuvem discreto */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400 select-none pl-3 border-l border-zinc-800">
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirebaseConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              />
              <span className="font-medium">{isFirebaseConnected ? 'Nuvem Ativa' : 'Modo Local'}</span>
            </div>
          </div>

          {/* Seletor de Unidade e Sessão do Técnico */}
          <div className="flex items-center gap-2">
            {/* Seletor de Loja */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-zinc-400 hidden sm:inline">Unidade:</span>
              <select
                aria-label="Selecionar unidade ou loja"
                value={currentStore}
                onChange={(e) => onSelectStore(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="TODAS" className="bg-zinc-900 text-white">
                  Todas as Lojas
                </option>
                {stores.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Diretório de Termos Anexados (Fotos / Escaneados) */}
            {onOpenSignedDirectoryModal && (
              <button
                type="button"
                onClick={onOpenSignedDirectoryModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-300 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                title="Abrir Diretório para anexar fotos ou documentos escaneados dos termos assinados"
              >
                <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Diretório de Termos</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  {signedTermsCount}
                </span>
              </button>
            )}

            {/* Planilha / Backup */}
            <button
              type="button"
              onClick={onOpenImportExportModal}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Importar ou exportar base Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Base / Backup</span>
            </button>

            {/* Relatório PDF */}
            <button
              type="button"
              onClick={onOpenPdfReportModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Central de Relatórios PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Relatórios</span>
            </button>

            {/* Novo Celular */}
            <button
              type="button"
              onClick={onOpenNewDeviceModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Novo Celular</span>
            </button>

            <div className="h-5 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Sessão do Técnico */}
            {currentTechnician ? (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 py-1 px-2 rounded-lg">
                {currentTechnician.avatarUrl ? (
                  <img
                    src={currentTechnician.avatarUrl}
                    alt={currentTechnician.name}
                    className="w-5 h-5 rounded-full border border-red-500/50"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentTechnician.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-200 max-w-[100px] truncate hidden lg:inline">
                  {currentTechnician.name}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer"
                  title="Encerrar sessão"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-red-500" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
