import React from 'react';
import { Smartphone, CheckCircle, AlertTriangle, Wrench, ShieldCheck, HelpCircle, Building } from 'lucide-react';
import { Device } from '../types/device';

interface StatsCardsProps {
  devices: Device[];
  selectedStatus: string;
  onFilterStatus: (status: string) => void;
  vpnOnly: boolean;
  onToggleVpnOnly: () => void;
  semPtOnly: boolean;
  onToggleSemPtOnly: () => void;
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
  onFilterStore,
}) => {
  const total = devices.length;
  const acarauCount = devices.filter((d) => d.store === 'LOJA ACARAÚ').length;
  const preaCount = devices.filter((d) => d.store === 'LOJA PRÉA').length;
  const inUse = devices.filter((d) => d.status === 'EM USO').length;
  const maintenance = devices.filter((d) => d.status === 'MANUTENÇÃO').length;
  const semPt = devices.filter((d) => !d.hasAssetTag || d.assetNumber === 'SEM PT' || d.status === 'SEM PATRIMÔNIO').length;
  const vpnCount = devices.filter((d) => d.hasVpn).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 no-print">
      {/* Total Geral */}
      <button
        type="button"
        onClick={() => {
          onFilterStatus('ALL');
        }}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          selectedStatus === 'ALL' && !vpnOnly && !semPtOnly
            ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm ring-2 ring-red-600/30'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wide ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly ? 'text-zinc-300' : 'text-zinc-500'}`}>
            Total Geral
          </span>
          <Smartphone className={`w-4 h-4 ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly ? 'text-red-500' : 'text-zinc-400'}`} />
        </div>
        <p className="text-2xl font-bold font-mono-nums mt-1 tracking-tight text-red-600">
          {total}
        </p>
        <p className={`text-[11px] mt-0.5 ${selectedStatus === 'ALL' && !vpnOnly && !semPtOnly ? 'text-zinc-300' : 'text-zinc-500'}`}>
          Aparelhos ativos
        </p>
      </button>

      {/* Loja Acaraú (24 aparelhos) */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA ACARAÚ')}
        className="p-3.5 rounded-xl border bg-white border-zinc-200 text-zinc-900 hover:border-red-400 text-left transition-all cursor-pointer hover:shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-zinc-600">Loja Acaraú</span>
          <Building className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {acarauCount}
        </p>
        <p className="text-[11px] text-red-600 font-semibold mt-0.5">
          Ver grupo Acaraú
        </p>
      </button>

      {/* Loja Préa (11 aparelhos) */}
      <button
        type="button"
        onClick={() => onFilterStore('LOJA PRÉA')}
        className="p-3.5 rounded-xl border bg-white border-zinc-200 text-zinc-900 hover:border-red-400 text-left transition-all cursor-pointer hover:shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-zinc-600">Loja Préa</span>
          <Building className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {preaCount}
        </p>
        <p className="text-[11px] text-red-600 font-semibold mt-0.5">
          Ver grupo Préa
        </p>
      </button>

      {/* Sem Tombamento (SEM PT) */}
      <button
        type="button"
        onClick={onToggleSemPtOnly}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          semPtOnly
            ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950'
            : semPt > 0
            ? 'bg-white border-red-200 hover:border-red-400'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-red-700">Sem Tombamento</span>
          <HelpCircle className="w-4 h-4 text-red-600" />
        </div>
        <p className="text-2xl font-bold font-mono-nums text-red-600 mt-1 tracking-tight">
          {semPt}
        </p>
        <p className="text-[11px] text-zinc-600 font-medium mt-0.5">Pendente etiquetar</p>
      </button>

      {/* Em Manutenção */}
      <button
        type="button"
        onClick={() => onFilterStatus('MANUTENÇÃO')}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          selectedStatus === 'MANUTENÇÃO'
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-zinc-600">Manutenção</span>
          <Wrench className="w-4 h-4 text-zinc-500" />
        </div>
        <p className="text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {maintenance}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Em assistência</p>
      </button>

      {/* Com VPN */}
      <button
        type="button"
        onClick={onToggleVpnOnly}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          vpnOnly
            ? 'bg-red-50 border-red-600 ring-2 ring-red-500/20 text-red-950'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-zinc-600">Com VPN</span>
          <ShieldCheck className="w-4 h-4 text-red-600" />
        </div>
        <p className="text-2xl font-bold font-mono-nums text-zinc-900 mt-1 tracking-tight">
          {vpnCount}
        </p>
        <p className="text-[11px] text-zinc-600 font-medium mt-0.5">Acesso remoto ERP</p>
      </button>
    </div>
  );
};
