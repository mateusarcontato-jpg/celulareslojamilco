import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Layers, 
  Shield, 
  SlidersHorizontal, 
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { Device, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS } from '../types/device';
import { matchAdvancedCriteria, countActiveAdvancedFilters } from '../utils/filterUtils';
import { AdvancedFilterModal } from './AdvancedFilterModal';

export type ReportMode = 'INVENTARIO' | 'AUDITORIA';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  stores: string[];
  sectors: string[];
  initialMode?: ReportMode;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  devices,
  stores,
  sectors,
  initialMode = 'INVENTARIO',
}) => {
  // Modo de Exportação: Inventário Geral ou Relatório Exclusivo de Auditoria
  const [reportMode, setReportMode] = useState<ReportMode>(initialMode);

  // Filtros Gerais
  const [selectedStore, setSelectedStore] = useState<string>('TODAS');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [groupBySector, setGroupBySector] = useState<boolean>(true);
  const [showAccessoriesColumn, setShowAccessoriesColumn] = useState<boolean>(true);

  // Filtros Específicos para o Relatório de Auditoria
  const [auditStatusFilter, setAuditStatusFilter] = useState<'TODOS' | 'OK' | 'COM_PENDENCIA' | 'NAO_AUDITADO'>('TODOS');
  const [auditOnlyDivergent, setAuditOnlyDivergent] = useState<boolean>(false);

  // Janelinha de Filtro Avançado de Acessórios & Estado
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState<boolean>(false);
  const [advancedCriteria, setAdvancedCriteria] = useState<AdvancedFilterCriteria>(INITIAL_ADVANCED_FILTERS);

  useEffect(() => {
    if (initialMode) {
      setReportMode(initialMode);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Determina se a TELA DO APARELHO está quebrada/trincada (dano real no vidro/display)
  const isScreenActuallyBroken = (d: Device): boolean => {
    if (d.auditInfo) {
      return d.auditInfo.screenOk === false;
    }
    const notesLower = (d.notes || '').toLowerCase();
    const condUpper = (d.condition || '').toUpperCase();
    const occText = (d.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();

    // Não pode acusar tela quebrada se a anotação for apenas sobre película
    const isPeliculaMention = notesLower.includes('pelicula trincad') || notesLower.includes('película trincad') ||
      occText.includes('película trincad') || occText.includes('pelicula trincad');
    const isExplicitScreenDamage = notesLower.includes('tela quebrada') || notesLower.includes('tela trincada') || notesLower.includes('display quebrado') ||
      occText.includes('tela quebrada') || occText.includes('tela trincada') || occText.includes('display quebrado');

    if (isPeliculaMention && !isExplicitScreenDamage && condUpper !== 'TELA TRINCADA') {
      return false;
    }
    return condUpper === 'TELA TRINCADA' || isExplicitScreenDamage;
  };

  // Determina se a PELÍCULA DE PROTEÇÃO está trincada/danificada (tela boa)
  const isPeliculaActuallyBroken = (d: Device): boolean => {
    if (d.auditInfo) {
      return (
        d.auditInfo.peliculaStatus === 'PELICULA_TRINCADA' ||
        Boolean(d.auditInfo.damagedAccessories?.some(a => a.toLowerCase().includes('película') || a.toLowerCase().includes('pelicula')))
      );
    }
    const notesLower = (d.notes || '').toLowerCase();
    const occText = (d.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();
    return notesLower.includes('pelicula trincad') || notesLower.includes('película trincad') ||
      occText.includes('pelicula trincad') || occText.includes('película trincad');
  };

  // Determina se o aparelho está SEM PELÍCULA
  const isPeliculaActuallyMissing = (d: Device): boolean => {
    if (d.auditInfo) {
      return (
        d.auditInfo.peliculaStatus === 'SEM_PELICULA' ||
        (d.auditInfo.missingAccessories || []).some(a => a.toLowerCase().includes('película') || a.toLowerCase().includes('pelicula'))
      );
    }
    const notesLower = (d.notes || '').toLowerCase();
    const occText = (d.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();
    return notesLower.includes('sem pelicula') || notesLower.includes('sem película') ||
      occText.includes('sem pelicula') || occText.includes('sem película');
  };

  // Determina se a BATERIA está inchada, viciada ou danificada
  const isBatteryActuallyBroken = (d: Device): boolean => {
    if (d.auditInfo) {
      return d.auditInfo.batteryOk === false;
    }
    const notesLower = (d.notes || '').toLowerCase();
    const occText = (d.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();
    return (
      notesLower.includes('bateria inchad') ||
      notesLower.includes('bateria estufad') ||
      notesLower.includes('bateria danificad') ||
      notesLower.includes('bateria viciad') ||
      notesLower.includes('conector quebrad') ||
      occText.includes('bateria inchad') ||
      occText.includes('bateria estufad') ||
      occText.includes('bateria danificad')
    );
  };

  // Função auxiliar para determinar se o aparelho possui qualquer divergência/avaria
  const isDeviceDivergent = (d: Device): boolean => {
    // 1. Falta de acessórios
    const hasMissing = Boolean(
      (d.auditInfo?.missingAccessories && d.auditInfo.missingAccessories.length > 0) ||
      (d.auditInfo?.status === 'COM_PENDENCIA' && (!d.auditInfo?.verifiedAccessories || d.auditInfo.verifiedAccessories.length === 0))
    );

    // 2. Acessório danificado ou película trincada
    const hasDamaged = Boolean(
      (d.auditInfo?.damagedAccessories && d.auditInfo.damagedAccessories.length > 0) ||
      isPeliculaActuallyBroken(d)
    );

    // 3. Tela do aparelho quebrada
    const isScreenDefect = isScreenActuallyBroken(d);

    // 4. Bateria com defeito / inchada / danificada
    const isBatteryDefect = isBatteryActuallyBroken(d);

    // 5. Perda ou manutenção
    const isPerdaDefect = d.status === 'PERDA / EXTRAVIO' || (d.condition || '').toUpperCase().includes('EXTRAV') || (d.condition || '').toUpperCase().includes('PERDA');
    const isReparoDefect = d.condition === 'EM REPARO' || d.status === 'MANUTENÇÃO';

    return (
      hasMissing ||
      hasDamaged ||
      isScreenDefect ||
      isBatteryDefect ||
      isPerdaDefect ||
      isReparoDefect ||
      d.auditInfo?.status === 'COM_PENDENCIA'
    );
  };

  // Filtra aparelhos com base no modo selecionado
  const filtered = devices.filter((d) => {
    if (selectedStore !== 'TODAS' && d.store !== selectedStore) return false;
    if (selectedSector !== 'TODOS' && d.sector !== selectedSector) return false;

    if (reportMode === 'INVENTARIO') {
      if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
      if (!matchAdvancedCriteria(d, advancedCriteria)) return false;
    } else {
      // Modo AUDITORIA EXCLUSIVA
      const divergent = isDeviceDivergent(d);
      if (auditOnlyDivergent && !divergent) return false;

      if (auditStatusFilter === 'OK') {
        if (!d.auditInfo || d.auditInfo.status !== 'OK' || divergent) return false;
      } else if (auditStatusFilter === 'COM_PENDENCIA') {
        if (!divergent) return false;
      } else if (auditStatusFilter === 'NAO_AUDITADO') {
        if (d.auditInfo) return false;
      }
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const activeAdvCount = countActiveAdvancedFilters(advancedCriteria);

  // Agrupa dispositivos por loja
  const storesToRender = selectedStore === 'TODAS' 
    ? Array.from(new Set(filtered.map((d) => d.store))) 
    : [selectedStore];

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Estatísticas de Auditoria do subconjunto filtrado
  const totalAuditOk = filtered.filter((d) => d.auditInfo?.status === 'OK' && !isDeviceDivergent(d)).length;
  const totalAuditDivergent = filtered.filter((d) => isDeviceDivergent(d)).length;
  const totalPendingAudit = filtered.filter((d) => !d.auditInfo).length;

  // Monta texto descritivo dos filtros ativos para o cabeçalho impresso
  const getFilterSummaryText = () => {
    if (reportMode === 'AUDITORIA') {
      const parts: string[] = ['Relatório Exclusivo de Auditoria'];
      if (auditStatusFilter !== 'TODOS') {
        parts.push(`Status: ${auditStatusFilter === 'OK' ? '100% Conforme' : auditStatusFilter === 'COM_PENDENCIA' ? 'Com Divergência' : 'Não Auditados'}`);
      }
      if (auditOnlyDivergent) {
        parts.push('Apenas Divergências');
      }
      return parts.join(' | ');
    }

    const parts: string[] = [];
    if (advancedCriteria.accessories.length > 0) {
      const modeText = advancedCriteria.accessoryMode === 'has' ? 'Com' : 'Sem';
      parts.push(`${modeText} ${advancedCriteria.accessories.join(', ')}`);
    }
    if (advancedCriteria.conditionCategories.length > 0) {
      const condLabels = advancedCriteria.conditionCategories.map((c) => {
        if (c === 'TELA_QUEBRADA') return 'Tela Quebrada';
        if (c === 'COM_AVARIAS') return 'Com Avarias';
        if (c === 'BATERIA_DEFEITO') return 'Bateria/Conector';
        if (c === 'EM_REPARO') return 'Em Manutenção';
        if (c === 'NOVO') return 'Novo';
        return c;
      });
      parts.push(`Condição: ${condLabels.join(', ')}`);
    }
    return parts.join(' | ');
  };

  const filterSummary = getFilterSummaryText();

  // Renderizador de célula de Acessórios & Estado para o Inventário Geral
  const renderAccessoriesAndConditionCell = (d: Device) => {
    const hasDivergence = isDeviceDivergent(d);
    const isAllOk = !hasDivergence && (d.auditInfo ? d.auditInfo.status === 'OK' : true);

    const isScreenBroken = isScreenActuallyBroken(d);
    const isPeliculaBroken = isPeliculaActuallyBroken(d);
    const isPeliculaMissing = isPeliculaActuallyMissing(d);
    const isBatteryDefect = isBatteryActuallyBroken(d);

    const missingList = d.auditInfo?.missingAccessories || [];
    // Acessórios danificados excluindo a película (já que a película tem box exclusivo)
    const otherDamagedList = (d.auditInfo?.damagedAccessories || []).filter(
      a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')
    );

    return (
      <td className={`border border-zinc-300 py-1.5 px-2 text-[9.5px] ${
        hasDivergence ? 'bg-red-50/50' : 'bg-emerald-50/30'
      }`}>
        <div className="text-zinc-800 text-[9px] leading-tight mb-1">
          <span className="font-bold text-zinc-600">Acessórios: </span>
          <span className="font-semibold text-zinc-950">
            {d.accessories && d.accessories.length > 0 ? d.accessories.join(', ') : 'Carregador Original, Cabo USB-C, Capa, Película'}
          </span>
        </div>

        {isAllOk ? (
          <div className="p-1.5 rounded-lg bg-emerald-100/90 border border-emerald-500 text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-1 font-black text-[10px] text-emerald-950 uppercase tracking-wide">
              <span className="text-emerald-700 font-black text-xs leading-none">✓</span>
              <span>APARELHO 100% OK — SEM AVARIA OU PERDA</span>
            </div>
            <p className="text-[8.5px] text-emerald-800 leading-tight mt-0.5">
              ✓ Tela íntegra · Película OK · Bateria normal · Estado: <strong>{d.condition || 'BOM'}</strong>
            </p>
            {d.auditInfo?.lastAuditedAt && (
              <div className="mt-0.5 text-[8px] text-emerald-700 font-mono">
                Conferido por {d.auditInfo.auditedBy || 'T.I.'} ({d.auditInfo.lastAuditedAt})
              </div>
            )}
          </div>
        ) : (
          <div className="p-1.5 rounded-lg bg-red-100 border-2 border-red-600 text-red-950 shadow-2xs space-y-1">
            <div className="flex items-center gap-1 font-black text-[10px] text-red-950 uppercase tracking-wide">
              <span className="text-red-700 font-black text-xs leading-none">⚠️</span>
              <span>DIVERGÊNCIA CONSTATADA</span>
            </div>

            {/* 1. SE A PELÍCULA ESTIVER TRINCADA */}
            {isPeliculaBroken && (
              <div className="p-1.5 bg-amber-50 border-2 border-amber-500 rounded text-[9px] text-amber-950">
                <span className="font-black text-amber-900 block uppercase text-[8.5px] tracking-wider">
                  ⚠️ PELÍCULA DE PROTEÇÃO TRINCADA:
                </span>
                <span className="font-bold block text-amber-950">
                  Película protetora trincada (necessita troca).
                </span>
                {!isScreenBroken && (
                  <span className="block text-[8px] text-emerald-800 font-bold mt-0.5">
                    ✓ Tela original do aparelho está íntegra.
                  </span>
                )}
              </div>
            )}

            {/* 2. SE A BATERIA ESTIVER INCHADA OU DANIFICADA (Mesmo destaque em retângulo) */}
            {isBatteryDefect && (
              <div className="p-1.5 bg-orange-50 border-2 border-orange-500 rounded text-[9px] text-orange-950">
                <span className="font-black text-orange-900 block uppercase text-[8.5px] tracking-wider">
                  🔋 BATERIA INCHADA / DANIFICADA:
                </span>
                <span className="font-bold block text-orange-950">
                  Problema na bateria (inchada, viciada ou danificada — requer substituição).
                </span>
              </div>
            )}

            {/* 3. SE A TELA DO CELULAR ESTIVER QUEBRADA */}
            {isScreenBroken && (
              <div className="p-1.5 bg-red-600 text-white rounded text-[9px] font-black uppercase shadow-xs">
                🔨 TELA DO APARELHO QUEBRADA / TRINCADA (Dano no display/vidro)
              </div>
            )}

            {/* 4. SE ESTIVER SEM PELÍCULA */}
            {isPeliculaMissing && !isPeliculaBroken && (
              <div className="p-1 bg-red-50 border border-red-400 rounded text-[8.5px] text-red-950 font-bold">
                ❌ SEM PELÍCULA DE PROTEÇÃO APLICADA
              </div>
            )}

            {/* 5. ITENS FALTANDO */}
            {missingList.length > 0 && (
              <div className="p-1 bg-white border border-red-500 rounded text-[9px] text-red-950">
                <span className="font-black text-red-700 block uppercase text-[8px] tracking-wider">
                  ❌ ITEM(NS) FALTANDO:
                </span>
                <span className="font-black text-red-900 underline text-[9.5px]">
                  {missingList.join(', ')}
                </span>
              </div>
            )}

            {/* 6. OUTROS ACESSÓRIOS DANIFICADOS */}
            {otherDamagedList.length > 0 && (
              <div className="p-1 bg-white border border-amber-500 rounded text-[9px] text-amber-950">
                <span className="font-black text-amber-800 block uppercase text-[8px] tracking-wider">
                  ⚠️ OUTRO(S) ACESSÓRIO(S) DANIFICADO(S):
                </span>
                <span className="font-bold text-amber-950">
                  {otherDamagedList.join(', ')}
                </span>
              </div>
            )}

            {d.auditInfo?.auditNotes && (
              <div className="text-[8.5px] text-red-900 font-medium italic pt-0.5">
                Obs: "{d.auditInfo.auditNotes}"
              </div>
            )}
          </div>
        )}
      </td>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-7xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
          
          {/* Controls Toolbar (Oculto na Impressão) */}
          <div className="no-print px-6 py-4 border-b border-zinc-200 bg-zinc-950 text-white flex flex-col gap-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Exportação de Relatórios Oficiais em PDF
                  </h2>
                  <p className="text-xs text-zinc-300">
                    Amilco Home Center · Separe entre Inventário Geral e Auditoria Presencial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SELETOR DE SEÇÃO / TIPO DE RELATÓRIO (SEPARAÇÃO EXIGIDA PELO USUÁRIO) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Tipo de Relatório:
              </span>
              <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReportMode('INVENTARIO')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportMode === 'INVENTARIO'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-red-600" />
                  <span>📋 Relatório Geral de Inventário</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportMode('AUDITORIA')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportMode === 'AUDITORIA'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>🔍 Relatório Exclusivo de Auditoria (Conferência & Pendências)</span>
                </button>
              </div>
            </div>

            {/* BARRA DE FILTROS ESPECÍFICOS DEPENDENDO DA SEÇÃO */}
            {reportMode === 'INVENTARIO' ? (
              /* Filtros do Inventário Geral */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Filtrar Loja:
                  </label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TODAS">Todas as Lojas</option>
                    {stores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Filtrar Setor:
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TODOS">Todos os Setores</option>
                    {sectors.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Filtrar Status:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="EM USO">Em Uso</option>
                    <option value="SEM PATRIMÔNIO">Sem Patrimônio (SEM PT)</option>
                    <option value="MANUTENÇÃO">Manutenção</option>
                    <option value="DISPONÍVEL">Disponível / Estoque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Acessórios & Estado:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAdvancedModalOpen(true)}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      activeAdvCount > 0
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="truncate">Filtro Avançado</span>
                    {activeAdvCount > 0 && (
                      <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                        {activeAdvCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Filtros Exclusivos de Auditoria */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Unidade / Loja da Auditoria:
                  </label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TODAS">Todas as Lojas</option>
                    {stores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Filtrar Setor Auditado:
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TODOS">Todos os Setores</option>
                    {sectors.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Situação da Auditoria:
                  </label>
                  <select
                    value={auditStatusFilter}
                    onChange={(e) => setAuditStatusFilter(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500 font-bold"
                  >
                    <option value="TODOS">Todos os Aparelhos ({filtered.length})</option>
                    <option value="OK">✓ Apenas 100% Conformes (Tudo OK)</option>
                    <option value="COM_PENDENCIA">⚠️ Apenas com Divergências / Pendências</option>
                    <option value="NAO_AUDITADO">⏳ Apenas Não Auditados (Pendente Checkup)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Opções de visualização */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900 text-xs">
              {reportMode === 'INVENTARIO' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-200 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={groupBySector}
                      onChange={(e) => setGroupBySector(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">Agrupar por Setores</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-200 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={showAccessoriesColumn}
                      onChange={(e) => setShowAccessoriesColumn(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">Coluna de Acessórios & Estado</span>
                  </label>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={auditOnlyDivergent}
                      onChange={(e) => setAuditOnlyDivergent(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">⚠️ Filtrar somente aparelhos com divergência/avaria</span>
                  </label>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      ✓ {totalAuditOk} Conforme(s)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                      ⚠️ {totalAuditDivergent} com Divergência
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      ⏳ {totalPendingAudit} Pendente(s)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Printable PDF Canvas - Modelo Oficial Amilco Home Center */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0 print:m-0 space-y-6 text-black text-xs font-sans">
            
            {/* CABEÇALHO DO DOCUMENTO */}
            <div className="border-b-2 border-black pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black uppercase">
                  AMILCO HOME CENTER
                </h1>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  {reportMode === 'AUDITORIA' 
                    ? 'RELATÓRIO OFICIAL DE AUDITORIA, CONFORMIDADE & PENDÊNCIAS' 
                    : 'RELATÓRIO DE CONTROLE DE PATRIMÔNIO DE CELULARES'}
                </p>
                {filterSummary && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-[10px] font-bold uppercase text-zinc-900">
                    <span className="text-red-700">FILTRO ESPECÍFICO:</span>
                    <span>{filterSummary}</span>
                  </div>
                )}
              </div>
              <div className="text-right text-[11px] text-zinc-600 font-mono">
                <p>Emissão: <strong>{currentDate}</strong></p>
                <p>Total Listado: <strong className="text-black font-bold">{filtered.length} Aparelhos</strong></p>
                {reportMode === 'AUDITORIA' ? (
                  <p className="text-red-700 font-bold">
                    Divergências: <strong>{totalAuditDivergent}</strong>
                  </p>
                ) : (
                  <p className="text-purple-950">Aparelhos Pessoais: <strong className="font-bold">{filtered.filter(d => Boolean(d.isPersonalDevice)).length}</strong></p>
                )}
              </div>
            </div>

            {/* Aviso se nenhum aparelho coincidir com o filtro */}
            {filtered.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-zinc-300 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-zinc-800">
                  Nenhum aparelho encontrado para os filtros selecionados
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Ajuste a loja, setor ou situação da auditoria para visualizar os registros.
                </p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* RELATÓRIO EXCLUSIVO DE AUDITORIA (STATUS, PENDÊNCIAS, AUDITORES)          */}
            {/* ========================================================================= */}
            {reportMode === 'AUDITORIA' && filtered.length > 0 && (
              <div className="space-y-6">
                {/* Resumo Executivo da Auditoria (Cards Impressos) */}
                <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-300 text-center">
                  <div className="border-r border-zinc-200 pr-2">
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase">Total Aparelhos</span>
                    <strong className="text-base text-zinc-950 font-bold">{filtered.length}</strong>
                  </div>
                  <div className="border-r border-zinc-200 pr-2">
                    <span className="block text-[10px] font-semibold text-emerald-700 uppercase">100% Conformes</span>
                    <strong className="text-base text-emerald-800 font-bold">{totalAuditOk}</strong>
                  </div>
                  <div className="border-r border-zinc-200 pr-2">
                    <span className="block text-[10px] font-semibold text-red-700 uppercase">Com Divergência</span>
                    <strong className="text-base text-red-700 font-bold">{totalAuditDivergent}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase">Pendente Checkup</span>
                    <strong className="text-base text-zinc-600 font-bold">{totalPendingAudit}</strong>
                  </div>
                </div>

                {/* Tabelas de Auditoria por Unidade */}
                {storesToRender.map((storeName) => {
                  const storeDevices = filtered.filter((d) => d.store === storeName);
                  if (storeDevices.length === 0) return null;

                  return (
                    <div key={storeName} className="space-y-3 page-break-inside-avoid">
                      {/* Banner Loja */}
                      <div className="bg-zinc-950 text-white p-2 px-3 rounded flex items-center justify-between border-l-4 border-red-600">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-red-500" />
                          <h2 className="font-bold text-xs uppercase tracking-wider">
                            AUDITORIA & CONFERÊNCIA PRESENCIAL - {storeName}
                          </h2>
                        </div>
                        <span className="text-xs font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                          {storeDevices.length} APARELHOS
                        </span>
                      </div>

                      {/* Tabela Exclusiva de Auditoria */}
                      <table className="w-full border-collapse border border-zinc-400 text-left text-[9.5px] print-report-table">
                        <thead>
                          <tr className="bg-zinc-200 text-black font-bold uppercase text-[8.5px]">
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[7%]">Nº / PT</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[15%]">COLABORADOR & SETOR</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[13%]">APARELHO</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[14%] text-center">DIAGNÓSTICO</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[18%]">ACESSÓRIOS & ITENS</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[14%]">TELA, PELÍCULA & BATERIA</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">CONFERÊNCIA</th>
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">PARECER / OBS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeDevices.map((d) => {
                            const divergent = isDeviceDivergent(d);
                            const isOk = d.auditInfo?.status === 'OK' && !divergent;
                            const notAudited = !d.auditInfo;

                            const isScreenBroken = isScreenActuallyBroken(d);
                            const isPeliculaBroken = isPeliculaActuallyBroken(d);
                            const isPeliculaMissing = isPeliculaActuallyMissing(d);
                            const isBatteryBroken = isBatteryActuallyBroken(d);

                            const missingList = d.auditInfo?.missingAccessories || [];
                            const otherDamagedList = (d.auditInfo?.damagedAccessories || []).filter(
                              a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula')
                            );

                            return (
                              <tr 
                                key={d.id} 
                                className={`border-b border-zinc-300 ${
                                  divergent ? 'bg-red-50/50' : isOk ? 'bg-emerald-50/30' : 'hover:bg-zinc-50'
                                }`}
                              >
                                {/* PT */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 font-mono font-bold text-[9px]">
                                  {d.isPersonalDevice ? (
                                    <span className="text-purple-900 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 text-[8px]">
                                      PESSOAL
                                    </span>
                                  ) : d.hasAssetTag ? (
                                    d.assetNumber
                                  ) : (
                                    'SEM PT'
                                  )}
                                </td>

                                {/* Colaborador & Setor */}
                                <td className="border border-zinc-300 py-1.5 px-1.5">
                                  <span className="font-bold uppercase text-black block leading-tight">{d.employeeName}</span>
                                  <span className="text-[8.5px] text-zinc-600 block mt-0.5">{d.sector}</span>
                                </td>

                                {/* Modelo */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 font-medium">
                                  <span className="font-semibold block leading-tight">{d.brand} {d.model}</span>
                                  <span className="text-[8px] text-zinc-500 font-mono block mt-0.5">Linha: {d.phoneNumber || 'Sem chip'}</span>
                                </td>

                                {/* Diagnóstico da Auditoria: Totalmente Diferenciado */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 text-center">
                                  {isOk ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 font-black text-[8.5px] border border-emerald-500 uppercase tracking-wide">
                                      ✓ 100% CONFORME
                                    </span>
                                  ) : (
                                    <div className="flex flex-col gap-1 items-center">
                                      {isScreenBroken && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-red-600 text-white font-black text-[8.5px] shadow-xs uppercase tracking-wide">
                                          🔨 TELA QUEBRADA
                                        </span>
                                      )}
                                      {isBatteryBroken && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-orange-100 text-orange-950 font-black text-[8.5px] border-2 border-orange-500 uppercase tracking-wide">
                                          🔋 BATERIA INCHADA
                                        </span>
                                      )}
                                      {isPeliculaBroken && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-amber-100 text-amber-950 font-black text-[8.5px] border-2 border-amber-500 uppercase tracking-wide">
                                          ⚠️ PELÍCULA TRINCADA
                                        </span>
                                      )}
                                      {!isScreenBroken && !isBatteryBroken && !isPeliculaBroken && divergent && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-red-100 text-red-950 font-black text-[8.5px] border-2 border-red-600 uppercase tracking-wide">
                                          ⚠️ DIVERGÊNCIA
                                        </span>
                                      )}
                                      {!isScreenBroken && !isBatteryBroken && !isPeliculaBroken && !divergent && (
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold text-[8px] border border-zinc-300 uppercase">
                                          ⏳ NÃO AUDITADO
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Acessórios & Itens Entregues */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 text-[8.5px] leading-snug">
                                  {notAudited ? (
                                    <span className="text-zinc-400 italic">Cadastrado: {d.accessories?.join(', ') || 'Padrão'}</span>
                                  ) : isOk ? (
                                    <div className="text-emerald-900 font-medium">
                                      <span className="font-bold text-emerald-800 block">✓ Todos presentes:</span>
                                      <div className="text-[8px] text-emerald-950">
                                        {d.auditInfo?.verifiedAccessories?.join(', ') || d.accessories?.join(', ') || 'Completo'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {missingList.length > 0 && (
                                        <div className="text-red-900 font-bold">
                                          <span className="text-red-700">❌ FALTANDO: </span>
                                          <span className="underline">{missingList.join(', ')}</span>
                                        </div>
                                      )}
                                      {otherDamagedList.length > 0 && (
                                        <div className="text-amber-950 font-bold">
                                          <span className="text-amber-800">⚠️ AVARIA: </span>
                                          <span>{otherDamagedList.join(', ')}</span>
                                        </div>
                                      )}
                                      <div className="text-[8px] text-zinc-500">
                                        Presentes: {d.auditInfo?.verifiedAccessories?.join(', ') || 'Nenhum'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Tela, Película & Bateria: Separados com Clareza Absoluta */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 text-[8.5px]">
                                  {notAudited ? (
                                    <span className="text-zinc-400 italic">Estado: {d.condition || 'BOM'}</span>
                                  ) : (
                                    <div className="space-y-1">
                                      {/* TELA ORIGINAL DO APARELHO */}
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="text-zinc-700 font-bold shrink-0">Tela:</span>
                                        {!isScreenBroken ? (
                                          <span className="text-emerald-800 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                            ✓ Íntegra
                                          </span>
                                        ) : (
                                          <span className="text-white font-black bg-red-600 px-1 py-0.2 rounded uppercase">
                                            🔨 QUEBRADA
                                          </span>
                                        )}
                                      </div>

                                      {/* PELÍCULA DE PROTEÇÃO */}
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="text-zinc-700 font-bold shrink-0">Película:</span>
                                        {isPeliculaBroken ? (
                                          <span className="text-amber-950 font-black bg-amber-100 px-1 py-0.2 rounded border-2 border-amber-500 uppercase">
                                            ⚠️ TRINCADA
                                          </span>
                                        ) : isPeliculaMissing ? (
                                          <span className="text-red-900 font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200 uppercase">
                                            ❌ SEM PELÍCULA
                                          </span>
                                        ) : (
                                          <span className="text-emerald-800 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                            ✓ Íntegra
                                          </span>
                                        )}
                                      </div>

                                      {/* BATERIA (Destaque retangular caso inchada/danificada) */}
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="text-zinc-700 font-bold shrink-0">Bateria:</span>
                                        {isBatteryBroken ? (
                                          <span className="text-orange-950 font-black bg-orange-100 px-1 py-0.2 rounded border-2 border-orange-500 uppercase">
                                            🔋 INCHADA / DANIF.
                                          </span>
                                        ) : (
                                          <span className="text-emerald-800 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                            ✓ Normal
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Conferência / Auditor */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 text-[8.5px]">
                                  {d.auditInfo ? (
                                    <div>
                                      <strong className="text-zinc-900 block font-bold leading-tight">{d.auditInfo.auditedBy}</strong>
                                      <span className="text-[7.5px] text-zinc-500 font-mono block mt-0.5 leading-tight">{d.auditInfo.lastAuditedAt}</span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 italic">Pendente</span>
                                  )}
                                </td>

                                {/* Parecer / Observações / Pendências */}
                                <td className="border border-zinc-300 py-1.5 px-1.5 text-[8.5px] leading-snug">
                                  {isScreenBroken && (
                                    <div className="text-red-700 font-black mb-0.5">
                                      • Tela quebrada (trocar display).
                                    </div>
                                  )}
                                  {isBatteryBroken && (
                                    <div className="text-orange-900 font-black mb-0.5">
                                      • Bateria inchada/danificada (substituir).
                                    </div>
                                  )}
                                  {isPeliculaBroken && (
                                    <div className="text-amber-900 font-bold mb-0.5">
                                      • Trocar película (tela intacta).
                                    </div>
                                  )}
                                  {d.auditInfo?.auditNotes ? (
                                    <span className="text-zinc-900 italic font-medium">"{d.auditInfo.auditNotes}"</span>
                                  ) : d.notes ? (
                                    <span className="text-zinc-600 text-[8px]">{d.notes}</span>
                                  ) : (
                                    <span className="text-zinc-400">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* Termo de Encerramento e Assinaturas Formais da Auditoria */}
                <div className="pt-6 border-t-2 border-black space-y-8 page-break-inside-avoid">
                  <p className="text-[10px] text-zinc-600 italic leading-relaxed text-center">
                    Declaramos que a auditoria presencial de conformidade física, verificação de integridade 
                    e conferência de acessórios entregues aos colaboradores da unidade foi realizada nos termos 
                    dos regulamentos internos da <strong>AMILCO HOME CENTER</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-12 pt-4 text-center">
                    <div>
                      <div className="border-t border-black w-4/5 mx-auto mb-1"></div>
                      <strong className="block text-xs font-bold text-black uppercase">Auditor T.I. Responsável</strong>
                      <span className="text-[10px] text-zinc-500">Tecnologia da Informação · Amilco Home Center</span>
                    </div>

                    <div>
                      <div className="border-t border-black w-4/5 mx-auto mb-1"></div>
                      <strong className="block text-xs font-bold text-black uppercase">Gerência / Coordenação da Loja</strong>
                      <span className="text-[10px] text-zinc-500">Ciência e Visto da Unidade</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* RELATÓRIO GERAL DE INVENTÁRIO & PATRIMÔNIO (PADRÃO COMPLETO)              */}
            {/* ========================================================================= */}
            {reportMode === 'INVENTARIO' && filtered.length > 0 && (
              <div className="space-y-6">
                {storesToRender.map((storeName) => {
                  const storeDevices = filtered.filter((d) => d.store === storeName);
                  if (storeDevices.length === 0) return null;

                  const sectorGroups = Array.from(new Set(storeDevices.map((d) => d.sector)));

                  return (
                    <div key={storeName} className="space-y-4 page-break-inside-avoid">
                      {/* Store Header Banner */}
                      <div className="bg-zinc-950 text-white p-2 px-3 rounded flex items-center justify-between border-l-4 border-red-600">
                        <h2 className="font-bold text-xs uppercase tracking-wider">
                          CONTROLE DE PATRIMÔNIO DE CELULARES DA EMPRESA AMILCO HOME CENTER - {storeName}
                        </h2>
                        <span className="text-xs font-mono font-bold bg-red-600 px-2 py-0.5 rounded">
                          {storeDevices.length} APARELHOS
                        </span>
                      </div>

                      {groupBySector ? (
                        sectorGroups.map((secName) => {
                          const secDevices = storeDevices.filter((d) => d.sector === secName);
                          return (
                            <div key={secName} className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800 bg-zinc-100 px-2 py-1 border border-zinc-300 rounded">
                                <span className="uppercase text-red-700">SETOR: {secName}</span>
                                <span className="font-mono text-zinc-600">{secDevices.length} aparelho(s)</span>
                              </div>

                              <table className="w-full border-collapse border border-zinc-400 text-left text-[10px] print-report-table">
                                <thead>
                                  <tr className="bg-zinc-200 text-black font-bold uppercase text-[9px]">
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">N° PATRIMÔNIO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[18%]">COLABORADOR / USUÁRIO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[15%]">MODELO</th>
                                    {showAccessoriesColumn && (
                                      <th className="border border-zinc-400 py-1.5 px-1.5 w-[35%]">ACESSÓRIOS & ESTADO</th>
                                    )}
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[6%]">VPN</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[8%]">AQUISIÇÃO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">STATUS</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {secDevices.map((d) => (
                                    <tr key={d.id} className="hover:bg-zinc-50 border-b border-zinc-300">
                                      <td className="border border-zinc-300 py-1.5 px-2 font-mono font-bold">
                                        {d.isPersonalDevice ? (
                                          <span className="text-purple-900 font-bold bg-purple-50 px-1 py-0.2 rounded border border-purple-200 text-[10px]">
                                            PESSOAL
                                          </span>
                                        ) : d.hasAssetTag ? (
                                          d.assetNumber
                                        ) : (
                                          'SEM PT'
                                        )}
                                      </td>
                                      <td className="border border-zinc-300 py-1.5 px-2">
                                        <span className="font-bold uppercase text-black">{d.employeeName}</span>
                                        {d.previousEmployeeName && (
                                          <span className="text-[10px] text-zinc-500 block">
                                            (Anterior: {d.previousEmployeeName})
                                          </span>
                                        )}
                                        {d.phoneNumber && (
                                          <span className="text-[10px] text-zinc-600 block font-mono">
                                            Linha: {d.phoneNumber}
                                          </span>
                                        )}
                                      </td>
                                      <td className="border border-zinc-300 py-1.5 px-2 font-medium">
                                        <span>{d.brand} {d.model}</span>
                                        {d.imei1 && (
                                          <span className="text-[9px] text-zinc-500 block font-mono">
                                            IMEI: {d.imei1}
                                          </span>
                                        )}
                                      </td>
                                      {showAccessoriesColumn && renderAccessoriesAndConditionCell(d)}
                                      <td className="border border-zinc-300 py-1.5 px-2 font-semibold">
                                        {d.hasVpn ? (
                                          <span className="text-emerald-700 font-bold">SIM</span>
                                        ) : (
                                          <span className="text-zinc-400">NÃO</span>
                                        )}
                                      </td>
                                      <td className="border border-zinc-300 py-1.5 px-2 font-mono text-[10px]">
                                        {d.acquisitionDate || '—'}
                                      </td>
                                      <td className="border border-zinc-300 py-1.5 px-2 font-semibold">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                          d.isPersonalDevice && (d.status === 'SEM PATRIMÔNIO' || d.status === 'PESSOAL')
                                            ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                                            : d.status === 'EM USO'
                                              ? 'bg-zinc-100 text-zinc-900 font-bold'
                                              : d.status === 'MANUTENÇÃO'
                                                ? 'bg-amber-100 text-amber-900 font-bold'
                                                : 'bg-red-100 text-red-900 font-bold'
                                        }`}>
                                          {d.isPersonalDevice && (d.status === 'SEM PATRIMÔNIO' || d.status === 'PESSOAL')
                                            ? 'PESSOAL'
                                            : d.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })
                      ) : (
                        <table className="w-full border-collapse border border-zinc-400 text-left text-[10px] print-report-table">
                          <thead>
                            <tr className="bg-zinc-200 text-black font-bold uppercase text-[9px]">
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">N° PATRIMÔNIO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[18%]">COLABORADOR / USUÁRIO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[11%]">SETOR</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[14%]">MODELO</th>
                              {showAccessoriesColumn && (
                                <th className="border border-zinc-400 py-1.5 px-1.5 w-[33%]">ACESSÓRIOS & ESTADO</th>
                              )}
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[6%]">VPN</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {storeDevices.map((d) => (
                              <tr key={d.id} className="hover:bg-zinc-50 border-b border-zinc-300">
                                <td className="border border-zinc-300 py-1.5 px-2 font-mono font-bold">
                                  {d.isPersonalDevice ? (
                                    <span className="text-purple-900 font-bold bg-purple-50 px-1 py-0.2 rounded border border-purple-200 text-[10px]">
                                      PESSOAL
                                    </span>
                                  ) : d.hasAssetTag ? (
                                    d.assetNumber
                                  ) : (
                                    'SEM PT'
                                  )}
                                </td>
                                <td className="border border-zinc-300 py-1.5 px-2 font-semibold">
                                  <span className="font-bold uppercase text-black">{d.employeeName}</span>
                                  {d.previousEmployeeName && (
                                    <span className="text-[10px] text-zinc-500 block">
                                      (Anterior: {d.previousEmployeeName})
                                    </span>
                                  )}
                                </td>
                                <td className="border border-zinc-300 py-1.5 px-2">{d.sector}</td>
                                <td className="border border-zinc-300 py-1.5 px-2 font-medium">{d.brand} {d.model}</td>
                                {showAccessoriesColumn && renderAccessoriesAndConditionCell(d)}
                                <td className="border border-zinc-300 py-1.5 px-2 font-semibold">
                                  {d.hasVpn ? (
                                    <span className="text-emerald-700 font-bold">SIM</span>
                                  ) : (
                                    <span className="text-zinc-400">NÃO</span>
                                  )}
                                </td>
                                <td className="border border-zinc-300 py-1.5 px-2 font-semibold">
                                  {d.isPersonalDevice && (d.status === 'SEM PATRIMÔNIO' || d.status === 'PESSOAL') ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-900 font-bold border border-purple-300">
                                      PESSOAL
                                    </span>
                                  ) : (
                                    d.status
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Bottom Toolbar */}
          <div className="no-print px-6 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 text-xs text-zinc-600 shrink-0">
            <span>
              Modo: <strong>{reportMode === 'AUDITORIA' ? 'Auditoria Exclusiva' : 'Inventário Geral'}</strong> · Total listado: <strong>{filtered.length} aparelho(s)</strong>
            </span>
            <div className="flex items-center gap-2">
              {reportMode === 'INVENTARIO' && (
                <button
                  onClick={() => setIsAdvancedModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Configurar Acessórios / Tela
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Janelinha Dedicada: Filtro Avançado de Acessórios & Estado Físico */}
      <AdvancedFilterModal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        criteria={advancedCriteria}
        onApplyCriteria={(newCriteria) => setAdvancedCriteria(newCriteria)}
        devices={devices}
      />
    </>
  );
};
