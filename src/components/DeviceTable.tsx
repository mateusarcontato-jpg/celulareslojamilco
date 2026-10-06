import React, { useState } from 'react';
import { 
  FileText, 
  Edit3, 
  Trash2, 
  ArrowRightLeft, 
  Eye, 
  Shield, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wrench,
  History,
  Layers,
  List,
  Smartphone,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';

interface DeviceTableProps {
  devices: Device[];
  onViewDetails: (device: Device) => void;
  onOpenHistory: (device: Device) => void;
  onOpenAddOccurrence: (device: Device) => void;
  onEditDevice: (device: Device) => void;
  onOpenTerm: (device: Device) => void;
  onQuickTransfer: (device: Device) => void;
  onDeleteDevice: (device: Device) => void;
  onOpenAudit: (device: Device) => void;
  isGroupedBySector: boolean;
  onToggleGrouped: () => void;
  showAuditColumn?: boolean;
}

type SortField = 'assetNumber' | 'employeeName' | 'model' | 'sector' | 'acquisitionDate' | 'status' | 'store';

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onViewDetails,
  onOpenHistory,
  onOpenAddOccurrence,
  onEditDevice,
  onOpenTerm,
  onQuickTransfer,
  onDeleteDevice,
  onOpenAudit,
  isGroupedBySector,
  onToggleGrouped,
  showAuditColumn = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('assetNumber');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: DeviceStatus, isPersonal?: boolean) => {
    if (isPersonal && (status === 'SEM PATRIMÔNIO' || status === 'PESSOAL')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
          <Smartphone className="w-3 h-3 text-purple-700" />
          CELULAR PESSOAL
        </span>
      );
    }
    switch (status) {
      case 'PESSOAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Smartphone className="w-3 h-3 text-purple-700" />
            CELULAR PESSOAL
          </span>
        );
      case 'EM USO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-900 text-white border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            EM USO
          </span>
        );
      case 'DISPONÍVEL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-900 border border-zinc-300">
            DISPONÍVEL
          </span>
        );
      case 'SEM PATRIMÔNIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            SEM PATRIMÔNIO
          </span>
        );
      case 'MANUTENÇÃO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Wrench className="w-3 h-3 text-amber-700" />
            MANUTENÇÃO
          </span>
        );
      case 'PERDA / EXTRAVIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white border border-red-700">
            PERDA / EXTRAVIO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  const renderTableRows = (deviceList: Device[]) => {
    const sorted = [...deviceList].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'assetNumber':
          valA = a.hasAssetTag ? a.assetNumber : 'ZZZZ';
          valB = b.hasAssetTag ? b.assetNumber : 'ZZZZ';
          break;
        case 'employeeName':
          valA = a.employeeName.toLowerCase();
          valB = b.employeeName.toLowerCase();
          break;
        case 'model':
          valA = a.model.toLowerCase();
          valB = b.model.toLowerCase();
          break;
        case 'sector':
          valA = a.sector.toLowerCase();
          valB = b.sector.toLowerCase();
          break;
        case 'acquisitionDate':
          valA = a.acquisitionDate;
          valB = b.acquisitionDate;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'store':
          valA = a.store;
          valB = b.store;
          break;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return sorted.map((device, idx) => {
      const isSemPt = !device.hasAssetTag || device.assetNumber === 'SEM PT';
      const isEven = idx % 2 === 0;

      return (
        <tr 
          key={device.id} 
          className={`hover:bg-red-50/40 transition-colors group ${
            isSemPt ? 'bg-red-50/20' : isEven ? 'bg-white' : 'bg-zinc-50/50'
          }`}
        >
          {/* Loja */}
          <td className="py-2.5 px-2.5 whitespace-nowrap text-zinc-700 font-bold text-[11px]">
            {device.store.replace('LOJA ', '')}
          </td>

          {/* N° Patrimônio */}
          <td className="py-2.5 px-2 whitespace-nowrap">
            {device.isPersonalDevice ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                <Smartphone className="w-3 h-3 text-purple-700" />
                PESSOAL
              </span>
            ) : isSemPt ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                <AlertCircle className="w-3 h-3 text-red-600" />
                SEM PT
              </span>
            ) : (
              <span className="font-mono-nums font-bold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-xs">
                {device.assetNumber}
              </span>
            )}
          </td>

          {/* Nome do Colaborador (e indicação se trocou de usuário recentemente) */}
          <td className="py-2.5 px-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-950 text-xs uppercase">
                {device.employeeName}
              </span>
              {device.hasVpn && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white">
                  vpn
                </span>
              )}
            </div>
            {device.previousEmployeeName && (
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Trocou com: <strong>{device.previousEmployeeName}</strong>
              </span>
            )}
            {device.phoneNumber && (
              <span className="text-[11px] text-zinc-500 font-mono-nums block mt-0.5">
                {device.phoneNumber}
              </span>
            )}
          </td>

          {/* Marca */}
          <td className="py-2.5 px-2 whitespace-nowrap text-zinc-700 text-xs uppercase font-medium">
            {device.brand}
          </td>

          {/* Modelo */}
          <td className="py-2.5 px-2.5 whitespace-nowrap">
            <span className="text-zinc-900 font-bold text-xs">
              {device.model}
            </span>
            {device.imei1 && (
              <span className="text-[10px] text-zinc-400 block font-mono-nums">
                IMEI: {device.imei1}
              </span>
            )}
          </td>

          {/* Setor */}
          <td className="py-2.5 px-2 whitespace-nowrap">
            <span className="text-xs text-zinc-800 font-semibold uppercase">
              {device.sector}
            </span>
          </td>

          {/* Data Aquisição */}
          <td className="py-2.5 px-2 whitespace-nowrap font-mono-nums text-zinc-600 text-xs">
            {device.acquisitionDate === '?' ? (
              <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[11px] border border-red-200">
                ? (Pendente)
              </span>
            ) : (
              device.acquisitionDate
            )}
          </td>

          {/* Status */}
          <td className="py-2.5 px-2 whitespace-nowrap">
            {getStatusBadge(device.status, device.isPersonalDevice)}
          </td>

          {/* Auditoria / Checkup de Itens (Exibido apenas na lacuna de Auditoria) */}
          {showAuditColumn && (
          <td className="py-2.5 px-2 whitespace-nowrap">
            {device.auditInfo?.status === 'OK' ? (
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 w-fit">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  CHECKUP OK
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5 font-medium">
                  {device.auditInfo.lastAuditedAt ? device.auditInfo.lastAuditedAt.split(' às')[0] : 'Conferido'}
                </span>
              </div>
            ) : device.auditInfo?.status === 'COM_PENDENCIA' ? (
              (() => {
                const isScreenBroken = device.auditInfo.screenOk === false;
                const isBatteryBroken = device.auditInfo.batteryOk === false;
                const isPeliculaBroken = device.auditInfo.peliculaStatus === 'PELICULA_TRINCADA' ||
                  Boolean(device.auditInfo.damagedAccessories?.some(a => a.toLowerCase().includes('película') || a.toLowerCase().includes('pelicula')));
                const missingList = device.auditInfo.missingAccessories || [];
                const otherDamaged = (device.auditInfo.damagedAccessories || []).filter(
                  a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')
                );

                return (
                  <div className="flex flex-col gap-0.5 max-w-[135px]">
                    {isScreenBroken ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-red-600 text-white shadow-xs w-fit uppercase">
                        🔨 TELA QUEBRADA
                      </span>
                    ) : isBatteryBroken ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-orange-100 text-orange-950 border-2 border-orange-500 w-fit uppercase">
                        🔋 BATERIA INCHADA
                      </span>
                    ) : isPeliculaBroken ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-amber-100 text-amber-950 border border-amber-400 w-fit uppercase">
                        ⚠️ PELÍCULA TRINCADA
                      </span>
                    ) : missingList.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-100 text-red-950 border border-red-300 w-fit">
                        ❌ FALTANDO ITENS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-100 text-red-950 border border-red-300 w-fit">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        DIVERGÊNCIA
                      </span>
                    )}

                    {/* Subtítulo informativo */}
                    {isBatteryBroken && !isScreenBroken && (
                      <span className="text-[8.5px] text-orange-900 font-bold leading-tight block">
                        Bateria danificada/inchada
                      </span>
                    )}
                    {isPeliculaBroken && !isScreenBroken && (
                      <span className="text-[8.5px] text-amber-900 font-semibold leading-tight block">
                        Película trincada (tela boa)
                      </span>
                    )}
                    {isScreenBroken && (
                      <span className="text-[8.5px] text-red-700 font-bold leading-tight block">
                        Display/Vidro danificado
                      </span>
                    )}
                    {missingList.length > 0 && (
                      <span className="text-[8.5px] text-red-700 font-bold truncate block" title={missingList.join(', ')}>
                        Falta: {missingList.join(', ')}
                      </span>
                    )}
                    {otherDamaged.length > 0 && (
                      <span className="text-[8.5px] text-amber-850 font-medium truncate block" title={otherDamaged.join(', ')}>
                        Avaria: {otherDamaged.join(', ')}
                      </span>
                    )}
                  </div>
                );
              })()
            ) : (
              <button
                type="button"
                onClick={() => onOpenAudit(device)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer"
                title="Aparelho ainda não auditado. Clique para conferir itens"
              >
                <span>PENDENTE</span>
              </button>
            )}
          </td>
          )}

          {/* Ações */}
          <td className="py-2.5 px-2.5 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-0.5">
              {/* Checkup da Auditoria (Exibido apenas na lacuna de Auditoria) */}
              {showAuditColumn && (
                <button
                  onClick={() => onOpenAudit(device)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer mr-0.5 shadow-2xs"
                  title="Realizar Checkup de Auditoria e Conferir Itens Entregues"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-red-600" />
                  <span>Checkup</span>
                </button>
              )}

              {/* Fichário do Aparelho (Histórico completo) */}
              <button
                onClick={() => onOpenHistory(device)}
                className="p-1 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Abrir Fichário e Histórico"
              >
                <History className="w-3.5 h-3.5" />
              </button>

              {/* Anexar Ocorrência (Manutenção / Troca / Perda) */}
              <button
                onClick={() => onOpenAddOccurrence(device)}
                className="p-1 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Anexar Manutenção, Troca ou Perda"
              >
                <Wrench className="w-3.5 h-3.5" />
              </button>

              {/* Troca Rápida de Usuário */}
              <button
                onClick={() => onQuickTransfer(device)}
                className="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                title="Trocar Aparelho / Usuário"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Termo de Responsabilidade */}
              <button
                onClick={() => onOpenTerm(device)}
                className="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                title="Imprimir Termo de Responsabilidade"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>

              {/* Editar Cadastro */}
              <button
                onClick={() => onEditDevice(device)}
                className="p-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                title="Editar Cadastro"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {/* Excluir */}
              <button
                onClick={() => onDeleteDevice(device)}
                className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Excluir Registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  // Group devices if requested
  const storesInList = Array.from(new Set(devices.map((d) => d.store)));

  return (
    <div className="space-y-4">
      {devices.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
          <p className="font-bold text-zinc-800 text-sm">Nenhum celular encontrado com os filtros atuais</p>
          <p className="text-xs text-zinc-500 mt-1">
            Limpe os filtros de busca ou adicione um novo aparelho no botão acima.
          </p>
        </div>
      ) : isGroupedBySector ? (
        // RENDER GROUPED BY STORE AND SECTORS (Matching the PDF)
        storesInList.map((storeName) => {
          const storeDevs = devices.filter((d) => d.store === storeName);
          const sectorsInStore = Array.from(new Set(storeDevs.map((d) => d.sector)));

          return (
            <div key={storeName} className="space-y-3">
              {/* Header da Loja */}
              <div className="bg-zinc-950 text-white px-4 py-2.5 rounded-xl border-l-4 border-red-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    {storeName}
                  </h3>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-mono-nums text-zinc-300">
                    {storeDevs.length} {storeDevs.length === 1 ? 'aparelho' : 'aparelhos'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleGrouped}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <List className="w-3.5 h-3.5 text-red-500" />
                  <span>Alternar para Lista Contínua</span>
                </button>
              </div>

              {/* Tabelas de cada Grupo / Setor */}
              {sectorsInStore.map((secName) => {
                const secDevs = storeDevs.filter((d) => d.sector === secName);
                return (
                  <div key={secName} className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span className="text-xs font-bold uppercase text-zinc-900 tracking-wide">
                          Setor: {secName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono-nums font-semibold text-zinc-500">
                        {secDevs.length} {secDevs.length === 1 ? 'aparelho' : 'aparelhos'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-600 border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80">
                            <th className="py-2 px-2.5 whitespace-nowrap">Loja</th>
                            <th className="py-2 px-2 whitespace-nowrap">N° Patrimônio</th>
                            <th className="py-2 px-2.5 whitespace-nowrap">Colaborador</th>
                            <th className="py-2 px-2 whitespace-nowrap">Marca</th>
                            <th className="py-2 px-2.5 whitespace-nowrap">Modelo</th>
                            <th className="py-2 px-2 whitespace-nowrap">Setor</th>
                            <th className="py-2 px-2 whitespace-nowrap">Data Aquisição</th>
                            <th className="py-2 px-2 whitespace-nowrap">Status</th>
                            {showAuditColumn && (
                              <th className="py-2 px-2 whitespace-nowrap">Auditoria</th>
                            )}
                            <th className="py-2 px-2.5 text-right whitespace-nowrap">Fichário / Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/70">
                          {renderTableRows(secDevs)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      ) : (
        // RENDER CONTINUOUS TABLE
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-[10px] font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-200">
                  <th 
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('store')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Loja</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-2.5 px-2 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('assetNumber')}
                  >
                    <div className="flex items-center gap-1">
                      <span>N° Patrimônio</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('employeeName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Colaborador</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th className="py-2.5 px-2 whitespace-nowrap">Marca</th>

                  <th 
                    className="py-2.5 px-2.5 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Modelo</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-2.5 px-2 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('sector')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Setor</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-2.5 px-2 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('acquisitionDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Data Aquisição</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-2.5 px-2 cursor-pointer hover:bg-zinc-200 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  {showAuditColumn && (
                    <th className="py-2.5 px-2 whitespace-nowrap">Auditoria</th>
                  )}

                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Fichário / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {renderTableRows(devices)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
