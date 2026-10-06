import React, { useState } from 'react';
import { 
  X, 
  History, 
  Plus, 
  Wrench, 
  ArrowRightLeft, 
  AlertOctagon, 
  FileText, 
  Check, 
  Paperclip, 
  Printer, 
  Smartphone, 
  User, 
  Building,
  Shield,
  Clock,
  Eye,
  ClipboardCheck
} from 'lucide-react';
import { Device, DeviceOccurrence, OccurrenceType } from '../types/device';
import { getCleanOccurrencesForDisplay } from '../utils/auditFormatUtils';

interface DeviceHistoryModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddOccurrence: (device: Device) => void;
  onDeleteOccurrence?: (deviceId: string, occurrenceId: string) => void;
}

export const DeviceHistoryModal: React.FC<DeviceHistoryModalProps> = ({
  device,
  isOpen,
  onClose,
  onOpenAddOccurrence,
  onDeleteOccurrence,
}) => {
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const cleanOccurrences = getCleanOccurrencesForDisplay(device);

  const filteredOccurrences = cleanOccurrences.filter((occ) => {
    if (filterType === 'TODOS') return true;
    return occ.type === filterType;
  });

  const auditCount = cleanOccurrences.filter((o) => o.type === 'AUDITORIA').length;
  const maintenanceCount = cleanOccurrences.filter((o) => o.type === 'MANUTENÇÃO').length;
  const transferCount = cleanOccurrences.filter((o) => o.type === 'TROCA').length;
  const lossCount = cleanOccurrences.filter((o) => o.type === 'PERDA').length;

  const getOccurrenceBadge = (type: OccurrenceType) => {
    switch (type) {
      case 'AUDITORIA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-900 text-white border border-zinc-800">
            <ClipboardCheck className="w-3 h-3 text-red-500" />
            AUDITORIA
          </span>
        );
      case 'MANUTENÇÃO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Wrench className="w-3 h-3 text-amber-700" />
            MANUTENÇÃO
          </span>
        );
      case 'TROCA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <ArrowRightLeft className="w-3 h-3 text-blue-700" />
            TROCA
          </span>
        );
      case 'PERDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
            <AlertOctagon className="w-3 h-3 text-red-700" />
            PERDA / EXTRAVIO
          </span>
        );
      case 'ENTREGA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-700" />
            ENTREGA
          </span>
        );
      case 'DEVOLUCAO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-200 text-zinc-900 border border-zinc-300">
            DEVOLUÇÃO
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Amilco Red/Black */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Fichário & Histórico do Aparelho
                </h2>
                <span className="bg-red-900/60 text-red-200 text-xs px-2 py-0.5 rounded font-mono font-bold border border-red-700">
                  {device.hasAssetTag ? `PT: ${device.assetNumber}` : 'SEM PT'}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                {device.store} · {device.brand} {device.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddOccurrence(device)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Anexar Ocorrência</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informações Básicas do Aparelho */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-zinc-500 font-semibold block">Usuário Atual:</span>
            <strong className="text-zinc-900 text-sm font-bold block">{device.employeeName}</strong>
            {device.hasVpn && (
              <span className="inline-block mt-0.5 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded border border-red-200">
                VPN Ativa
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-zinc-500 font-semibold block">Usuário Anterior:</span>
            <span className="text-zinc-800 font-medium block">
              {device.previousEmployeeName || 'Nenhum registrado'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-zinc-500 font-semibold block">Setor / Loja:</span>
            <span className="text-zinc-800 font-medium block">{device.sector}</span>
            <span className="text-[11px] text-zinc-500">{device.store}</span>
          </div>

          <div>
            <span className="text-[11px] text-zinc-500 font-semibold block">Status Atual:</span>
            <span className="font-bold text-zinc-900 block">{device.status}</span>
            <span className="text-[11px] text-zinc-500 font-mono">Aquisição: {device.acquisitionDate}</span>
          </div>
        </div>

        {/* Resumo de Indicadores do Fichário */}
        <div className="px-6 py-3 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">Filtro do Fichário:</span>
            <div className="flex flex-wrap items-center gap-1">
              {['TODOS', 'AUDITORIA', 'MANUTENÇÃO', 'TROCA', 'PERDA', 'ENTREGA'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === f
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-medium">
            <span>Auditorias: <strong className="text-zinc-900">{auditCount}</strong></span>
            <span>·</span>
            <span>Manutenções: <strong className="text-zinc-900">{maintenanceCount}</strong></span>
            <span>·</span>
            <span>Trocas: <strong className="text-zinc-900">{transferCount}</strong></span>
            <span>·</span>
            <span>Perdas: <strong className="text-red-700">{lossCount}</strong></span>
          </div>
        </div>

        {/* Lista / Timeline de Ocorrências */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredOccurrences.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <History className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
              <p className="font-bold text-zinc-700 text-sm">Nenhuma ocorrência registrada com este filtro</p>
              <p className="text-xs text-zinc-500 mt-1">
                Clique no botão "+ Anexar Ocorrência" acima para registrar manutenção, troca ou perda.
              </p>
            </div>
          ) : (
            filteredOccurrences.map((occ, idx) => (
              <div
                key={occ.id || idx}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs hover:border-zinc-300 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getOccurrenceBadge(occ.type)}
                    <h3 className="text-xs font-bold text-zinc-900 uppercase">
                      {occ.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{occ.date}</span>
                    <span>·</span>
                    <span className="font-sans">Registrado por: <strong>{occ.recordedBy}</strong></span>

                    {onDeleteOccurrence && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir este registro de histórico/manutenção?\n"${occ.title}"`)) {
                            onDeleteOccurrence(device.id, occ.id || `occ-${idx}`);
                          }
                        }}
                        className="ml-1 p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        title="Excluir este histórico/manutenção (X)"
                      >
                        <X className="w-3.5 h-3.5 text-zinc-500 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed">
                  {occ.description}
                </p>

                {/* Detalhes de Troca */}
                {occ.type === 'TROCA' && (occ.previousUser || occ.newUser) && (
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-zinc-500 block">Usuário que entregou:</span>
                      <strong className="text-zinc-900 font-bold">{occ.previousUser || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block">Usuário que recebeu:</span>
                      <strong className="text-red-700 font-bold">{occ.newUser || '—'}</strong>
                    </div>
                  </div>
                )}

                {/* Detalhes de Manutenção / Perda */}
                {(occ.serviceOrderOrBo || occ.cost || occ.technicianOrProvider) && (
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 flex flex-wrap items-center gap-4 text-xs">
                    {occ.technicianOrProvider && (
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Assistência:</span>
                        <strong className="text-zinc-900">{occ.technicianOrProvider}</strong>
                      </div>
                    )}
                    {occ.serviceOrderOrBo && (
                      <div>
                        <span className="text-[11px] text-zinc-500 block">N° O.S. / B.O.:</span>
                        <strong className="text-zinc-900 font-mono">{occ.serviceOrderOrBo}</strong>
                      </div>
                    )}
                    {occ.cost && (
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Custo Reparo:</span>
                        <strong className="text-red-700 font-mono">{occ.cost}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Anexo se houver */}
                {occ.attachmentName && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-600">
                      <Paperclip className="w-3.5 h-3.5 text-red-600" />
                      Documento anexado: <strong className="text-zinc-900">{occ.attachmentName}</strong>
                    </span>

                    {occ.attachmentData && (
                      <button
                        onClick={() => setViewingAttachment(occ.attachmentData || null)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Anexo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal de Preview de Anexo */}
        {viewingAttachment && (
          <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-4 max-w-lg w-full space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs text-zinc-900">Anexo do Fichário</span>
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="p-1 text-zinc-500 hover:text-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={viewingAttachment}
                alt="Comprovante"
                className="w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>AMILCO HOME CENTER · Fichário Oficial de Aparelhos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
