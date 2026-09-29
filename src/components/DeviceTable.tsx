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
  List
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
  isGroupedBySector: boolean;
  onToggleGrouped: () => void;
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
  isGroupedBySector,
  onToggleGrouped,
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

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
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
          <td className="py-2.5 px-3 whitespace-nowrap text-zinc-800 font-bold text-[11px]">
            {device.store}
          </td>

          {/* N° Patrimônio */}
          <td className="py-2.5 px-3 whitespace-nowrap">
            {isSemPt ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
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
          <td className="py-2.5 px-3">
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
          <td className="py-2.5 px-2.5 whitespace-nowrap text-zinc-700 text-xs uppercase font-medium">
            {device.brand}
          </td>

          {/* Modelo */}
          <td className="py-2.5 px-3 whitespace-nowrap">
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
          <td className="py-2.5 px-3 whitespace-nowrap">
            <span className="text-xs text-zinc-800 font-semibold uppercase">
              {device.sector}
            </span>
          </td>

          {/* Data Aquisição */}
          <td className="py-2.5 px-3 whitespace-nowrap font-mono-nums text-zinc-600 text-xs">
            {device.acquisitionDate === '?' ? (
              <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[11px] border border-red-200">
                ? (Pendente)
              </span>
            ) : (
              device.acquisitionDate
            )}
          </td>

          {/* Status */}
          <td className="py-2.5 px-3 whitespace-nowrap">
            {getStatusBadge(device.status)}
          </td>

          {/* Ações */}
          <td className="py-2.5 px-3 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-1">
              {/* Fichário do Aparelho (Histórico completo) */}
              <button
                onClick={() => onOpenHistory(device)}
                className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Abrir Fichário e Histórico"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Anexar Ocorrência (Manutenção / Troca / Perda) */}
              <button
                onClick={() => onOpenAddOccurrence(device)}
                className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Anexar Manutenção, Troca ou Perda"
              >
                <Wrench className="w-4 h-4" />
              </button>

              {/* Troca Rápida de Usuário */}
              <button
                onClick={() => onQuickTransfer(device)}
                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors"
                title="Trocar Aparelho / Usuário"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              {/* Termo de Responsabilidade */}
              <button
                onClick={() => onOpenTerm(device)}
                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors"
                title="Imprimir Termo de Responsabilidade"
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Editar Cadastro */}
              <button
                onClick={() => onEditDevice(device)}
                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors"
                title="Editar Cadastro"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {/* Excluir */}
              <button
                onClick={() => onDeleteDevice(device)}
                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Excluir Registro"
              >
                <Trash2 className="w-4 h-4" />
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
      {/* Barra de controle de visualização em Grupos */}
      <div className="flex items-center justify-between bg-zinc-900 text-white px-4 py-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wide text-zinc-300">
            Visualização dos Aparelhos:
          </span>
          <span className="text-xs text-zinc-400">
            {isGroupedBySector ? 'Separado por Grupos (Modelo PDF)' : 'Lista Contínua Unificada'}
          </span>
        </div>

        <button
          onClick={onToggleGrouped}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {isGroupedBySector ? (
            <>
              <List className="w-3.5 h-3.5" />
              <span>Ver Lista Contínua</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>Separar por Grupos (PDF)</span>
            </>
          )}
        </button>
      </div>

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
              <div className="bg-zinc-950 text-white px-4 py-2.5 rounded-xl border-l-4 border-red-600 flex items-center justify-between shadow-xs">
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  CONTROLE DE PATRIMÔNIO — {storeName}
                </h3>
                <span className="text-xs font-mono font-bold bg-red-600 text-white px-2.5 py-0.5 rounded">
                  {storeDevs.length} APARELHOS
                </span>
              </div>

              {/* Tabelas de cada Grupo / Setor */}
              {sectorsInStore.map((secName) => {
                const secDevs = storeDevs.filter((d) => d.sector === secName);
                return (
                  <div key={secName} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-zinc-100/90 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-red-700 tracking-wide">
                        SETOR: {secName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-600">
                        {secDevs.length} Aparelho(s)
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-600 border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-200">
                            <th className="py-2.5 px-3">Loja</th>
                            <th className="py-2.5 px-3">N° Patrimônio</th>
                            <th className="py-2.5 px-3">Colaborador</th>
                            <th className="py-2.5 px-2.5">Marca</th>
                            <th className="py-2.5 px-3">Modelo</th>
                            <th className="py-2.5 px-3">Setor</th>
                            <th className="py-2.5 px-3">Data Aquisição</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Fichário / Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
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
                <tr className="bg-zinc-100 text-[11px] font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-200">
                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('store')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Loja</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('assetNumber')}
                  >
                    <div className="flex items-center gap-1">
                      <span>N° Patrimônio</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('employeeName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Colaborador</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th className="py-3 px-2.5">Marca</th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Modelo</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('sector')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Setor</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('acquisitionDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Data Aquisição</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-3 cursor-pointer hover:bg-zinc-200 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  <th className="py-3 px-3 text-right">Fichário / Ações</th>
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
