import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Smartphone,
  AlertTriangle,
  Shield,
  UserCheck,
  UserPlus,
  RefreshCw,
  Package,
  ArrowRight,
} from 'lucide-react';
import { Device, DeviceCondition, DeviceStatus } from '../types/device';
import { DEFAULT_BRANDS } from '../data/initialData';
import { getSynchronizedEmployees } from '../utils/userSyncUtils';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Device, additionalUpdatedDevices?: Device[]) => void;
  editingDevice: Device | null;
  allDevices: Device[];
  stores: string[];
  sectors: string[];
}

const COMMON_ACCESSORIES = [
  'Carregador Original',
  'Cabo USB-C',
  'Capa Protetora',
  'Película de Vidro',
  'Cartão de Memória',
  'Carregador Veicular',
  'Caixa Original',
];

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDevice,
  allDevices,
  stores,
  sectors,
}) => {
  const [store, setStore] = useState('LOJA ACARAÚ');
  const [hasAssetTag, setHasAssetTag] = useState(true);
  const [assetNumber, setAssetNumber] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [previousEmployeeName, setPreviousEmployeeName] = useState('');
  const [hasVpn, setHasVpn] = useState(false);
  const [isPersonalDevice, setIsPersonalDevice] = useState(false);
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

  // Opções de Alocação / Remanejamento Sincronizado no Cadastro
  const [assignmentMode, setAssignmentMode] = useState<
    'NOVO_USUARIO' | 'USUARIO_SINCRONIZADO' | 'REMANEJAR_APARELHO_EM_USO' | 'GUARDAR_ESTOQUE'
  >('NOVO_USUARIO');
  const [selectedSyncedUser, setSelectedSyncedUser] = useState<string>('');
  const [syncedUserOldDeviceAction, setSyncedUserOldDeviceAction] = useState<'ESTOQUE' | 'MANTER_DOIS'>('ESTOQUE');

  // Remanejar substituindo um aparelho específico já em uso (para o MESMO usuário ou um NOVO usuário)
  const [replacedInUseDeviceId, setReplacedInUseDeviceId] = useState<string>('');
  const [remanejarTargetHolderMode, setRemanejarTargetHolderMode] = useState<'MESMO_USUARIO' | 'NOVO_USUARIO'>('MESMO_USUARIO');
  const [remanejarOldDeviceFate, setRemanejarOldDeviceFate] = useState<
    'ESTOQUE' | 'MANUTENCAO' | 'REPASSAR_OUTRO_USUARIO'
  >('ESTOQUE');
  const [remanejarOldDeviceNextUser, setRemanejarOldDeviceNextUser] = useState<string>('');

  const synchronizedUsers = useMemo(() => getSynchronizedEmployees(allDevices), [allDevices]);
  const inUseDevices = useMemo(
    () =>
      allDevices
        .filter((d) => d.status === 'EM USO' || d.status === 'SEM PATRIMÔNIO' || d.status === 'PESSOAL')
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'pt-BR')),
    [allDevices]
  );

  const selectedInUseDeviceObj = useMemo(
    () => inUseDevices.find((d) => d.id === replacedInUseDeviceId) || null,
    [inUseDevices, replacedInUseDeviceId]
  );

  const selectedSyncedUserObj = useMemo(
    () => synchronizedUsers.find((u) => u.name === selectedSyncedUser) || null,
    [synchronizedUsers, selectedSyncedUser]
  );

  useEffect(() => {
    if (editingDevice) {
      setStore(editingDevice.store || 'LOJA ACARAÚ');
      setHasAssetTag(editingDevice.hasAssetTag);
      setAssetNumber(editingDevice.hasAssetTag ? editingDevice.assetNumber : '');
      setEmployeeName(editingDevice.employeeName || '');
      setPreviousEmployeeName(editingDevice.previousEmployeeName || '');
      setHasVpn(editingDevice.hasVpn || false);
      setIsPersonalDevice(Boolean(editingDevice.isPersonalDevice));
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
      setAssignmentMode('NOVO_USUARIO');
    } else {
      setStore('LOJA ACARAÚ');
      setHasAssetTag(true);
      setAssetNumber('');
      setEmployeeName('');
      setPreviousEmployeeName('');
      setHasVpn(false);
      setIsPersonalDevice(false);
      setBrand('SAMSUNG');
      setModel('A55 - 128GB');
      setSector('VENDAS');
      setAcquisitionDate(new Date().toLocaleDateString('pt-BR'));
      setStatus('EM USO');
      setPhoneNumber('');
      setCarrier('Claro Corporativo');
      setImei1('');
      setCondition('BOM');
      setSelectedAccessories([
        'Carregador Original',
        'Cabo USB-C',
        'Capa Protetora',
        'Película de Vidro',
      ]);
      setNotes('');
      setAssignmentMode('NOVO_USUARIO');
      setSelectedSyncedUser('');
      setReplacedInUseDeviceId('');
      setRemanejarTargetHolderMode('MESMO_USUARIO');
      setRemanejarOldDeviceFate('ESTOQUE');
      setRemanejarOldDeviceNextUser('');
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

  // Quando seleciona um aparelho em uso para remanejar
  const handleSelectReplacedDevice = (devId: string) => {
    setReplacedInUseDeviceId(devId);
    const dev = inUseDevices.find((d) => d.id === devId);
    if (dev) {
      setStore(dev.store);
      setSector(dev.sector);
      setHasVpn(dev.hasVpn);
      if (dev.phoneNumber && !phoneNumber) {
        setPhoneNumber(dev.phoneNumber);
      }
      if (remanejarTargetHolderMode === 'MESMO_USUARIO') {
        setEmployeeName(dev.employeeName);
      }
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

    let resolvedEmployeeName = employeeName.trim().toUpperCase();
    let resolvedSector = sector.toUpperCase();
    let resolvedStatus: DeviceStatus = status;

    if (!editingDevice) {
      if (assignmentMode === 'GUARDAR_ESTOQUE') {
        resolvedEmployeeName = '— (Reserva Técnica)';
        resolvedSector = 'ESTOQUE';
        resolvedStatus = 'DISPONÍVEL';
      } else if (assignmentMode === 'USUARIO_SINCRONIZADO') {
        if (!selectedSyncedUser) {
          setFormError('Selecione um usuário cadastrado da lista.');
          return;
        }
        resolvedEmployeeName = selectedSyncedUser.toUpperCase();
      } else if (assignmentMode === 'REMANEJAR_APARELHO_EM_USO') {
        if (!selectedInUseDeviceObj) {
          setFormError('Selecione qual aparelho já em uso será remanejado/substituído.');
          return;
        }
        if (remanejarTargetHolderMode === 'MESMO_USUARIO') {
          resolvedEmployeeName = selectedInUseDeviceObj.employeeName.toUpperCase();
        } else if (!resolvedEmployeeName) {
          setFormError('Informe o nome do Novo Usuário que assumirá este aparelho.');
          return;
        }
      }
    }

    if (!resolvedEmployeeName) {
      resolvedEmployeeName = 'A DEFINIR';
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = now.toLocaleDateString('pt-BR');

    const finalAssetNumber = hasAssetTag ? assetNumber.trim() : isPersonalDevice ? 'PESSOAL' : 'SEM PT';
    const finalStatus: DeviceStatus = isPersonalDevice
      ? resolvedStatus === 'SEM PATRIMÔNIO'
        ? 'PESSOAL'
        : resolvedStatus
      : !hasAssetTag && resolvedStatus === 'EM USO'
        ? 'SEM PATRIMÔNIO'
        : resolvedStatus;

    const additionalUpdatedDevices: Device[] = [];

    // Caso 1: Cadastro vinculado a Usuário Sincronizado que já tinha celular em uso
    if (
      !editingDevice &&
      assignmentMode === 'USUARIO_SINCRONIZADO' &&
      selectedSyncedUserObj &&
      selectedSyncedUserObj.currentDevices.length > 0 &&
      syncedUserOldDeviceAction === 'ESTOQUE'
    ) {
      for (const oldDev of selectedSyncedUserObj.currentDevices) {
        additionalUpdatedDevices.push({
          ...oldDev,
          previousEmployeeName: resolvedEmployeeName,
          employeeName: '— (Reserva Técnica)',
          sector: 'ESTOQUE',
          status: 'DISPONÍVEL',
          isPersonalDevice: false,
          updatedAt: nowIso,
          occurrences: [
            {
              id: `occ-reman-${Date.now()}-${oldDev.id}`,
              date: dateStr,
              type: 'DEVOLUCAO',
              title: `Movido p/ Estoque Disponível (Novo aparelho ${model.trim()} entregue)`,
              description: `O usuário ${resolvedEmployeeName} recebeu o novo aparelho ${brand} ${model.trim()} (PT: ${finalAssetNumber}) e este aparelho anterior (${oldDev.model}) foi recolhido automaticamente para Celulares Disponíveis em Estoque.`,
              previousUser: resolvedEmployeeName,
              newUser: '— (Reserva Técnica)',
              recordedBy: 'Gestão de Patrimônio',
            },
            ...(oldDev.occurrences || []),
          ],
        });
      }
    }

    // Caso 2: Remanejar substituindo um Celular Já em Uso (para o MESMO usuário ou um NOVO usuário)
    if (!editingDevice && assignmentMode === 'REMANEJAR_APARELHO_EM_USO' && selectedInUseDeviceObj) {
      const oldHolder = selectedInUseDeviceObj.employeeName;
      let oldNextEmployee = '— (Reserva Técnica)';
      let oldNextSector = 'ESTOQUE';
      let oldNextStatus: DeviceStatus = 'DISPONÍVEL';
      let occType: 'DEVOLUCAO' | 'MANUTENÇÃO' | 'TROCA' = 'DEVOLUCAO';
      let occTitle = `Recolhido p/ Estoque (Substituído pelo novo ${model.trim()} PT ${finalAssetNumber})`;

      if (remanejarOldDeviceFate === 'MANUTENCAO') {
        oldNextEmployee = oldHolder;
        oldNextSector = selectedInUseDeviceObj.sector;
        oldNextStatus = 'MANUTENÇÃO';
        occType = 'MANUTENÇÃO';
        occTitle = `Enviado p/ Manutenção (Substituído pelo ${model.trim()} PT ${finalAssetNumber})`;
      } else if (remanejarOldDeviceFate === 'REPASSAR_OUTRO_USUARIO' && remanejarOldDeviceNextUser.trim()) {
        oldNextEmployee = remanejarOldDeviceNextUser.trim().toUpperCase();
        oldNextSector = selectedInUseDeviceObj.sector;
        oldNextStatus = 'EM USO';
        occType = 'TROCA';
        occTitle = `Remanejado de ${oldHolder} para ${oldNextEmployee}`;
      }

      additionalUpdatedDevices.push({
        ...selectedInUseDeviceObj,
        previousEmployeeName: oldHolder,
        employeeName: oldNextEmployee,
        sector: oldNextSector,
        status: oldNextStatus,
        isPersonalDevice: false,
        updatedAt: nowIso,
        occurrences: [
          {
            id: `occ-reman-inuse-${Date.now()}`,
            date: dateStr,
            type: occType,
            title: occTitle,
            description: `Remanejamento sincronizado no cadastro do aparelho ${brand} ${model.trim()} (PT: ${finalAssetNumber}) alocado para ${resolvedEmployeeName}.`,
            previousUser: oldHolder,
            newUser: oldNextEmployee,
            recordedBy: 'Gestão de Patrimônio',
          },
          ...(selectedInUseDeviceObj.occurrences || []),
        ],
      });
    }

    const deviceData: Device = {
      id: editingDevice ? editingDevice.id : `dev-${Date.now()}`,
      store: store.toUpperCase(),
      assetNumber: finalAssetNumber,
      hasAssetTag: hasAssetTag,
      employeeName: resolvedEmployeeName,
      previousEmployeeName: previousEmployeeName.trim().toUpperCase() || '',
      hasVpn,
      isPersonalDevice: Boolean(isPersonalDevice),
      brand: brand.toUpperCase(),
      model: model.trim(),
      sector: resolvedSector,
      acquisitionDate: acquisitionDate.trim() || '?',
      status: finalStatus,
      phoneNumber: phoneNumber.trim(),
      carrier: carrier.trim(),
      imei1: imei1.trim(),
      condition,
      accessories: selectedAccessories,
      signedTerms: editingDevice?.signedTerms || [],
      notes: notes.trim(),
      occurrences: editingDevice
        ? editingDevice.occurrences
        : [
            {
              id: `occ-cad-${Date.now()}`,
              date: dateStr,
              type: 'ENTREGA',
              title:
                assignmentMode === 'GUARDAR_ESTOQUE'
                  ? 'Entrada em Estoque (Disponível)'
                  : assignmentMode === 'REMANEJAR_APARELHO_EM_USO' && selectedInUseDeviceObj
                    ? `Entrega com Remanejamento (Substituiu ${selectedInUseDeviceObj.model} PT ${selectedInUseDeviceObj.assetNumber})`
                    : 'Cadastro e Alocação do Aparelho',
              description: `Cadastrado na unidade ${store} para ${resolvedEmployeeName} (${resolvedSector}).`,
              recordedBy: 'Gestor',
            },
          ],
      createdAt: editingDevice ? editingDevice.createdAt : nowIso,
      updatedAt: nowIso,
    };

    onSave(deviceData, additionalUpdatedDevices.length > 0 ? additionalUpdatedDevices : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Amilco Black & Red */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {editingDevice ? 'Editar Cadastro de Aparelho' : 'Cadastrar Novo Celular & Sincronizar Usuário'}
              </h2>
              <p className="text-xs text-zinc-300">
                Amilco Home Center · Cadastre um novo usuário, selecione um existente ou remaneje um aparelho em uso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
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
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700">N° do Patrimônio</label>
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
                    <option key={b} value={b}>
                      {b}
                    </option>
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
                  placeholder="Ex: A55 - 128GB, A54 - 128GB"
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
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold focus:ring-2 focus:ring-red-600"
                >
                  <option value="BOM">BOM (Em uso regular)</option>
                  <option value="NOVO">NOVO (Na caixa)</option>
                  <option value="TELA TRINCADA">🔨 TELA TRINCADA / QUEBRADA</option>
                  <option value="COM AVARIAS">⚠️ COM AVARIAS / MARCAS DE USO</option>
                  <option value="EM REPARO">🛠️ EM REPARO / DEFEITO</option>
                  <option value="EXTRAVIADO">EXTRAVIADO / PERDIDO</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Alocação Sincronizada de Usuário ou Remanejamento */}
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-3.5">
            <h3 className="font-bold text-red-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-red-600" />
              <span>3. Alocação do Usuário ou Remanejamento de Aparelho em Uso</span>
            </h3>

            {/* Se for novo cadastro, mostra as 4 opções pedidas */}
            {!editingDevice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('NOVO_USUARIO');
                    setStatus('EM USO');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    assignmentMode === 'NOVO_USUARIO'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-red-300'
                  }`}
                >
                  <UserPlus className={`w-4 h-4 shrink-0 ${assignmentMode === 'NOVO_USUARIO' ? 'text-white' : 'text-red-600'}`} />
                  <div>
                    <span className="font-bold block text-[11px]">1. Cadastrar Novo Usuário</span>
                    <span className={`text-[10px] block ${assignmentMode === 'NOVO_USUARIO' ? 'text-red-100' : 'text-zinc-500'}`}>
                      Digitar um novo colaborador do zero
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('USUARIO_SINCRONIZADO');
                    setStatus('EM USO');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    assignmentMode === 'USUARIO_SINCRONIZADO'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 shrink-0 ${assignmentMode === 'USUARIO_SINCRONIZADO' ? 'text-red-500' : 'text-zinc-700'}`} />
                  <div>
                    <span className="font-bold block text-[11px]">
                      2. Usuário Já Cadastrado ({synchronizedUsers.length})
                    </span>
                    <span className={`text-[10px] block ${assignmentMode === 'USUARIO_SINCRONIZADO' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Selecionar da lista sincronizada
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('REMANEJAR_APARELHO_EM_USO');
                    setStatus('EM USO');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    assignmentMode === 'REMANEJAR_APARELHO_EM_USO'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-amber-400'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${assignmentMode === 'REMANEJAR_APARELHO_EM_USO' ? 'text-white' : 'text-amber-600'}`} />
                  <div>
                    <span className="font-bold block text-[11px]">
                      3. Remanejar Celular Já em Uso
                    </span>
                    <span className={`text-[10px] block ${assignmentMode === 'REMANEJAR_APARELHO_EM_USO' ? 'text-amber-100' : 'text-zinc-500'}`}>
                      Substituir p/ o MESMO ou NOVO usuário
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('GUARDAR_ESTOQUE');
                    setStatus('DISPONÍVEL');
                    setSector('ESTOQUE');
                    setEmployeeName('— (Reserva Técnica)');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    assignmentMode === 'GUARDAR_ESTOQUE'
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-emerald-400'
                  }`}
                >
                  <Package className={`w-4 h-4 shrink-0 ${assignmentMode === 'GUARDAR_ESTOQUE' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                  <div>
                    <span className="font-bold block text-[11px]">
                      4. Deixar Disponível em Estoque
                    </span>
                    <span className={`text-[10px] block ${assignmentMode === 'GUARDAR_ESTOQUE' ? 'text-emerald-100' : 'text-zinc-500'}`}>
                      Fica na aba Celulares Disponíveis
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* CONTEÚDO DA OPÇÃO 2: SELECIONAR USUÁRIO JÁ CADASTRADO */}
            {!editingDevice && assignmentMode === 'USUARIO_SINCRONIZADO' && (
              <div className="p-3.5 bg-white rounded-xl border border-zinc-300 space-y-3">
                <div>
                  <label className="block font-bold text-zinc-900 mb-1">
                    Escolha o Usuário Sincronizado <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={selectedSyncedUser}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSyncedUser(val);
                      setEmployeeName(val);
                      const found = synchronizedUsers.find((u) => u.name === val);
                      if (found) {
                        if (found.sector && found.sector !== 'ESTOQUE') setSector(found.sector);
                        if (found.store) setStore(found.store);
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">— Selecione na lista de usuários cadastrados ({synchronizedUsers.length}) —</option>
                    {synchronizedUsers.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name} — {u.sector} ({u.store.replace('LOJA ', '')}){' '}
                        {u.currentDevices.length > 0
                          ? `[Em uso: ${u.currentDevices.map((d) => `${d.model} PT ${d.assetNumber}`).join(', ')}]`
                          : '[Sem aparelho atual]'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSyncedUserObj && selectedSyncedUserObj.currentDevices.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-1.5">
                    <span className="font-bold text-amber-950 block">
                      ⚡ Sincronismo: {selectedSyncedUserObj.name} já possui{' '}
                      {selectedSyncedUserObj.currentDevices.map((d) => `${d.model} (PT ${d.assetNumber})`).join(', ')}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-950">
                        <input
                          type="radio"
                          checked={syncedUserOldDeviceAction === 'ESTOQUE'}
                          onChange={() => setSyncedUserOldDeviceAction('ESTOQUE')}
                          className="text-red-600"
                        />
                        <span>Mover celular antigo dele para Disponíveis (Estoque)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-950">
                        <input
                          type="radio"
                          checked={syncedUserOldDeviceAction === 'MANTER_DOIS'}
                          onChange={() => setSyncedUserOldDeviceAction('MANTER_DOIS')}
                          className="text-red-600"
                        />
                        <span>Manter os dois aparelhos com ele</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA OPÇÃO 3: REMANEJAR UM APARELHO JÁ EM USO (PARA O MESMO OU NOVO USUÁRIO) */}
            {!editingDevice && assignmentMode === 'REMANEJAR_APARELHO_EM_USO' && (
              <div className="p-3.5 bg-white rounded-xl border border-amber-300 space-y-3">
                <div>
                  <label className="block font-bold text-zinc-900 mb-1">
                    1º · Qual celular já em uso será substituído/remanejado? <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={replacedInUseDeviceId}
                    onChange={(e) => handleSelectReplacedDevice(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">— Selecione o aparelho atualmente em uso —</option>
                    {inUseDevices.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.employeeName} — {dev.brand} {dev.model} (PT: {dev.hasAssetTag ? dev.assetNumber : 'SEM PT'}) · {dev.sector}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInUseDeviceObj && (
                  <>
                    <div>
                      <label className="block font-bold text-zinc-900 mb-1.5">
                        2º · Quem vai ficar com este celular novo ({model || 'Novo Aparelho'})?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRemanejarTargetHolderMode('MESMO_USUARIO');
                            setEmployeeName(selectedInUseDeviceObj.employeeName);
                          }}
                          className={`p-2.5 rounded-lg border text-left font-bold cursor-pointer transition-all ${
                            remanejarTargetHolderMode === 'MESMO_USUARIO'
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          ✓ O MESMO Usuário ({selectedInUseDeviceObj.employeeName})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRemanejarTargetHolderMode('NOVO_USUARIO');
                            setEmployeeName('');
                          }}
                          className={`p-2.5 rounded-lg border text-left font-bold cursor-pointer transition-all ${
                            remanejarTargetHolderMode === 'NOVO_USUARIO'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          + Um NOVO Usuário (ou outro colaborador)
                        </button>
                      </div>
                    </div>

                    {remanejarTargetHolderMode === 'NOVO_USUARIO' && (
                      <div>
                        <label className="block font-bold text-zinc-800 mb-1">
                          Informe o Nome do Usuário que ficará com o aparelho novo: <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          list="synced-users-datalist"
                          placeholder="Digite um novo nome ou escolha da lista..."
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold uppercase focus:ring-2 focus:ring-red-600"
                        />
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <label className="block font-bold text-amber-950">
                        3º · O que acontecerá com o celular antigo ({selectedInUseDeviceObj.model} · PT {selectedInUseDeviceObj.assetNumber})?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setRemanejarOldDeviceFate('ESTOQUE')}
                          className={`p-2 rounded-lg border text-left font-bold text-[11px] cursor-pointer ${
                            remanejarOldDeviceFate === 'ESTOQUE'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-zinc-700 border-zinc-200'
                          }`}
                        >
                          📦 Ir p/ Disponíveis (Estoque)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemanejarOldDeviceFate('REPASSAR_OUTRO_USUARIO')}
                          className={`p-2 rounded-lg border text-left font-bold text-[11px] cursor-pointer ${
                            remanejarOldDeviceFate === 'REPASSAR_OUTRO_USUARIO'
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-700 border-zinc-200'
                          }`}
                        >
                          🔄 Repassar p/ Outro Usuário
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemanejarOldDeviceFate('MANUTENCAO')}
                          className={`p-2 rounded-lg border text-left font-bold text-[11px] cursor-pointer ${
                            remanejarOldDeviceFate === 'MANUTENCAO'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-zinc-700 border-zinc-200'
                          }`}
                        >
                          🔧 Enviar p/ Manutenção
                        </button>
                      </div>

                      {remanejarOldDeviceFate === 'REPASSAR_OUTRO_USUARIO' && (
                        <div className="pt-1">
                          <label className="block font-semibold text-amber-950 mb-1">
                            Com quem vai ficar o aparelho antigo ({selectedInUseDeviceObj.model})?
                          </label>
                          <input
                            type="text"
                            required
                            list="synced-users-datalist"
                            value={remanejarOldDeviceNextUser}
                            onChange={(e) => setRemanejarOldDeviceNextUser(e.target.value)}
                            placeholder="Digite o nome ou escolha um usuário cadastrado..."
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-zinc-900 font-bold uppercase"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Datalist global com todos os usuários sincronizados para autocompletar */}
            <datalist id="synced-users-datalist">
              {synchronizedUsers.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.sector} · {u.store}
                </option>
              ))}
            </datalist>

            {/* Campos padrão de Colaborador e Anterior (quando em Novo Usuário ou Edição) */}
            {(editingDevice || assignmentMode === 'NOVO_USUARIO') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">
                    Colaborador Responsável <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="synced-users-datalist"
                    placeholder="Ex: VINICIUS, BRUNA, JOÃO..."
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold uppercase focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">
                    Usuário Anterior (Se houve troca):
                  </label>
                  <input
                    type="text"
                    list="synced-users-datalist"
                    placeholder="Ex: Usuário anterior ou Devolvido"
                    value={previousEmployeeName}
                    onChange={(e) => setPreviousEmployeeName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 uppercase font-medium"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Setor</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold"
                >
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
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
                  <option value="PESSOAL">CELULAR PESSOAL</option>
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

            {/* Toggles: VPN e Celular Pessoal do Colaborador */}
            <div className="pt-2 border-t border-red-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-900 bg-white/80 p-2.5 rounded-lg border border-red-200 select-none hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={hasVpn}
                  onChange={(e) => setHasVpn(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs">
                  <Shield className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Possui Acesso VPN Corporativa</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 bg-purple-50 p-2.5 rounded-lg border border-purple-300 select-none hover:bg-purple-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={isPersonalDevice}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsPersonalDevice(checked);
                    if (checked) {
                      setStatus('PESSOAL');
                      setHasAssetTag(false);
                      setAssetNumber('PESSOAL');
                    }
                  }}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>Celular Pessoal do Colaborador</span>
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
              {Array.from(new Set([...COMMON_ACCESSORIES, ...selectedAccessories])).map((acc) => {
                const isSelected = selectedAccessories.includes(acc);
                return (
                  <button
                    type="button"
                    key={acc}
                    onClick={() => toggleAccessory(acc)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-zinc-900 text-xs">
                Descrição de Avarias / Defeito e Observações da Ficha
              </label>
              <span className="text-[10px] text-red-600 font-semibold">Exibido no Relatório PDF</span>
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Película trincada, bateria boa, observações de entrega..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-medium focus:ring-2 focus:ring-red-600 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingDevice ? 'Salvar Alterações' : 'Cadastrar e Sincronizar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
