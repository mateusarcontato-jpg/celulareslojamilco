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
  const [damagedAccessories, setDamagedAccessories] = useState<string[]>([]);
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
      setDamagedAccessories(device.auditInfo.damagedAccessories || []);
      const initialScreenOk = device.auditInfo.screenOk !== false;
      setScreenOk(initialScreenOk);
      setBatteryOk(device.auditInfo.batteryOk !== false);
      const initialPelicula = device.auditInfo.peliculaStatus || (
        device.auditInfo.missingAccessories?.some(i => i.toLowerCase().includes('película') || i.toLowerCase().includes('pelicula'))
          ? 'SEM_PELICULA'
          : device.auditInfo.damagedAccessories?.some(i => i.toLowerCase().includes('película') || i.toLowerCase().includes('pelicula'))
            ? 'PELICULA_TRINCADA'
            : 'COM_PELICULA_OK'
      );
      setPeliculaStatus(initialPelicula);

      // Se a tela original estiver íntegra (initialScreenOk === true), a condição física NUNCA deve ser TELA TRINCADA
      const baseCond = device.auditInfo.conditionVerified || device.condition || 'BOM';
      setCondition(initialScreenOk && baseCond === 'TELA TRINCADA' ? 'BOM' : baseCond);
      setAuditNotes(device.auditInfo.auditNotes || '');
      setAuditorName(device.auditInfo.auditedBy || currentAuditorName);
    } else {
      // Default: If no audit yet, start with verified items equal to expected
      setVerifiedItems([...initialExpected]);
      setMissingItems([]);
      setDamagedAccessories([]);
      
      // Separar completamente tela quebrada de película trincada
      const notesLower = (device.notes || '').toLowerCase();
      const occText = (device.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();

      const isPeliculaMention = notesLower.includes('pelicula trincad') || notesLower.includes('película trincad') ||
        occText.includes('película trincad') || occText.includes('pelicula trincad');
      const hasExplicitScreenDamage = notesLower.includes('tela quebrada') || notesLower.includes('tela trincada') || notesLower.includes('display quebrado') ||
        occText.includes('tela quebrada') || occText.includes('tela trincada') || occText.includes('display quebrado');

      // Se for apenas menção a película e não tiver dano real comprovado na tela
      const isActualScreenBroken = hasExplicitScreenDamage || (device.condition === 'TELA TRINCADA' && !isPeliculaMention);

      setScreenOk(!isActualScreenBroken);
      setBatteryOk(
        !(notesLower.includes('bateria') || notesLower.includes('viciad'))
      );
      setPeliculaStatus(
        notesLower.includes('sem pelicula') || notesLower.includes('sem película')
          ? 'SEM_PELICULA'
          : isPeliculaMention
            ? 'PELICULA_TRINCADA'
            : 'COM_PELICULA_OK'
      );
      setCondition(isActualScreenBroken ? 'TELA TRINCADA' : (device.condition === 'TELA TRINCADA' ? 'BOM' : (device.condition || 'BOM')));
      setAuditNotes('');
      setAuditorName(currentAuditorName);
    }
  }, [device, currentAuditorName]);

  const toggleItemStatus = (item: string, targetStatus: 'verified' | 'missing' | 'damaged') => {
    const isPelicula = item.toLowerCase().includes('película') || item.toLowerCase().includes('pelicula');

    if (targetStatus === 'verified') {
      setVerifiedItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setMissingItems((prev) => prev.filter((i) => i !== item));
      setDamagedAccessories((prev) => prev.filter((i) => i !== item));
      if (isPelicula) {
        setPeliculaStatus('COM_PELICULA_OK');
      }
    } else if (targetStatus === 'missing') {
      setMissingItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setVerifiedItems((prev) => prev.filter((i) => i !== item));
      setDamagedAccessories((prev) => prev.filter((i) => i !== item));
      if (isPelicula) {
        setPeliculaStatus('SEM_PELICULA');
      }
    } else if (targetStatus === 'damaged') {
      setDamagedAccessories((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setVerifiedItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
      setMissingItems((prev) => prev.filter((i) => i !== item));
      if (isPelicula) {
        setPeliculaStatus('PELICULA_TRINCADA');
      }
    }
  };

  const handlePeliculaChange = (newStatus: 'COM_PELICULA_OK' | 'PELICULA_TRINCADA' | 'SEM_PELICULA') => {
    setPeliculaStatus(newStatus);
    const peliculaItemName = expectedItems.find(i => i.toLowerCase().includes('película') || i.toLowerCase().includes('pelicula')) || 'Película de Vidro';

    if (newStatus === 'SEM_PELICULA') {
      setMissingItems((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setVerifiedItems((prev) => prev.filter((i) => i !== peliculaItemName));
      setDamagedAccessories((prev) => prev.filter((i) => i !== peliculaItemName));
    } else if (newStatus === 'PELICULA_TRINCADA') {
      setDamagedAccessories((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setVerifiedItems((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setMissingItems((prev) => prev.filter((i) => i !== peliculaItemName));
      // Película trincada NÃO é tela quebrada: se a tela estiver boa, manter condition como BOM
      if (condition === 'TELA TRINCADA') {
        setCondition('BOM');
      }
      setAuditNotes((prev) => {
        if (prev.includes('Película trincada') || prev.includes('Película de proteção trincada')) return prev;
        return prev 
          ? `${prev}. Película de proteção trincada (a tela do celular está íntegra/intacta).` 
          : 'Película de proteção trincada (a tela original do celular está íntegra/intacta).';
      });
    } else {
      setVerifiedItems((prev) => (prev.includes(peliculaItemName) ? prev : [...prev, peliculaItemName]));
      setMissingItems((prev) => prev.filter((i) => i !== peliculaItemName));
      setDamagedAccessories((prev) => prev.filter((i) => i !== peliculaItemName));
    }
  };

  const markAllAsVerified = () => {
    setVerifiedItems([...expectedItems]);
    setMissingItems([]);
    setDamagedAccessories([]);
    setPeliculaStatus('COM_PELICULA_OK');
    setScreenOk(true);
    setBatteryOk(true);
    if (condition === 'TELA TRINCADA' || condition === 'COM AVARIAS') {
      setCondition('BOM');
    }
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

  // Película trincada ou qualquer acessório danificado FAZ PARTE DA DIVERGÊNCIA!
  const hasDivergence = 
    missingItems.length > 0 || 
    damagedAccessories.length > 0 || 
    peliculaStatus === 'PELICULA_TRINCADA' || 
    peliculaStatus === 'SEM_PELICULA' || 
    !screenOk || 
    !batteryOk || 
    condition === 'TELA TRINCADA' || 
    condition === 'COM AVARIAS' || 
    condition === 'EM REPARO';

  const isAuditCurrentlyOk = !hasDivergence;

  const handleSave = (forcedStatus?: 'OK' | 'COM_PENDENCIA') => {
    const isOk = forcedStatus ? forcedStatus === 'OK' : !hasDivergence;

    // Se a tela original do aparelho estiver íntegra (screenOk === true), a condição NUNCA pode ser 'TELA TRINCADA'
    const finalCondition: DeviceCondition = !screenOk 
      ? 'TELA TRINCADA' 
      : (condition === 'TELA TRINCADA' ? 'BOM' : condition);

    const allDamaged = Array.from(new Set([
      ...damagedAccessories,
      ...(peliculaStatus === 'PELICULA_TRINCADA' ? ['Película de Proteção (Trincada)'] : [])
    ]));

    const nowStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const auditInfo: DeviceAuditInfo = {
      status: isOk ? 'OK' : 'COM_PENDENCIA',
      lastAuditedAt: nowStr,
      auditedBy: auditorName.trim() || 'Auditor T.I.',
      verifiedAccessories: verifiedItems,
      missingAccessories: missingItems,
      damagedAccessories: allDamaged,
      screenOk,
      batteryOk,
      peliculaStatus,
      chargerOk: verifiedItems.some((i) => i.toLowerCase().includes('carregador')),
      conditionVerified: finalCondition,
      auditNotes: auditNotes.trim()
    };

    // Build occurrence history description com distinção inequívoca
    let occurrenceTitle = 'CHECKUP DE AUDITORIA: 100% CONFORME (Tudo OK)';
    if (!isOk) {
      if (!screenOk && peliculaStatus === 'PELICULA_TRINCADA') {
        occurrenceTitle = 'CHECKUP: 🔨 TELA DO APARELHO QUEBRADA & ⚠️ PELÍCULA TRINCADA';
      } else if (!screenOk) {
        occurrenceTitle = 'CHECKUP: 🔨 TELA DO APARELHO QUEBRADA / TRINCADA';
      } else if (!batteryOk && peliculaStatus === 'PELICULA_TRINCADA') {
        occurrenceTitle = 'CHECKUP: 🔋 BATERIA INCHADA / DANIFICADA & ⚠️ PELÍCULA TRINCADA';
      } else if (!batteryOk) {
        occurrenceTitle = 'CHECKUP: 🔋 BATERIA INCHADA / DANIFICADA (Problema de Bateria)';
      } else if (peliculaStatus === 'PELICULA_TRINCADA') {
        occurrenceTitle = 'CHECKUP: ⚠️ PELÍCULA DE PROTEÇÃO TRINCADA (Tela Original Íntegra)';
      } else if (missingItems.length > 0) {
        occurrenceTitle = `CHECKUP: ❌ ITENS FALTANDO (${missingItems.join(', ')})`;
      } else if (allDamaged.length > 0) {
        occurrenceTitle = `CHECKUP: ⚠️ ACESSÓRIO DANIFICADO (${allDamaged.join(', ')})`;
      } else {
        occurrenceTitle = 'CHECKUP: ⚠️ DIVERGÊNCIA APONTADA';
      }
    }

    const missingDesc = missingItems.length > 0 ? `\nItens Ausentes: ${missingItems.join(', ')}.` : '';
    const damagedDesc = allDamaged.length > 0 ? `\nAcessórios Danificados: ${allDamaged.join(', ')}.` : '';
    const telaDesc = screenOk 
      ? 'Tela Original do Aparelho: ÍNTEGRA / SEM TRINCA' 
      : '🚨 TELA DO APARELHO QUEBRADA/TRINCADA (Dano no Display/Vidro)';
    const peliculaDesc = peliculaStatus === 'COM_PELICULA_OK' 
      ? 'Película: Íntegra e Aplicada' 
      : peliculaStatus === 'PELICULA_TRINCADA' 
        ? '⚠️ PELÍCULA DE PROTEÇÃO TRINCADA (Necessita substituição · Tela do aparelho está íntegra)' 
        : '❌ SEM PELÍCULA (Aparelho desprotegido)';

    const physicalDesc = `\nEstado Geral: ${finalCondition} | ${telaDesc} | ${peliculaDesc} | Bateria: ${batteryOk ? 'OK' : 'Defeito/Viciada'}.`;
    const notesDesc = auditNotes.trim() ? `\nObs: "${auditNotes.trim()}"` : '';

    const newOccurrence: DeviceOccurrence = {
      id: `occ-audit-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      type: 'AUDITORIA',
      title: occurrenceTitle,
      description: `Auditoria presencial realizada por ${auditorName.trim() || 'Auditor T.I.'}.${missingDesc}${damagedDesc}${physicalDesc}${notesDesc}`,
      recordedBy: auditorName.trim() || 'Auditor T.I.'
    };

    // Update condition on device if changed
    const updatedDevice: Device = {
      ...device,
      condition: finalCondition,
      auditInfo,
      occurrences: [newOccurrence, ...(device.occurrences || [])],
      updatedAt: new Date().toISOString()
    };

    onSaveAudit(updatedDevice);
    onClose();
  };

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

          {/* Status Geral Atual / Diagnóstico */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isAuditCurrentlyOk
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}>
            <div className="flex items-start gap-2.5">
              {isAuditCurrentlyOk ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-xs">
                  {isAuditCurrentlyOk ? 'Diagnóstico: 100% Conforme (Tudo OK)' : 'Diagnóstico: Divergência Constatada'}
                </h4>
                {isAuditCurrentlyOk ? (
                  <p className="text-[11px] mt-0.5 text-emerald-900">
                    ✓ Todos os itens entregues presentes · Tela íntegra · Película OK · Sem avarias.
                  </p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    {!screenOk && (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9.5px] uppercase shadow-2xs">
                        🔨 TELA DO APARELHO QUEBRADA (Dano no Display)
                      </span>
                    )}
                    {!batteryOk && (
                      <span className="inline-block px-2 py-0.5 rounded bg-orange-100 border-2 border-orange-500 text-orange-950 font-black text-[9.5px] uppercase shadow-2xs">
                        🔋 BATERIA INCHADA / DANIFICADA (Problema na Bateria)
                      </span>
                    )}
                    {peliculaStatus === 'PELICULA_TRINCADA' && (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100 border-2 border-amber-500 text-amber-950 font-black text-[9.5px] uppercase">
                        ⚠️ PELÍCULA TRINCADA (Necessita troca · Tela do aparelho está {screenOk ? 'ÍNTEGRA' : 'QUEBRADA'})
                      </span>
                    )}
                    {peliculaStatus === 'SEM_PELICULA' && (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-100 border border-red-400 text-red-950 font-bold text-[9.5px] uppercase">
                        ❌ SEM PELÍCULA PROTETORA
                      </span>
                    )}
                    {missingItems.length > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-100 border border-red-400 text-red-950 font-bold text-[9.5px]">
                        ❌ Faltando: {missingItems.join(', ')}
                      </span>
                    )}
                    {damagedAccessories.filter(a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')).length > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100 border border-amber-400 text-amber-950 font-bold text-[9.5px]">
                        ⚠️ Avaria: {damagedAccessories.filter(a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')).join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={markAllAsVerified}
              className="px-3 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 rounded-lg text-zinc-800 font-bold text-[11px] shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              ✓ Marcar Tudo 100% OK
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
                {verifiedItems.length} de {expectedItems.length} conferidos
              </span>
            </div>

            <p className="text-[11px] text-zinc-600">
              Verifique fisicamente se o colaborador apresentou cada item e seu estado de conservação:
            </p>

            {/* Lista de Itens para Conferência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {expectedItems.map((item) => {
                const isVerified = verifiedItems.includes(item);
                const isMissing = missingItems.includes(item);
                const isDamaged = damagedAccessories.includes(item) || (
                  (item.toLowerCase().includes('película') || item.toLowerCase().includes('pelicula')) && peliculaStatus === 'PELICULA_TRINCADA'
                );

                return (
                  <div
                    key={item}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isMissing
                        ? 'bg-red-50/90 border-red-300 text-red-950'
                        : isDamaged
                          ? 'bg-amber-50/90 border-amber-400 text-amber-950'
                          : isVerified
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Plug className={`w-3.5 h-3.5 shrink-0 ${
                        isMissing ? 'text-red-600' : isDamaged ? 'text-amber-600' : isVerified ? 'text-emerald-600' : 'text-zinc-400'
                      }`} />
                      <div className="min-w-0">
                        <span className="font-semibold text-xs truncate block">{item}</span>
                        {isDamaged && (
                          <span className="text-[9.5px] font-black text-amber-800 block uppercase">⚠️ Danificado (Divergência)</span>
                        )}
                        {isMissing && (
                          <span className="text-[9.5px] font-black text-red-700 block uppercase">❌ Ausente / Falta</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item, 'verified')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isVerified && !isDamaged
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Marcar como presente e em perfeito estado"
                      >
                        ✓ OK
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item, 'damaged')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isDamaged
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Marcar como danificado ou trincado (DIVERGÊNCIA)"
                      >
                        ⚠️ Avaria
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item, 'missing')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isMissing
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Marcar como ausente ou faltante (DIVERGÊNCIA)"
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

            {/* Alertas de Itens Faltando e Danificados (Divergências) */}
            <div className="space-y-2">
              {missingItems.length > 0 && (
                <div className="p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase text-[11px] text-red-900">
                      Itens Faltando (Divergência):
                    </strong>
                    <span className="font-semibold">{missingItems.join(', ')}</span>
                  </div>
                </div>
              )}

              {(damagedAccessories.length > 0 || peliculaStatus === 'PELICULA_TRINCADA') && (
                <div className="p-3 bg-amber-100/90 border border-amber-400 rounded-xl text-amber-950 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase text-[11px] text-amber-900">
                      Acessórios Danificados / Trincados (Divergência):
                    </strong>
                    <span className="font-semibold">
                      {Array.from(new Set([
                        ...damagedAccessories,
                        ...(peliculaStatus === 'PELICULA_TRINCADA' ? ['Película de Proteção (Trincada)'] : [])
                      ])).join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
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
              {/* 1. Tela / Vidro do Aparelho */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${screenOk ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-300'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-zinc-900 text-xs">Tela / Display do Celular:</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase ${
                      screenOk ? 'bg-emerald-100 text-emerald-950' : 'bg-red-600 text-white shadow-2xs'
                    }`}>
                      {screenOk ? 'Íntegra' : 'Quebrada'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block mb-2 leading-tight">
                    Vidro e touch original do celular. Se for apenas a película trincada, marque como ÍNTEGRA.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setScreenOk(true);
                      if (condition === 'TELA TRINCADA') {
                        setCondition('BOM');
                      }
                      setAuditNotes((prev) => prev.replace(/\.?\s*Tela do aparelho quebrada\/trincada[^\.]*/i, ''));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      screenOk ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    ✓ Tela Íntegra (Display OK)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenOk(false);
                      setCondition('TELA TRINCADA');
                      setAuditNotes((prev) => {
                        if (prev.includes('Tela do aparelho quebrada') || prev.includes('Tela quebrada')) return prev;
                        return prev 
                          ? `${prev}. Tela do aparelho quebrada/trincada (dano físico no display/vidro).`
                          : 'Tela do aparelho quebrada/trincada (dano físico no display/vidro).';
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      !screenOk ? 'bg-red-600 text-white border-red-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    🔨 Tela Quebrada (Display/Vidro)
                  </button>
                </div>
              </div>

              {/* 2. Película Protetora */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                peliculaStatus === 'COM_PELICULA_OK'
                  ? 'bg-white border-zinc-200'
                  : peliculaStatus === 'PELICULA_TRINCADA'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-red-50 border-red-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-zinc-900 text-xs">Película de Proteção:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      peliculaStatus === 'COM_PELICULA_OK' 
                        ? 'bg-emerald-100 text-emerald-900' 
                        : peliculaStatus === 'PELICULA_TRINCADA'
                          ? 'bg-amber-100 text-amber-950 font-black'
                          : 'bg-red-100 text-red-900'
                    }`}>
                      {peliculaStatus === 'COM_PELICULA_OK' ? 'OK' : peliculaStatus === 'PELICULA_TRINCADA' ? '⚠️ Trincada' : 'Falta'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block mb-2 leading-tight">
                    Película protetora aplicada. Película trincada é divergência de acessório, mas a tela original permanece boa.
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
                    ✓ Película Íntegra (OK)
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
                    ⚠️ Película Trincada (Trocar)
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
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${batteryOk ? 'bg-white border-zinc-200' : 'bg-orange-50 border-2 border-orange-400'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-zinc-900 text-xs">Bateria do Aparelho:</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded uppercase ${
                      batteryOk ? 'bg-emerald-100 text-emerald-950' : 'bg-orange-200 text-orange-950 border border-orange-500'
                    }`}>
                      {batteryOk ? 'Normal' : '🔋 Inchada / Danif.'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block mb-2 leading-tight">
                    Integridade da bateria (inchada, estufada, viciada ou conector com defeito).
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBatteryOk(true);
                      setAuditNotes((prev) => prev.replace(/\.?\s*Bateria inchada\/danificada[^\.]*/i, ''));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      batteryOk ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    ✓ Bateria Normal (OK)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatteryOk(false);
                      setAuditNotes((prev) => {
                        if (prev.toLowerCase().includes('bateria inchada') || prev.toLowerCase().includes('bateria danificada')) return prev;
                        return prev
                          ? `${prev}. Bateria inchada/danificada (necessita avaliação/substituição).`
                          : 'Bateria inchada/danificada (necessita avaliação/substituição).';
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                      !batteryOk ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    🔋 Bateria Inchada / Danificada
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
                  className="px-2 py-0.5 bg-amber-100 text-amber-950 rounded hover:bg-amber-200 font-bold border border-amber-300 cursor-pointer"
                >
                  + Película Trincada (Tela OK)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScreenOk(false);
                    setCondition('TELA TRINCADA');
                    setAuditNotes((prev) => {
                      if (prev.includes('Tela do aparelho quebrada') || prev.includes('Tela quebrada')) return prev;
                      return prev ? `${prev}. Tela do aparelho quebrada/trincada (dano físico no display/vidro).` : 'Tela do aparelho quebrada/trincada (dano físico no display/vidro).';
                    });
                  }}
                  className="px-2 py-0.5 bg-red-100 text-red-950 rounded hover:bg-red-200 font-bold border border-red-300 cursor-pointer"
                >
                  + Tela Quebrada (Display)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBatteryOk(false);
                    setAuditNotes((prev) => {
                      if (prev.toLowerCase().includes('bateria inchada') || prev.toLowerCase().includes('bateria danificada')) return prev;
                      return prev ? `${prev}. Bateria inchada/danificada (necessita avaliação/substituição).` : 'Bateria inchada/danificada (necessita avaliação/substituição).';
                    });
                  }}
                  className="px-2 py-0.5 bg-orange-100 text-orange-950 rounded hover:bg-orange-200 font-bold border border-orange-400 cursor-pointer"
                >
                  + Bateria Inchada / Danificada
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
              onClick={() => handleSave(isAuditCurrentlyOk ? 'OK' : 'COM_PENDENCIA')}
              className={`inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                isAuditCurrentlyOk
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isAuditCurrentlyOk
                  ? 'Concluir Checkup (100% OK)'
                  : 'Salvar com Divergência (Pendência)'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
