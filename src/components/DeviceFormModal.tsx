import React, { useState, useEffect } from 'react';
import { X, Check, Smartphone, AlertTriangle, Shield, UserCheck } from 'lucide-react';
import { Device, DeviceCondition, DeviceStatus } from '../types/device';
import { DEFAULT_BRANDS } from '../data/initialData';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
  editingDevice: Device | null;
  stores: string[];
  sectors: string[];
}

const COMMON_ACCESSORIES = [
  'Carregador Original',
  'Cabo USB-C',
  'Capa Protetora',
  'Película de Vidro',
  'Carregador Veicular',
  'Caixa Original',
];

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDevice,
  stores,
  sectors,
}) => {
  const [store, setStore] = useState('LOJA ACARAÚ');
  const [hasAssetTag, setHasAssetTag] = useState(true);
  const [assetNumber, setAssetNumber] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [previousEmployeeName, setPreviousEmployeeName] = useState('');
  const [hasVpn, setHasVpn] = useState(false);
  const [brand, setBrand] = useState('SAMSUNG');
  const [model, setModel] = useState('');
  const [sector, setSector] = useState('VENDAS');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('EM USO');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [carrier, setCarrier] = useState('Claro Corporativo');
  const [imei1, setImei1] = useState('');
  const [condition, setCondition] = useState<DeviceCondition>('BOM');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([
    'Carregador Original',
    'Capa Protetora',
  ]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (editingDevice) {
      setStore(editingDevice.store || 'LOJA ACARAÚ');
      setHasAssetTag(editingDevice.hasAssetTag);
      setAssetNumber(editingDevice.hasAssetTag ? editingDevice.assetNumber : '');
      setEmployeeName(editingDevice.employeeName || '');
      setPreviousEmployeeName(editingDevice.previousEmployeeName || '');
      setHasVpn(editingDevice.hasVpn || false);
      setBrand(editingDevice.brand || 'SAMSUNG');
      setModel(editingDevice.model || '');
      setSector(editingDevice.sector || 'VENDAS');
      setAcquisitionDate(editingDevice.acquisitionDate || '');
      setStatus(editingDevice.status || 'EM USO');
      setPhoneNumber(editingDevice.phoneNumber || '');
      setCarrier(editingDevice.carrier || 'Claro Corporativo');
      setImei1(editingDevice.imei1 || '');
      setCondition(editingDevice.condition || 'BOM');
      setSelectedAccessories(editingDevice.accessories || []);
      setNotes(editingDevice.notes || '');
    } else {
      setStore('LOJA ACARAÚ');
      setHasAssetTag(true);
      setAssetNumber('');
      setEmployeeName('');
      setPreviousEmployeeName('');
      setHasVpn(false);
      setBrand('SAMSUNG');
      setModel('A55 - 128GB');
      setSector('VENDAS');
      setAcquisitionDate(new Date().toLocaleDateString('pt-BR'));
      setStatus('EM USO');
      setPhoneNumber('');
      setCarrier('Claro Corporativo');
      setImei1('');
      setCondition('BOM');
      setSelectedAccessories(['Carregador Original', 'Capa Protetora']);
      setNotes('');
    }
    setFormError('');
  }, [editingDevice, isOpen]);

  if (!isOpen) return null;

  const toggleAccessory = (acc: string) => {
    if (selectedAccessories.includes(acc)) {
      setSelectedAccessories(selectedAccessories.filter((a) => a !== acc));
    } else {
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) {
      setFormError('Por favor informe o modelo do aparelho (ex: A55 - 128GB).');
      return;
    }

    if (hasAssetTag && !assetNumber.trim()) {
      setFormError('Informe o número de patrimônio ou marque como "SEM PT".');
      return;
    }

    const now = new Date().toISOString();
    const finalAssetNumber = hasAssetTag ? assetNumber.trim() : 'SEM PT';
    const finalStatus: DeviceStatus = !hasAssetTag && status === 'EM USO' ? 'SEM PATRIMÔNIO' : status;

    const deviceData: Device = {
      id: editingDevice ? editingDevice.id : `dev-${Date.now()}`,
      store: store.toUpperCase(),
      assetNumber: finalAssetNumber,
      hasAssetTag: hasAssetTag,
      employeeName: employeeName.trim().toUpperCase() || 'A DEFINIR',
      previousEmployeeName: previousEmployeeName.trim().toUpperCase() || undefined,
      hasVpn,
      brand: brand.toUpperCase(),
      model: model.trim(),
      sector: sector.toUpperCase(),
      acquisitionDate: acquisitionDate.trim() || '?',
      status: finalStatus,
      phoneNumber: phoneNumber.trim(),
      carrier: carrier.trim(),
      imei1: imei1.trim(),
      condition,
      accessories: selectedAccessories,
      notes: notes.trim(),
      occurrences: editingDevice
        ? editingDevice.occurrences
        : [
            {
              id: `occ-cad-${Date.now()}`,
              date: new Date().toLocaleDateString('pt-BR'),
              type: 'ENTREGA',
              title: 'Cadastro do Aparelho',
              description: `Cadastrado na unidade ${store} para ${employeeName.trim().toUpperCase() || 'o setor'}.`,
              recordedBy: 'Gestor',
            },
          ],
      createdAt: editingDevice ? editingDevice.createdAt : now,
      updatedAt: now,
    };

    onSave(deviceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Amilco Black & Red */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {editingDevice ? 'Editar Cadastro de Aparelho' : 'Cadastrar Novo Celular'}
              </h2>
              <p className="text-xs text-zinc-300">
                Amilco Home Center · Gestão de Patrimônio
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Loja e Tombamento */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
            <h3 className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider">
              1. Unidade e Número Patrimonial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Loja / Unidade <span className="text-red-600">*</span>
                </label>
                <select
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600 font-semibold"
                >
                  {stores.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700">
                    N° do Patrimônio
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-red-700 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={!hasAssetTag}
                      onChange={(e) => {
                        setHasAssetTag(!e.target.checked);
                        if (e.target.checked) setAssetNumber('');
                      }}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    Sem Tombamento (SEM PT)
                  </label>
                </div>
                <input
                  type="text"
                  disabled={!hasAssetTag}
                  placeholder={hasAssetTag ? 'Ex: 00271' : 'SEM PT (Pendente)'}
                  value={assetNumber}
                  onChange={(e) => setAssetNumber(e.target.value)}
                  className={`w-full font-mono-nums rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 font-bold ${
                    hasAssetTag
                      ? 'border-zinc-300 bg-white text-zinc-900'
                      : 'border-red-200 bg-red-50 text-red-800 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Dados do Aparelho */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider">
              2. Modelo e Especificações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Marca</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-semibold"
                >
                  {DEFAULT_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 mb-1">
                  Modelo e Armazenamento <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: A54 - 128GB, A03s - 64GB"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-semibold focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">IMEI 1</label>
                <input
                  type="text"
                  placeholder="15 dígitos do IMEI"
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Estado de Conservação</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as DeviceCondition)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-medium"
                >
                  <option value="NOVO">NOVO (Na caixa)</option>
                  <option value="BOM">BOM (Em uso regular)</option>
                  <option value="COM AVARIAS">COM MARCAS DE USO</option>
                  <option value="TELA TRINCADA">TELA TRINCADA</option>
                  <option value="EM REPARO">EM REPARO / DEFEITO</option>
                  <option value="EXTRAVIADO">EXTRAVIADO / PERDIDO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Usuário Atual e Usuário Anterior (Troca) */}
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-3">
            <h3 className="font-bold text-red-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-red-600" />
              <span>3. Colaborador Responsável e Histórico de Troca</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Colaborador Atual <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VINICIUS, BRUNA, JOÃO..."
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold uppercase focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Usuário Anterior (Se trocou de usuário):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Usuário anterior ou Devolvido"
                  value={previousEmployeeName}
                  onChange={(e) => setPreviousEmployeeName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 uppercase font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Setor</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold"
                >
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold"
                >
                  <option value="EM USO">EM USO</option>
                  <option value="DISPONÍVEL">DISPONÍVEL (ESTOQUE)</option>
                  <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                  <option value="SEM PATRIMÔNIO">SEM PATRIMÔNIO</option>
                  <option value="PERDA / EXTRAVIO">PERDA / EXTRAVIO</option>
                  <option value="DESCARTADO">DESCARTADO</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Data de Aquisição</label>
                <input
                  type="text"
                  placeholder="Ex: 20/05/2026 ou ?"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* VPN Checkbox */}
            <div className="pt-1 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900">
                <input
                  type="checkbox"
                  checked={hasVpn}
                  onChange={(e) => setHasVpn(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  Possui Acesso VPN Corporativa
                </span>
              </label>
            </div>
          </div>

          {/* Acessórios */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1.5">
              Acessórios Entregues / Vinculados
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ACCESSORIES.map((acc) => {
                const isSelected = selectedAccessories.includes(acc);
                return (
                  <button
                    type="button"
                    key={acc}
                    onClick={() => toggleAccessory(acc)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {acc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o aparelho..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingDevice ? 'Salvar Alterações' : 'Cadastrar Celular'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
