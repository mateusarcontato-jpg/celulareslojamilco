import React from 'react';
import { Smartphone, Wrench, ShieldCheck, HelpCircle, Building } from 'lucide-react';
import { Device } from '../types/device';

interface StatsCardsProps {
  devices: Device[];
  selectedStatus: string;
  onFilterStatus: (status: string) => void;
  vpnOnly: boolean;
  onToggleVpnOnly: () => void;
  semPtOnly: boolean;
  onToggleSemPtOnly: () => void;
  personalOnly: boolean;
  onTogglePersonalOnly: () => void;
  onFilterStore: (store: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  devices,
  selectedStatus,
  onFilterStatus,
  vpnOnly,
  onToggleVpnOnly,
  semPtOnly,
  onToggleSemPtOnly,
  personalOnly,
  onTogglePersonalOnly,
  onFilterStore,
}) => {
  const total = devices.length;
  const acarauCount = devices.filter((d) => d.store === 'LOJA ACARAÚ').length;
  const preaCount = devices.filter((d) => d.store === 'LOJA PRÉA').length;
  const maintenance = devices.filter((d) => d.status === 'MANUTENÇÃO').length;
  const semPt = devices.filter((d) => !d.hasAssetTag || d.assetNumber === 'SEM PT' || d.status === 'SEM PATRIMÔNIO').length;
  const vpnCount = devices.filter((d) => d.hasVpn).length;
  const personalCount = devices.filter((d) => Boolean(d.isPersonalDevice)).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 mb-6 no-print">
      {/* 1. Total Geral */}
      <button
        type="button"
        onClick={() => {
          onFilterStatus('ALL');
        }}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
          selectedStatus === 'ALL' && !vpnOnly && !semPtOnly && !personalOnly
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm ring-2 ring-red-600/30'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly && !personalOnly ? 'text-zinc-300' : 'text-zinc-500'}`}>
            Total Geral
          </span>
          <Smartphone className={`w-3.5 h-3.5 ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly && !personalOnly ? 'text-red-500' : 'text-zinc-400'}`} />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums mt-1 tracking-tight text-red-600">
          {total}
        </p>
        <p className={`text-[10px] mt-0.5 ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly && !personalOnly ? 'text-zinc-300' : 'text-zinc-500'}`}>
          Aparelhos
        </p>
      </button>

      {/* 2. Loja Acaraú */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA ACARAÚ')}
        className="p-3 rounded-xl border bg-white border-zinc-200 text-zinc-900 hover:border-red-400 text-left transition-all cursor-pointer hover:shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-600">Loja Acaraú</span>
          <Building className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {acarauCount}
        </p>
        <p className="text-[10px] text-red-600 font-semibold mt-0.5">
          Filtrar Acaraú
        </p>
      </button>

      {/* 3. Loja Préa */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA PRÉA')}
        className="p-3 rounded-xl border bg-white border-zinc-200 text-zinc-900 hover:border-red-400 text-left transition-all cursor-pointer hover:shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-600">Loja Préa</span>
          <Building className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {preaCount}
        </p>
        <p className="text-[10px] text-red-600 font-semibold mt-0.5">
          Filtrar Préa
        </p>
      </button>

      {/* 4. Celulares Pessoais (Novo Card solicitado pelo usuário) */}
      <button
        type="button"
        onClick={onTogglePersonalOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
          personalOnly
            ? 'bg-purple-900 border-purple-900 text-white shadow-sm ring-2 ring-purple-500/30'
            : personalCount > 0
            ? 'bg-purple-50/70 border-purple-200 text-purple-950 hover:border-purple-300'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${personalOnly ? 'text-purple-200' : 'text-purple-900'}`}>
            Celular Pessoal
          </span>
          <Smartphone className={`w-3.5 h-3.5 ${personalOnly ? 'text-purple-300' : 'text-purple-700'}`} />
        </div>
        <p className={`text-xl sm:text-2xl font-bold font-mono-nums mt-1 tracking-tight ${personalOnly ? 'text-white' : 'text-purple-700'}`}>
          {personalCount}
        </p>
        <p className={`text-[10px] mt-0.5 font-medium ${personalOnly ? 'text-purple-200' : 'text-purple-800'}`}>
          {personalCount === 1 ? '1 usuário' : `${personalCount} usuários`}
        </p>
      </button>

      {/* 5. Sem Tombamento (SEM PT) */}
      <button
        type="button"
        onClick={onToggleSemPtOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
          semPtOnly
            ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950'
            : semPt > 0
            ? 'bg-white border-red-200 hover:border-red-400'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-red-700">Sem PT</span>
          <HelpCircle className="w-3.5 h-3.5 text-red-600" />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums text-red-600 mt-1 tracking-tight">
          {semPt}
        </p>
        <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Sem tombamento</p>
      </button>

      {/* 6. Em Manutenção */}
      <button
        type="button"
        onClick={() => onFilterStatus('MANUTENÇÃO')}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
          selectedStatus === 'MANUTENÇÃO'
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-600">Manutenção</span>
          <Wrench className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {maintenance}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">Em assistência</p>
      </button>

      {/* 7. Com VPN */}
      <button
        type="button"
        onClick={onToggleVpnOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
          vpnOnly
            ? 'bg-red-50 border-red-600 ring-2 ring-red-500/20 text-red-950'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-600">Com VPN</span>
          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {vpnCount}
        </p>
        <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Acesso ERP</p>
      </button>
    </div>
  );
};
