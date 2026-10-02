import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ClipboardCheck, 
  Smartphone, 
  Battery, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  History, 
  Plus, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Sparkles,
  Plug
} from 'lucide-react';
import { Device, DeviceAuditInfo, DeviceCondition, DeviceOccurrence } from '../types/device';

interface DeviceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onSaveAudit: (updatedDevice: Device) => void;
  currentAuditorName?: string;
}

const COMMON_ACCESSORIES = [
  'Carregador Original',
  'Cabo USB-C',
  'Capa Protetora',
  'Película de Vidro',
  'Carregador Veicular',
  'Fone de Ouvido'
];

export const DeviceAuditModal: React.FC<DeviceAuditModalProps> = ({
  isOpen,
  onClose,
  device,
  onSaveAudit,
  currentAuditorName = 'Mateus (Auditoria T.I.)'
}) => {
  if (!isOpen || !device) return null;

  // Expected accessories: union of device.accessories or default set
  const baseAccessories = (device.accessories && device.accessories.length > 0)
    ? device.accessories
    : ['Carregador Original', 'Cabo USB-C', 'Capa Protetora', 'Película de Vidro'];

  const [expectedItems, setExpectedItems] = useState<string[]>(baseAccessories);
  const [verifiedItems, setVerifiedItems] = useState<string[]>([]);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [screenOk, setScreenOk] = useState<boolean>(true);
  const [batteryOk, setBatteryOk] = useState<boolean>(true);
  const [peliculaStatus, setPeliculaStatus] = useState<'COM_PELICULA_OK' | 'PELICULA_TRINCADA' | 'SEM_PELICULA'>('COM_PELICULA_OK');
  const [condition, setCondition] = useState<DeviceCondition>(device.condition || 'BOM');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [auditorName, setAuditorName] = useState<string>(currentAuditorName);
  const [newItemText, setNewItemText] = useState<string>('');

  // Initialize from existing auditInfo or defaults
  useEffect(() => {
    if (!device) return;

    const initialExpected = (device.accessories && device.accessories.length > 0)
      ? Array.from(new Set([...device.accessories]))
      : ['Carregador Original', 'Cabo USB-C', 'Capa Protetora', 'Película de Vidro'];

    setExpectedItems(initialExpected);

    if (device.auditInfo) {
      setVerifiedItems(device.auditInfo.verifiedAccessories || []);
      setMissingItems(device.auditInfo.missingAccessories || []);
      setScreenOk(device.auditInfo.screenOk !== false);
      setBatteryOk(device.auditInfo.batteryOk !== false);
      setPeliculaStatus(device.auditInfo.peliculaStatus || (
        device.auditInfo.missingAccessories?.some(i => i.toLowerCase().includes('película') || i.toLowerCase().includes('pelicula'))
          ? 'SEM_PELICULA'
          : 'COM_PELICULA_OK'
      ));
      setCondition(device.auditInfo.conditionVerified || device.condition || 'BOM');
      setAuditNotes(device.auditInfo.auditNotes || '');
      setAuditorName(device.auditInfo.auditedBy || currentAuditorName);
    } else {
      // Default: If no audit yet, start with verified items equal to expected
      setVerifiedItems([...initialExpected]);
      setMissingItems([]);
      setScreenOk(
        !((device.condition || '').toUpperCase().includes('TRINC') || 
          (device.condition || '').toUpperCase().includes('QUEBRAD') ||
          (device.notes || '').toLowerCase().includes('tela'))
      );
      setBatteryOk(
        !((device.notes || '').toLowerCase().includes('bateria') || 
          (device.notes || '').toLowerCase().includes('viciad'))
      );
      setPeliculaStatus(
        (device.notes || '').toLowerCase().includes('sem pelicula') || (device.notes || '').toLowerCase().includes('sem película')
          ? 'SEM_PELICULA'
          : (device.notes || '').toLowerCase().includes('pelicula trincad') || (device.notes || '').toLowerCase().includes('película trincad')
            ? 'PELICULA_TRINCADA'
            : 'COM_PELICULA_OK'
      );
      setCondition(device.condition || 'BOM');
      setAuditNotes('');
      setAuditorName(currentAuditorName);
    }
  }, [device, currentAuditorName]);

  const toggleItemStatus = (item: string, targetStatus: 'verified' | 'missing') => {
    if (targetStatus === 'verified') {
      setVerifiedItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setMissingItems((prev) => prev.filter((i) => i !== item));
    } else {
      setMissingItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setVerifiedItems((prev) => prev.filter((i) => i !== item));
    }
  };

  const handlePeliculaChange = (newStatus: 'COM_PELICULA_OK' | 'PELICULA_TRINCADA' | 'SEM_PELICULA') => {
    setPeliculaStatus(newStatus);
    const peliculaItemName = expectedItems.find(i => i.toLowerCase().includes('película') || i.toLowerCase().includes('pelicula')) || 'Película de Vidro';

    if (newStatus === 'SEM_PELICULA') {
      // Marca como faltando nos acessórios
      setMissingItems((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setVerifiedItems((prev) => prev.filter((i) => i !== peliculaItemName));
    } else {
      // Película presente (ou trincada precisando de troca)
      setVerifiedItems((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setMissingItems((prev) => prev.filter((i) => i !== peliculaItemName));
      if (newStatus === 'PELICULA_TRINCADA') {
        setAuditNotes((prev) => {
          if (prev.includes('Película trincada')) return prev;
          return prev ? `${prev}. Película trincada (necessita troca, tela intacta).` : 'Película de proteção trincada (necessita troca, tela intacta).';
        });
      }
    }
  };

  const markAllAsVerified = () => {
    setVerifiedItems([...expectedItems]);
    setMissingItems([]);
    setPeliculaStatus('COM_PELICULA_OK');
  };

  const handleAddNewItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    if (!expectedItems.includes(trimmed)) {
      setExpectedItems([...expectedItems, trimmed]);
      setVerifiedItems([...verifiedItems, trimmed]);
    }
    setNewItemText('');
  };

  const handleSave = (forcedStatus?: 'OK' | 'COM_PENDENCIA') => {
    const isOk = forcedStatus 
      ? forcedStatus === 'OK' 
      : (missingItems.length === 0 && screenOk && batteryOk && peliculaStatus !== 'SEM_PELICULA' && condition !== 'TELA TRINCADA' && condition !== 'EM REPARO');

    const nowStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const auditInfo: DeviceAuditInfo = {
      status: isOk ? 'OK' : 'COM_PENDENCIA',
      lastAuditedAt: nowStr,
      auditedBy: auditorName.trim() || 'Auditor T.I.',
      verifiedAccessories: verifiedItems,
      missingAccessories: missingItems,
      screenOk,
      batteryOk,
      peliculaStatus,
      chargerOk: verifiedItems.some((i) => i.toLowerCase().includes('carregador')),
      conditionVerified: condition,
      auditNotes: auditNotes.trim()
    };

    // Build occurrence history description
    const statusText = isOk ? '100% CONFORME (Tudo OK)' : `PENDÊNCIA APONTADA (Faltando ${missingItems.length} item(ns))`;
    const missingDesc = missingItems.length > 0 ? `\nItens Ausentes: ${missingItems.join(', ')}.` : '';
    const peliculaDesc = peliculaStatus === 'COM_PELICULA_OK' ? 'Com Película Íntegra' : peliculaStatus === 'PELICULA_TRINCADA' ? 'Película Trincada' : 'Sem Película';
    const physicalDesc = `\nEstado: ${condition} | Tela: ${screenOk ? 'OK' : 'Trincada/Defeito'} | Película: ${peliculaDesc} | Bateria: ${batteryOk ? 'OK' : 'Defeito/Viciada'}.`;
    const notesDesc = auditNotes.trim() ? `\nObs: "${auditNotes.trim()}"` : '';

    const newOccurrence: DeviceOccurrence = {
      id: `occ-audit-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      type: 'AUDITORIA',
      title: `CHECKUP DE AUDITORIA: ${statusText}`,
      description: `Auditoria presencial realizada por ${auditorName.trim() || 'Auditor T.I.'}.${missingDesc}${physicalDesc}${notesDesc}`,
      recordedBy: auditorName.trim() || 'Auditor T.I.'
    };

    // Update condition on device if changed
    const updatedDevice: Device = {
      ...device,
      condition,
      auditInfo,
      occurrences: [newOccurrence, ...(device.occurrences || [])],
      updatedAt: new Date().toISOString()
    };

    onSaveAudit(updatedDevice);
    onClose();
  };

  const isAuditCurrentlyOk = missingItems.length === 0 && screenOk && batteryOk;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between shrink-0 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Checkup de Auditoria & Conferência
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                  Auditoria Presencial
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verifique se o celular está tudo OK e confira os itens entregues ao colaborador
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

        {/* Device Quick Info Banner */}
        <div className="bg-zinc-100 px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-zinc-500" />
            <span className="font-bold text-zinc-950 uppercase">{device.brand} {device.model}</span>
            <span className="text-zinc-400">·</span>
            <span className="font-semibold text-zinc-700">{device.store} ({device.sector})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Colaborador:</span>
            <strong className="text-zinc-950 uppercase bg-white px-2 py-0.5 rounded border border-zinc-300">
              {device.employeeName}
            </strong>
            <span className="font-mono text-zinc-600">
              {device.isPersonalDevice ? '📱 PESSOAL' : device.hasAssetTag ? `PT: ${device.assetNumber}` : 'SEM PT'}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-900 leading-relaxed font-sans">

          {/* Status Geral Atual */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isAuditCurrentlyOk
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}>
            <div className="flex items-center gap-2.5">
              {isAuditCurrentlyOk ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-xs">
                  {isAuditCurrentlyOk ? 'Diagnóstico: 100% Conforme (Tudo OK)' : 'Diagnóstico: Pendência Constatada'}
                </h4>
                <p className="text-[11px] mt-0.5">
                  {isAuditCurrentlyOk 
                    ? 'Todos os itens entregues estão presentes e o aparelho está íntegro.' 
                    : `Atenção: Há ${missingItems.length} item(ns) faltando ou avaria física constatada.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={markAllAsVerified}
              className="px-3 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 rounded-lg text-zinc-800 font-bold text-[11px] shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              ✓ Marcar Tudo Presente
            </button>
          </div>

          {/* SEÇÃO 1: CONFERÊNCIA DOS ITENS ENTREGUES */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span className="font-bold text-zinc-950 uppercase tracking-wide">
                  Conferência de Acessórios & Itens Entregues
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">
                {verifiedItems.length} de {expectedItems.length} presentes
              </span>
            </div>

            <p className="text-[11px] text-zinc-600">
              Verifique fisicamente se o colaborador apresentou cada item que consta no termo/ficha:
            </p>

            {/* Lista de Itens para Conferência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {expectedItems.map((item) => {
                const isVerified = verifiedItems.includes(item);
                const isMissing = missingItems.includes(item);

                return (
                  <div
                    key={item}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isMissing
                        ? 'bg-red-50/80 border-red-300 text-red-950'
                        : isVerified
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Plug className={`w-3.5 h-3.5 shrink-0 ${isMissing ? 'text-red-600' : isVerified ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <span className="font-semibold text-xs truncate">{item}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item, 'verified')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isVerified
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Marcar como presente e conferido"
                      >
                        ✓ Presente
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item, 'missing')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isMissing
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Marcar como ausente ou faltante"
                      >
                        ✕ Falta
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adicionar item extra encontrado */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Adicionar outro item verificado (ex: Fone, Adaptador...)"
                className="flex-1 bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {/* Alerta de Itens Faltando */}
            {missingItems.length > 0 && (
              <div className="p-3 bg-red-100/80 border border-red-300 rounded-xl text-red-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold uppercase text-[11px]">
                    Itens Apontados como Faltando:
                  </strong>
                  <span className="font-semibold">{missingItems.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: ESTADO FÍSICO, TELA, PELÍCULA E BATERIA */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <span className="w-5 h-5 rounded bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <span className="font-bold text-zinc-950 uppercase tracking-wide">
                Condição Física, Tela, Película & Bateria
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Tela / Vidro */}
              <div className={`p-3 rounded-xl border ${screenOk ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-300'}`}>
                <span className="font-bold text-zinc-900 block mb-1.5 text-xs">Estado da Tela / Vidro:</span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScreenOk(true)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      screenOk ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    ✓ Íntegra / Sem Trinca
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenOk(false);
                      setCondition('TELA TRINCADA');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      !screenOk ? 'bg-red-600 text-white border-red-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    🔨 Trincada / Quebrada
                  </button>
                </div>
              </div>

              {/* 2. Película Protetora (NOVO) */}
              <div className={`p-3 rounded-xl border ${
                peliculaStatus === 'COM_PELICULA_OK'
                  ? 'bg-white border-zinc-200'
                  : peliculaStatus === 'PELICULA_TRINCADA'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-900 text-xs">Película de Proteção:</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    peliculaStatus === 'COM_PELICULA_OK' 
                      ? 'bg-emerald-100 text-emerald-900' 
                      : peliculaStatus === 'PELICULA_TRINCADA'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-red-100 text-red-900'
                  }`}>
                    {peliculaStatus === 'COM_PELICULA_OK' ? 'OK' : peliculaStatus === 'PELICULA_TRINCADA' ? 'Trocar' : 'Falta'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePeliculaChange('COM_PELICULA_OK')}
                    className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      peliculaStatus === 'COM_PELICULA_OK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    ✓ Com Película (Íntegra)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePeliculaChange('PELICULA_TRINCADA')}
                    className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      peliculaStatus === 'PELICULA_TRINCADA'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title="A película está trincada/riscada, mas a tela original do aparelho está boa"
                  >
                    ⚠️ Película Trincada
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePeliculaChange('SEM_PELICULA')}
                    className={`py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      peliculaStatus === 'SEM_PELICULA'
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title="Aparelho está sem película de proteção"
                  >
                    ❌ Sem Película (Falta)
                  </button>
                </div>
              </div>

              {/* 3. Bateria & Conector */}
              <div className={`p-3 rounded-xl border ${batteryOk ? 'bg-white border-zinc-200' : 'bg-orange-50 border-orange-300'}`}>
                <span className="font-bold text-zinc-900 block mb-1.5 text-xs">Bateria & Conector:</span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBatteryOk(true)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      batteryOk ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    🔋 Normal / Segura Carga
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatteryOk(false)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      !batteryOk ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    ⚠️ Descarregando / Folga
                  </button>
                </div>
              </div>
            </div>

            {/* Conservação Geral */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1.5">
                Estado Geral de Conservação no Checkup:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['BOM', 'NOVO', 'COM AVARIAS', 'TELA TRINCADA', 'EM REPARO'] as DeviceCondition[]).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      condition === cond
                        ? cond === 'TELA TRINCADA'
                          ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                          : cond === 'COM AVARIAS'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: AUDITOR E OBSERVAÇÕES */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <span className="w-5 h-5 rounded bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <span className="font-bold text-zinc-950 uppercase tracking-wide">
                Dados da Auditoria & Observações
              </span>
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Nome do Auditor / Responsável pelo Checkup:
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                placeholder="Ex: Mateus (Auditor T.I.)"
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Observações do Checkup / Justificativas:
              </label>

              {/* Botões de texto rápido */}
              <div className="flex flex-wrap gap-1 text-[10px] mb-1.5">
                <button
                  type="button"
                  onClick={() => setAuditNotes('Aparelho e todos os acessórios em perfeito estado.')}
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-950 rounded hover:bg-emerald-200 font-semibold cursor-pointer"
                >
                  + Tudo Perfeito
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePeliculaChange('PELICULA_TRINCADA');
                  }}
                  className="px-2 py-0.5 bg-amber-100 text-amber-950 rounded hover:bg-amber-200 font-semibold cursor-pointer"
                >
                  + Trocar Película
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePeliculaChange('SEM_PELICULA');
                  }}
                  className="px-2 py-0.5 bg-red-100 text-red-950 rounded hover:bg-red-200 font-semibold cursor-pointer"
                >
                  + Sem Película
                </button>
                <button
                  type="button"
                  onClick={() => setAuditNotes((prev) => prev ? `${prev}. Colaborador esqueceu carregador em casa.` : 'Colaborador alegou que esqueceu o carregador original em casa.')}
                  className="px-2 py-0.5 bg-amber-100 text-amber-950 rounded hover:bg-amber-200 font-semibold cursor-pointer"
                >
                  + Esqueceu em Casa
                </button>
                <button
                  type="button"
                  onClick={() => setAuditNotes((prev) => prev ? `${prev}. Carregador original danificado.` : 'Carregador original danificado/avariado.')}
                  className="px-2 py-0.5 bg-red-100 text-red-950 rounded hover:bg-red-200 font-semibold cursor-pointer"
                >
                  + Acessório Danificado
                </button>
                <button
                  type="button"
                  onClick={() => setAuditNotes((prev) => prev ? `${prev}. Capa e película com marcas de uso.` : 'Capa e película com desgaste normal de uso.')}
                  className="px-2 py-0.5 bg-zinc-200 text-zinc-900 rounded hover:bg-zinc-300 font-semibold cursor-pointer"
                >
                  + Desgaste Normal
                </button>
              </div>

              <textarea
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Detalhes adicionais sobre o que foi visto na auditoria presencial..."
                className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-900"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-700 hover:bg-zinc-200 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {missingItems.length > 0 && (
              <button
                type="button"
                onClick={() => handleSave('COM_PENDENCIA')}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Salvar com Pendência ({missingItems.length} faltante)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(missingItems.length === 0 ? 'OK' : 'COM_PENDENCIA')}
              className={`inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                missingItems.length === 0 && screenOk && batteryOk
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {missingItems.length === 0 && screenOk && batteryOk
                  ? 'Concluir Checkup (100% OK)'
                  : 'Registrar Auditoria'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
