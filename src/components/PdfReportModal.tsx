import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Layers, 
  Shield, 
  SlidersHorizontal, 
  AlertTriangle,
  ClipboardCheck,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Device, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS } from '../types/device';
import { matchAdvancedCriteria, countActiveAdvancedFilters } from '../utils/filterUtils';
import { cleanExecutiveAuditNotes, dedupeDamagedAccessories } from '../utils/auditFormatUtils';
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
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]); // Vazio = Todos os Setores
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState<boolean>(false);
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [groupBySector, setGroupBySector] = useState<boolean>(true);
  const [showAccessoriesColumn, setShowAccessoriesColumn] = useState<boolean>(false);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setIsSectorDropdownOpen(false);
      }
    };
    if (isSectorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSectorDropdownOpen]);

  const toggleSectorSelection = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

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

  // Determina se a CAPA PROTETORA está desgastada, rasgada ou danificada
  const isCapaActuallyBroken = (d: Device): boolean => {
    if (d.auditInfo) {
      return Boolean(
        d.auditInfo.damagedAccessories?.some(a => a.toLowerCase().includes('capa')) ||
        (d.auditInfo.auditNotes || '').toLowerCase().includes('capa desgastad') ||
        (d.auditInfo.auditNotes || '').toLowerCase().includes('capa rasgad') ||
        (d.auditInfo.auditNotes || '').toLowerCase().includes('capa danificad') ||
        (d.auditInfo.auditNotes || '').toLowerCase().includes('capa protetora desgastad')
      );
    }
    const notesLower = (d.notes || '').toLowerCase();
    const occText = (d.occurrences || []).map(o => `${o.title} ${o.description}`).join(' ').toLowerCase();
    return (
      notesLower.includes('capa desgastad') ||
      notesLower.includes('capa rasgad') ||
      notesLower.includes('capa danificad') ||
      notesLower.includes('capa avariad') ||
      occText.includes('capa desgastad') ||
      occText.includes('capa rasgad') ||
      occText.includes('capa danificad')
    );
  };

  // Determina se o aparelho está SEM CAPA PROTETORA
  const isCapaActuallyMissing = (d: Device): boolean => {
    if (d.auditInfo) {
      return (d.auditInfo.missingAccessories || []).some(a => a.toLowerCase().includes('capa'));
    }
    const notesLower = (d.notes || '').toLowerCase();
    return notesLower.includes('sem capa');
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
    if (selectedSectors.length > 0 && !selectedSectors.includes(d.sector)) return false;

    if (reportMode === 'INVENTARIO') {
      if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    } else {
      // Modo AUDITORIA EXCLUSIVA
      if (!matchAdvancedCriteria(d, advancedCriteria)) return false;
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
      if (selectedStore !== 'TODAS') {
        parts.push(`Loja: ${selectedStore}`);
      }
      if (selectedSectors.length > 0) {
        parts.push(`Setor(es): ${selectedSectors.join(', ')}`);
      }
      if (auditStatusFilter !== 'TODOS') {
        parts.push(`Status: ${auditStatusFilter === 'OK' ? '100% Conforme' : auditStatusFilter === 'COM_PENDENCIA' ? 'Com Divergência' : 'Não Auditados'}`);
      }
      if (auditOnlyDivergent) {
        parts.push('Apenas Divergências');
      }
      if (advancedCriteria.accessories.length > 0) {
        const modeText = advancedCriteria.accessoryMode === 'has' ? 'Com' : 'Sem';
        parts.push(`${modeText} ${advancedCriteria.accessories.join(', ')}`);
      }
      if (advancedCriteria.conditionCategories.length > 0) {
        const condLabels = advancedCriteria.conditionCategories.map((c) => {
          if (c === 'TELA_QUEBRADA') return 'Tela Quebrada';
          if (c === 'PELICULA_TRINCADA') return 'Película Trincada';
          if (c === 'COM_AVARIAS') return 'Com Avarias';
          if (c === 'BATERIA_DEFEITO') return 'Bateria Inchada/Danificada';
          if (c === 'EM_REPARO') return 'Em Manutenção';
          if (c === 'NOVO') return 'Novo';
          return c;
        });
        parts.push(`Condição: ${condLabels.join(', ')}`);
      }
      return parts.join(' | ');
    }

    const parts: string[] = ['Planilha Padrão de Celulares (Sem Auditoria)'];
    if (selectedStore !== 'TODAS') parts.push(`Loja: ${selectedStore}`);
    if (selectedSectors.length > 0) parts.push(`Setor(es): ${selectedSectors.join(', ')}`);
    if (selectedStatus !== 'ALL') parts.push(`Status: ${selectedStatus}`);
    return parts.join(' | ');
  };

  const renderMultiSectorSelector = (labelText: string) => {
    const buttonText =
      selectedSectors.length === 0
        ? 'Todos os Setores'
        : selectedSectors.length <= 2
          ? selectedSectors.join(', ')
          : `${selectedSectors.length} setores (${selectedSectors.slice(0, 2).join(', ')}...)`;

    return (
      <div className="relative" ref={sectorDropdownRef}>
        <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
          {labelText}
        </label>
        <button
          type="button"
          onClick={() => setIsSectorDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between gap-2 bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
            selectedSectors.length > 0
              ? 'border-red-500 text-white font-bold bg-zinc-900/90'
              : 'border-zinc-700 text-white hover:border-zinc-500'
          }`}
          title={selectedSectors.length > 0 ? `Setores filtrados: ${selectedSectors.join(', ')}` : 'Clique para selecionar um ou mais setores'}
        >
          <span className="truncate">{buttonText}</span>
          <div className="flex items-center gap-1 shrink-0">
            {selectedSectors.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                {selectedSectors.length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isSectorDropdownOpen ? 'rotate-180 text-white' : ''}`} />
          </div>
        </button>

        {isSectorDropdownOpen && (
          <div className="absolute left-0 right-0 sm:w-64 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Selecione 1 ou mais setores
              </span>
              {selectedSectors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSectors([])}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Limpar ({selectedSectors.length})
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {/* Opção Todos os Setores */}
              <button
                type="button"
                onClick={() => setSelectedSectors([])}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSectors.length === 0
                    ? 'bg-red-600/20 text-red-300 border border-red-500/40 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Todos os Setores</span>
                {selectedSectors.length === 0 && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              </button>

              <div className="border-t border-zinc-800 my-1" />

              {sectors.map((sec) => {
                const isChecked = selectedSectors.includes(sec);
                const countInSector = devices.filter(
                  (d) => (selectedStore === 'TODAS' || d.store === selectedStore) && d.sector === sec
                ).length;

                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSectorSelection(sec)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-red-600 text-white font-bold shadow-2xs'
                        : 'text-zinc-200 hover:bg-zinc-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                          isChecked
                            ? 'bg-white border-white text-red-600'
                            : 'border-zinc-600 bg-zinc-950'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{sec}</span>
                    </div>
                    <span className={`text-[10px] font-mono ml-2 ${isChecked ? 'text-red-100 font-bold' : 'text-zinc-500'}`}>
                      {countInSector}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                {selectedSectors.length === 0
                  ? 'Exibindo todos'
                  : `${selectedSectors.length} selecionado(s)`}
              </span>
              <button
                type="button"
                onClick={() => setIsSectorDropdownOpen(false)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filterSummary = getFilterSummaryText();

  // Renderizador de célula de Acessórios Padrão da Ficha para a Planilha Padrão dos Celulares (SEM AUDITORIA)
  const renderStandardAccessoriesCell = (d: Device) => {
    const accList = d.accessories && d.accessories.length > 0
      ? d.accessories.join(', ')
      : 'Carregador Original, Cabo USB-C, Capa Protetora, Película de Vidro';

    return (
      <td className="border border-zinc-300 py-1.5 px-2 text-[9.5px] text-zinc-800">
        <span className="font-medium text-zinc-900 block leading-snug">
          {accList}
        </span>
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
                    Amilco Home Center · Escolha entre a Planilha Padrão dos Celulares (sem auditoria) ou o Relatório Exclusivo de Auditoria
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

            {/* SELETOR DE SEÇÃO / TIPO DE RELATÓRIO (SEPARAÇÃO TOTAL ENTRE CELULARES PADRÃO E AUDITORIA) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Tipo de Relatório:
              </span>
              <div className="flex flex-wrap items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 gap-1">
                <button
                  type="button"
                  onClick={() => setReportMode('INVENTARIO')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportMode === 'INVENTARIO'
                      ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-red-600" />
                  <span>📱 Planilha Padrão dos Celulares (Sem Auditoria)</span>
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
              /* Filtros da Planilha Padrão de Celulares (Sem Auditoria) */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
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

                {renderMultiSectorSelector('Filtrar Setor (1 ou mais):')}

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                    Filtrar Status Operacional:
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
              </div>
            ) : (
              /* Filtros Exclusivos de Auditoria */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
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

                {renderMultiSectorSelector('Filtrar Setor Auditado (1 ou mais):')}

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
            )}

            {/* Opções de visualização */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900 text-xs">
              {reportMode === 'INVENTARIO' ? (
                <div className="flex flex-wrap items-center gap-4">
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
                    <span className="text-[11px]">Exibir Coluna de Acessórios Padrão da Ficha</span>
                  </label>

                  <span className="text-[11px] text-zinc-400 italic">
                    * Esta planilha exibe apenas os dados padrão dos celulares, sem diagnósticos de auditoria.
                  </span>
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
                            <th className="border border-zinc-400 py-1.5 px-1.5 w-[14%]">TELA, PELÍCULA, CAPA & BATERIA</th>
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
                            const isCapaBroken = isCapaActuallyBroken(d);
                            const isCapaMissing = isCapaActuallyMissing(d);

                            const missingList = d.auditInfo?.missingAccessories || [];
                            const otherDamagedList = dedupeDamagedAccessories(d.auditInfo?.damagedAccessories || []).filter(
                              a => !a.toLowerCase().includes('película') && !a.toLowerCase().includes('pelicula') && !a.toLowerCase().includes('capa')
                            );
                            const cleanedAuditNote = cleanExecutiveAuditNotes(d.auditInfo?.auditNotes);

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
                                      {isCapaBroken && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-amber-100 text-amber-950 font-black text-[8.5px] border-2 border-amber-600 uppercase tracking-wide">
                                          🛡️ CAPA DESGASTADA
                                        </span>
                                      )}
                                      {!isScreenBroken && !isBatteryBroken && !isPeliculaBroken && !isCapaBroken && divergent && (
                                        <span className="inline-block w-full px-1 py-0.5 rounded bg-red-100 text-red-950 font-black text-[8.5px] border-2 border-red-600 uppercase tracking-wide">
                                          ⚠️ DIVERGÊNCIA
                                        </span>
                                      )}
                                      {!isScreenBroken && !isBatteryBroken && !isPeliculaBroken && !isCapaBroken && !divergent && (
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
                                      {isCapaBroken && (
                                        <div className="text-amber-950 font-black">
                                          <span className="text-amber-800">🛡️ CAPA: </span>
                                          <span>Desgastada / Rasgada</span>
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

                                {/* Tela, Película, Capa & Bateria: Separados com Clareza Absoluta */}
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

                                      {/* CAPA PROTETORA (Destaque retangular caso desgastada/rasgada) */}
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="text-zinc-700 font-bold shrink-0">Capa:</span>
                                        {isCapaBroken ? (
                                          <span className="text-amber-950 font-black bg-amber-100 px-1 py-0.2 rounded border-2 border-amber-600 uppercase">
                                            🛡️ DESGASTADA / RASG.
                                          </span>
                                        ) : isCapaMissing ? (
                                          <span className="text-red-900 font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200 uppercase">
                                            ❌ SEM CAPA
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
                                  {isCapaBroken && (
                                    <div className="text-amber-900 font-bold mb-0.5">
                                      • Capa desgastada/rasgada (trocar capa).
                                    </div>
                                  )}
                                  {cleanedAuditNote ? (
                                    <span className="text-zinc-900 font-medium">{cleanedAuditNote}</span>
                                  ) : !isScreenBroken && !isBatteryBroken && !isPeliculaBroken && !isCapaBroken && d.notes ? (
                                    <span className="text-zinc-600 text-[8px]">{d.notes}</span>
                                  ) : !isScreenBroken && !isBatteryBroken && !isPeliculaBroken && !isCapaBroken ? (
                                    <span className="text-zinc-400">—</span>
                                  ) : null}
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
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">N° PATRIMÔNIO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[24%]">COLABORADOR / USUÁRIO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[11%]">MARCA</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[17%]">MODELO</th>
                                    {showAccessoriesColumn && (
                                      <th className="border border-zinc-400 py-1.5 px-1.5 w-[18%]">ACESSÓRIOS PADRÃO</th>
                                    )}
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[7%]">VPN</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">AQUISIÇÃO</th>
                                    <th className="border border-zinc-400 py-1.5 px-1.5 w-[11%]">STATUS</th>
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
                                      <td className="border border-zinc-300 py-1.5 px-2 font-medium uppercase">
                                        {d.brand}
                                      </td>
                                      <td className="border border-zinc-300 py-1.5 px-2 font-medium">
                                        <span>{d.model}</span>
                                        {d.imei1 && (
                                          <span className="text-[9px] text-zinc-500 block font-mono">
                                            IMEI: {d.imei1}
                                          </span>
                                        )}
                                      </td>
                                      {showAccessoriesColumn && renderStandardAccessoriesCell(d)}
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
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">N° PATRIMÔNIO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[20%]">COLABORADOR / USUÁRIO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">MARCA</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[15%]">MODELO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[12%]">SETOR</th>
                              {showAccessoriesColumn && (
                                <th className="border border-zinc-400 py-1.5 px-1.5 w-[16%]">ACESSÓRIOS PADRÃO</th>
                              )}
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[6%]">VPN</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[9%]">AQUISIÇÃO</th>
                              <th className="border border-zinc-400 py-1.5 px-1.5 w-[10%]">STATUS</th>
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
                                <td className="border border-zinc-300 py-1.5 px-2 uppercase">{d.brand}</td>
                                <td className="border border-zinc-300 py-1.5 px-2 font-medium">{d.model}</td>
                                <td className="border border-zinc-300 py-1.5 px-2">{d.sector}</td>
                                {showAccessoriesColumn && renderStandardAccessoriesCell(d)}
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
              Modo: <strong>{reportMode === 'AUDITORIA' ? 'Relatório Exclusivo de Auditoria' : 'Planilha Padrão dos Celulares (Sem Auditoria)'}</strong> · Total listado: <strong>{filtered.length} aparelho(s)</strong>
            </span>
            <div className="flex items-center gap-2">
              {reportMode === 'AUDITORIA' && (
                <button
                  onClick={() => setIsAdvancedModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Filtro Avançado de Auditoria
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
