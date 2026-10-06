import React from 'react';
import { Smartphone, Wrench, ShieldCheck, HelpCircle, Building } from 'lucide-react';
import { Device } from '../types/device';

interface StatsCardsProps {
  devices: Device[];
  currentStore?: string;
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
  currentStore = 'TODAS',
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
  const semPt = devices.filter(
    (d) => !d.hasAssetTag || d.assetNumber === 'SEM PT' || d.status === 'SEM PATRIMÔNIO'
  ).length;
  const vpnCount = devices.filter((d) => d.hasVpn).length;
  const personalCount = devices.filter((d) => Boolean(d.isPersonalDevice)).length;

  const isAllActive =
    currentStore === 'TODAS' &&
    selectedStatus === 'ALL' &&
    !vpnOnly &&
    !semPtOnly &&
    !personalOnly;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-5 no-print">
      {/* 1. Total Geral */}
      <button
        type="button"
        onClick={() => {
          if (currentStore !== 'TODAS') onFilterStore(currentStore);
          onFilterStatus('ALL');
        }}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          isAllActive
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              isAllActive ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            Total Geral
          </span>
          <Smartphone
            className={`w-3.5 h-3.5 shrink-0 ${
              isAllActive ? 'text-red-500' : 'text-zinc-400'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold font-mono-nums tracking-tight ${
              isAllActive ? 'text-white' : 'text-zinc-950'
            }`}
          >
            {total}
          </span>
          <span
            className={`text-[10px] ${
              isAllActive ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            aparelhos
          </span>
        </div>
      </button>

      {/* 2. Loja Acaraú */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA ACARAÚ')}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          currentStore === 'LOJA ACARAÚ'
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              currentStore === 'LOJA ACARAÚ' ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            Loja Acaraú
          </span>
          <Building
            className={`w-3.5 h-3.5 shrink-0 ${
              currentStore === 'LOJA ACARAÚ' ? 'text-red-500' : 'text-zinc-400'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono-nums tracking-tight">
            {acarauCount}
          </span>
          <span
            className={`text-[10px] font-medium ${
              currentStore === 'LOJA ACARAÚ' ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            {currentStore === 'LOJA ACARAÚ' ? 'Ativo' : 'Filtrar'}
          </span>
        </div>
      </button>

      {/* 3. Loja Préa */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA PRÉA')}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          currentStore === 'LOJA PRÉA'
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              currentStore === 'LOJA PRÉA' ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            Loja Préa
          </span>
          <Building
            className={`w-3.5 h-3.5 shrink-0 ${
              currentStore === 'LOJA PRÉA' ? 'text-red-500' : 'text-zinc-400'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono-nums tracking-tight">
            {preaCount}
          </span>
          <span
            className={`text-[10px] font-medium ${
              currentStore === 'LOJA PRÉA' ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            {currentStore === 'LOJA PRÉA' ? 'Ativo' : 'Filtrar'}
          </span>
        </div>
      </button>

      {/* 4. Celulares Pessoais */}
      <button
        type="button"
        onClick={onTogglePersonalOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          personalOnly
            ? 'bg-purple-900 border-purple-900 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-purple-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              personalOnly ? 'text-purple-200' : 'text-zinc-500'
            }`}
          >
            Pessoal
          </span>
          <Smartphone
            className={`w-3.5 h-3.5 shrink-0 ${
              personalOnly ? 'text-purple-300' : 'text-purple-600'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold font-mono-nums tracking-tight ${
              personalOnly ? 'text-white' : 'text-purple-700'
            }`}
          >
            {personalCount}
          </span>
          <span
            className={`text-[10px] ${
              personalOnly ? 'text-purple-200' : 'text-zinc-500'
            }`}
          >
            {personalCount === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>
      </button>

      {/* 5. Sem Tombamento (SEM PT) */}
      <button
        type="button"
        onClick={onToggleSemPtOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          semPtOnly
            ? 'bg-red-600 border-red-600 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-red-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              semPtOnly ? 'text-red-100' : 'text-zinc-500'
            }`}
          >
            Sem PT
          </span>
          <HelpCircle
            className={`w-3.5 h-3.5 shrink-0 ${
              semPtOnly ? 'text-white' : 'text-red-600'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold font-mono-nums tracking-tight ${
              semPtOnly ? 'text-white' : 'text-red-600'
            }`}
          >
            {semPt}
          </span>
          <span
            className={`text-[10px] ${
              semPtOnly ? 'text-red-100' : 'text-zinc-500'
            }`}
          >
            pendentes
          </span>
        </div>
      </button>

      {/* 6. Em Manutenção */}
      <button
        type="button"
        onClick={() => onFilterStatus('MANUTENÇÃO')}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          selectedStatus === 'MANUTENÇÃO'
            ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              selectedStatus === 'MANUTENÇÃO' ? 'text-amber-100' : 'text-zinc-500'
            }`}
          >
            Manutenção
          </span>
          <Wrench
            className={`w-3.5 h-3.5 shrink-0 ${
              selectedStatus === 'MANUTENÇÃO' ? 'text-white' : 'text-amber-600'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono-nums tracking-tight">
            {maintenance}
          </span>
          <span
            className={`text-[10px] ${
              selectedStatus === 'MANUTENÇÃO' ? 'text-amber-100' : 'text-zinc-500'
            }`}
          >
            assistência
          </span>
        </div>
      </button>

      {/* 7. Com VPN */}
      <button
        type="button"
        onClick={onToggleVpnOnly}
        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
          vpnOnly
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
            : 'bg-white border-zinc-200/90 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider truncate ${
              vpnOnly ? 'text-zinc-300' : 'text-zinc-500'
            }`}
          >
            Com VPN
          </span>
          <ShieldCheck
            className={`w-3.5 h-3.5 shrink-0 ${
              vpnOnly ? 'text-red-500' : 'text-red-600'
            }`}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono-nums tracking-tight">
            {vpnCount}
          </span>
          <span
            className={`text-[10px] ${
              vpnOnly ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            acesso ERP
          </span>
        </div>
      </button>
    </div>
  );
};
