import React from 'react';
import { 
  X, 
  Smartphone, 
  FileText, 
  ArrowRightLeft, 
  Edit3, 
  Shield, 
  Calendar, 
  AlertTriangle,
  History,
  Phone,
  ClipboardCheck,
  CheckCircle2
} from 'lucide-react';
import { Device } from '../types/device';

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
  onEdit: (device: Device) => void;
  onOpenTerm: (device: Device) => void;
  onQuickTransfer: (device: Device) => void;
  onOpenAudit?: (device: Device) => void;
  onDeleteOccurrence?: (deviceId: string, occurrenceId: string) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  onClose,
  onEdit,
  onOpenTerm,
  onQuickTransfer,
  onOpenAudit,
  onDeleteOccurrence,
}) => {
  if (!device) return null;

  const isSemPt = !device.hasAssetTag || device.assetNumber === 'SEM PT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {device.brand} {device.model}
                </h2>
                {device.isPersonalDevice ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-700 text-white rounded">
                    CELULAR PESSOAL
                  </span>
                ) : isSemPt ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded">
                    SEM PT
                  </span>
                ) : (
                  <span className="font-mono-nums font-bold text-xs bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700">
                    PT: {device.assetNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                {device.store} · {device.sector}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenAudit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAudit(device);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Realizar Checkup de Auditoria"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Checkup</span>
              </button>
            )}

            <button
              onClick={() => onOpenTerm(device)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
              title="Gerar Termo de Responsabilidade"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Termo A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Card de Auditoria & Checkup de Itens */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            device.auditInfo?.status === 'OK'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : device.auditInfo?.status === 'COM_PENDENCIA'
                ? 'bg-red-50/80 border-red-300 text-red-950'
                : 'bg-zinc-50 border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-start gap-3">
              <ClipboardCheck className={`w-5 h-5 shrink-0 mt-0.5 ${
                device.auditInfo?.status === 'OK'
                  ? 'text-emerald-600'
                  : device.auditInfo?.status === 'COM_PENDENCIA'
                    ? 'text-red-600'
                    : 'text-zinc-400'
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold uppercase tracking-wider text-xs">
                    {device.auditInfo?.status === 'OK'
                      ? 'Checkup de Auditoria: 100% Conforme'
                      : device.auditInfo?.status === 'COM_PENDENCIA'
                        ? 'Checkup de Auditoria: Pendência Apontada'
                        : 'Auditoria & Checkup: Não Realizado'}
                  </h4>
                  {device.auditInfo?.lastAuditedAt && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({device.auditInfo.lastAuditedAt})
                    </span>
                  )}
                </div>

                {device.auditInfo?.status === 'COM_PENDENCIA' && (
                  <div className="space-y-1 mt-1.5">
                    {device.auditInfo.screenOk === false && (
                      <p className="text-red-700 text-xs font-black flex items-center gap-1">
                        <span>🔨 TELA DO APARELHO QUEBRADA:</span>
                        <span className="font-normal text-red-900">Dano físico no display/vidro do aparelho.</span>
                      </p>
                    )}
                    {device.auditInfo.peliculaStatus === 'PELICULA_TRINCADA' && (
                      <p className="text-amber-900 text-xs font-bold flex items-center gap-1">
                        <span>⚠️ PELÍCULA DE PROTEÇÃO TRINCADA:</span>
                        <span className="font-medium text-amber-950">
                          Película danificada (a tela original do aparelho está {device.auditInfo.screenOk === false ? 'também quebrada' : 'íntegra/sem danos'}).
                        </span>
                      </p>
                    )}
                    {device.auditInfo.missingAccessories && device.auditInfo.missingAccessories.length > 0 && (
                      <p className="text-red-800 text-xs font-bold">
                        ❌ Itens Faltando: {device.auditInfo.missingAccessories.join(', ')}
                      </p>
                    )}
                    {device.auditInfo.damagedAccessories && device.auditInfo.damagedAccessories.filter(a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')).length > 0 && (
                      <p className="text-amber-900 text-xs font-semibold">
                        ⚠️ Outros Danificados: {device.auditInfo.damagedAccessories.filter(a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {device.auditInfo?.auditNotes && (
                  <p className="text-zinc-600 text-[11px] mt-1 italic">
                    Obs: "{device.auditInfo.auditNotes}"
                  </p>
                )}

                {!device.auditInfo && (
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Este aparelho ainda não foi auditado nesta rodada presencial de checkups.
                  </p>
                )}
              </div>
            </div>

            {onOpenAudit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAudit(device);
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>{device.auditInfo ? 'Refazer Checkup' : 'Fazer Checkup Agora'}</span>
              </button>
            )}
          </div>

          {/* Alerta Sem Tombamento ou Aviso de Celular Pessoal */}
          {device.isPersonalDevice ? (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                  Aparelho Particular do Colaborador
                </h4>
                <p className="text-xs text-purple-800 mt-0.5">
                  Este aparelho pertence ao colaborador (não faz parte do patrimônio da loja).
                </p>
              </div>
            </div>
          ) : isSemPt ? (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-950">Aparelho Pendente de Tombamento (SEM PT)</h4>
                <p className="text-xs text-red-800 mt-0.5">
                  Este aparelho está alocado sem placa patrimonial cadastrada.
                </p>
              </div>
            </div>
          ) : null}

          {/* Grid de Informações Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-500 block uppercase">Colaborador Atual</span>
              <span className="text-sm font-bold text-zinc-950 block mt-0.5 uppercase">
                {device.employeeName}
              </span>
              {device.previousEmployeeName && (
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Anterior: {device.previousEmployeeName}
                </span>
              )}
              {device.hasVpn && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded mt-1">
                  <Shield className="w-2.5 h-2.5" /> VPN Habilitada
                </span>
              )}
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-500 block uppercase">Setor / Loja</span>
              <span className="text-sm font-bold text-red-700 block mt-0.5 uppercase">
                {device.sector}
              </span>
              <span className="text-[11px] text-zinc-600 block mt-0.5 font-medium">
                {device.store}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-500 block uppercase">Status Operacional</span>
              <span className="text-sm font-bold text-zinc-950 block mt-0.5">
                {device.isPersonalDevice && (device.status === 'SEM PATRIMÔNIO' || device.status === 'PESSOAL') ? 'CELULAR PESSOAL' : device.status}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5 font-mono">
                Aquisição: {device.acquisitionDate}
              </span>
            </div>
          </div>

          {/* Dados Técnicos */}
          <div className="border border-zinc-200 rounded-xl p-4 space-y-2.5">
            <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              Dados de Conectividade & Acessórios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block font-medium">Linha / Telefone:</span>
                <span className="font-bold text-zinc-950 font-mono">
                  {device.phoneNumber || 'Nenhum chip registrado'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block font-medium">IMEI Principal:</span>
                <span className="font-bold text-zinc-950 font-mono">
                  {device.imei1 || 'Não cadastrado'}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block font-medium">Estado Físico:</span>
                <span className="font-semibold text-zinc-900">{device.condition}</span>
              </div>

              <div>
                <span className="text-zinc-500 block font-medium">Acessórios Vinculados:</span>
                <span className="font-semibold text-zinc-900">
                  {device.accessories.length > 0 ? device.accessories.join(', ') : 'Carregador'}
                </span>
              </div>
            </div>

            {device.notes && (
              <div className="mt-2 p-2.5 bg-red-50/80 border border-red-200 rounded-lg">
                <span className="text-red-800 text-[11px] block font-bold uppercase tracking-wide">
                  ⚠️ Descrição de Defeito / Avaria da Ficha:
                </span>
                <p className="text-zinc-950 font-semibold mt-0.5 text-xs">{device.notes}</p>
              </div>
            )}
          </div>

          {/* Histórico do Fichário */}
          <div className="border border-zinc-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 uppercase text-[11px] flex items-center gap-1.5">
                <History className="w-4 h-4 text-red-600" />
                Histórico de Ocorrências ({device.occurrences.length})
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {device.occurrences.length === 0 ? (
                <p className="text-zinc-500 text-xs italic">Nenhuma ocorrência registrada ainda.</p>
              ) : (
                device.occurrences.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-zinc-950 uppercase text-[11px]">{item.title}</strong>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono">{item.date}</span>
                          {onDeleteOccurrence && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Deseja excluir este registro de histórico/manutenção?\n"${item.title}"`)) {
                                  onDeleteOccurrence(device.id, item.id || `occ-${idx}`);
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Excluir ocorrência (X)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-zinc-600 text-xs mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50">
          <button
            onClick={() => onQuickTransfer(device)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-red-500" />
            <span>Trocar Usuário</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(device)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
