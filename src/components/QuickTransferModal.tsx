import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, ArrowRight } from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';

interface QuickTransferModalProps {
  device: Device | null;
  onClose: () => void;
  onTransfer: (updatedDevice: Device) => void;
  sectors: string[];
}

export const QuickTransferModal: React.FC<QuickTransferModalProps> = ({
  device,
  onClose,
  onTransfer,
  sectors,
}) => {
  if (!device) return null;

  const [toStock, setToStock] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newSector, setNewSector] = useState(device.sector);
  const [reason, setReason] = useState('Troca de usuário / aparelho');
  const [recordedBy, setRecordedBy] = useState('Gerência / TI');
  const [isPersonal, setIsPersonal] = useState(Boolean(device.isPersonalDevice));

  const handleStockToggle = (checked: boolean) => {
    setToStock(checked);
    if (checked) {
      setNewEmployeeName('— (Reserva Técnica)');
      setNewSector('ESTOQUE');
    } else {
      setNewEmployeeName('');
      setNewSector(device.sector);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetEmployee = toStock ? '— (Reserva Técnica)' : newEmployeeName.trim().toUpperCase() || 'Novo Colaborador';
    const finalStatus: DeviceStatus = toStock ? 'DISPONÍVEL' : 'EM USO';
    const now = new Date();

    const newOcc = {
      id: `occ-trans-${Date.now()}`,
      date: now.toLocaleDateString('pt-BR'),
      type: toStock ? ('DEVOLUCAO' as const) : ('TROCA' as const),
      title: toStock ? 'Devolução para Reserva' : `Troca: ${device.employeeName} ➔ ${targetEmployee}`,
      description: toStock
        ? `Devolvido ao estoque pelo colaborador ${device.employeeName}. Motivo: ${reason}`
        : `Transferido de ${device.employeeName} para ${targetEmployee}. Motivo: ${reason}`,
      previousUser: device.employeeName,
      newUser: targetEmployee,
      recordedBy,
    };

    const updatedDevice: Device = {
      ...device,
      previousEmployeeName: device.employeeName,
      employeeName: targetEmployee,
      sector: newSector,
      status: finalStatus,
      isPersonalDevice: toStock ? false : isPersonal,
      updatedAt: now.toISOString(),
      occurrences: [newOcc, ...device.occurrences],
    };

    onTransfer(updatedDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Trocar Aparelho / Usuário
              </h2>
              <p className="text-xs text-zinc-300">
                PT: {device.hasAssetTag ? device.assetNumber : 'SEM PT'} · {device.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State vs Target */}
        <div className="p-6 space-y-4">
          <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] font-bold text-zinc-500 block uppercase">Quem está com o celular</span>
              <strong className="text-zinc-950 text-sm font-bold uppercase">{device.employeeName}</strong>
              <span className="text-zinc-500 block">{device.sector}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-red-600" />
            <div className="text-right">
              <span className="text-[11px] font-bold text-zinc-500 block uppercase">Com quem vai ficar</span>
              <strong className="text-red-700 text-sm font-bold uppercase">
                {toStock ? 'Reserva Técnica' : newEmployeeName.toUpperCase() || 'Novo Colaborador'}
              </strong>
              <span className="text-zinc-500 block">{newSector}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Toggle Devolução para Estoque */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-red-950 block">Devolver para Estoque / Reserva</span>
                <span className="text-red-800 text-[11px] block">
                  Marque se o colaborador estiver devolvendo sem repassar para outro usuário
                </span>
              </div>
              <input
                type="checkbox"
                checked={toStock}
                onChange={(e) => handleStockToggle(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>

            {!toStock && (
              <>
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    Nome do Novo Usuário <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MARCOS LIMA"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold uppercase focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 text-xs select-none">
                    <input
                      type="checkbox"
                      checked={isPersonal}
                      onChange={(e) => setIsPersonal(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Celular Pessoal do Colaborador (Uso Próprio)</span>
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Novo Setor / Localização
              </label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-semibold"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Motivo da Troca
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Substituição de função, novo colaborador contratado..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Registrado por (Responsável)
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Troca</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
