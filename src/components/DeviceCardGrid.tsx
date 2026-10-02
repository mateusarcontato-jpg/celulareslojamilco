import React from 'react';
import { 
  Smartphone, 
  Shield, 
  FileText, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  Wrench, 
  History,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';

interface DeviceCardGridProps {
  devices: Device[];
  onViewDetails: (device: Device) => void;
  onEditDevice: (device: Device) => void;
  onOpenTerm: (device: Device) => void;
  onQuickTransfer: (device: Device) => void;
  onDeleteDevice: (device: Device) => void;
  onOpenAudit?: (device: Device) => void;
}

export const DeviceCardGrid: React.FC<DeviceCardGridProps> = ({
  devices,
  onViewDetails,
  onEditDevice,
  onOpenTerm,
  onQuickTransfer,
  onDeleteDevice,
  onOpenAudit,
}) => {
  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
        <p className="text-base font-bold text-zinc-800">Nenhum celular encontrado</p>
        <p className="text-xs text-zinc-500 mt-1">
          Ajuste os filtros ou adicione novos aparelhos.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'EM USO':
        return 'bg-zinc-950 text-white border-zinc-900';
      case 'DISPONÍVEL':
        return 'bg-zinc-100 text-zinc-900 border-zinc-300';
      case 'SEM PATRIMÔNIO':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'MANUTENÇÃO':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'PERDA / EXTRAVIO':
        return 'bg-red-600 text-white border-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => {
        const isSemPt = !device.hasAssetTag || device.assetNumber === 'SEM PT';

        return (
          <div
            key={device.id}
            className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Header card with store, asset tag and status */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3 mb-3">
                <div>
                  <span className="text-[11px] font-bold text-red-700 tracking-wide block">
                    {device.store}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {device.isPersonalDevice ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 rounded shadow-2xs">
                        <Smartphone className="w-3 h-3 text-purple-700" />
                        PESSOAL
                      </span>
                    ) : isSemPt ? (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 border border-red-300 rounded">
                        SEM PT
                      </span>
                    ) : (
                      <span className="font-mono-nums font-bold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-xs">
                        PT: {device.assetNumber}
                      </span>
                    )}

                    {device.hasVpn && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white">
                        <Shield className="w-2.5 h-2.5" />
                        VPN
                      </span>
                    )}
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[11px] font-bold border rounded ${
                  device.isPersonalDevice && (device.status === 'SEM PATRIMÔNIO' || device.status === 'PESSOAL')
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : getStatusColor(device.status)
                }`}>
                  {device.isPersonalDevice && (device.status === 'SEM PATRIMÔNIO' || device.status === 'PESSOAL')
                    ? 'CELULAR PESSOAL'
                    : device.status}
                </span>
              </div>

              {/* Main details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-zinc-500 block font-medium">Responsável</span>
                    <span className="text-sm font-bold text-zinc-950 leading-tight uppercase">
                      {device.employeeName}
                    </span>
                    {device.previousEmployeeName && (
                      <span className="text-[10px] text-zinc-500 block">
                        Trocou com: <strong>{device.previousEmployeeName}</strong>
                      </span>
                    )}
                    <span className="text-xs text-zinc-600 block mt-0.5 font-medium">
                      Setor: <strong className="text-red-700">{device.sector}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-zinc-500 block font-medium">Aparelho</span>
                    <span className="text-xs font-bold text-zinc-800">
                      {device.brand} - {device.model}
                    </span>
                    {device.imei1 && (
                      <span className="text-[10px] text-zinc-400 font-mono-nums block">
                        IMEI: {device.imei1}
                      </span>
                    )}
                  </div>
                </div>

                {device.phoneNumber && (
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-mono-nums font-semibold">{device.phoneNumber}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Aquisição: <strong className="text-zinc-800 font-mono-nums">{device.acquisitionDate}</strong></span>
                </div>

                {/* Status do Checkup de Auditoria */}
                {device.auditInfo?.status === 'OK' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Checkup: <strong>100% OK</strong> ({device.auditInfo.lastAuditedAt?.split(' às')[0]})</span>
                  </div>
                ) : device.auditInfo?.status === 'COM_PENDENCIA' ? (
                  <div className="flex items-start gap-1.5 text-xs text-red-900 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Checkup: Faltando {device.auditInfo.missingAccessories?.length} item(ns)</span>
                      <span className="block text-[10px] text-red-700">{device.auditInfo.missingAccessories?.join(', ')}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewDetails(device)}
                  className="text-red-600 hover:text-red-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha</span>
                </button>

                {onOpenAudit && (
                  <button
                    onClick={() => onOpenAudit(device)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                    title="Realizar Checkup de Auditoria"
                  >
                    <ClipboardCheck className="w-3 h-3 text-red-600" />
                    <span>Checkup</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenTerm(device)}
                  className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded cursor-pointer"
                  title="Termo de Responsabilidade"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onQuickTransfer(device)}
                  className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  title="Trocar Usuário"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEditDevice(device)}
                  className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded cursor-pointer"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteDevice(device)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
