import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Filter, 
  Check, 
  Layers, 
  Building,
  Shield,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Plug,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { Device, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS } from '../types/device';
import { matchAdvancedCriteria, countActiveAdvancedFilters } from '../utils/filterUtils';
import { AdvancedFilterModal } from './AdvancedFilterModal';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  stores: string[];
  sectors: string[];
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  devices,
  stores,
  sectors,
}) => {
  const [selectedStore, setSelectedStore] = useState<string>('TODAS');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [groupBySector, setGroupBySector] = useState<boolean>(true);
  const [includeOccurrences, setIncludeOccurrences] = useState<boolean>(false);
  const [showAccessoriesColumn, setShowAccessoriesColumn] = useState<boolean>(true);

  // Janelinha de Filtro Avançado de Acessórios & Estado
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState<boolean>(false);
  const [advancedCriteria, setAdvancedCriteria] = useState<AdvancedFilterCriteria>(INITIAL_ADVANCED_FILTERS);

  if (!isOpen) return null;

  // Filtra aparelhos com base em todos os critérios, incluindo acessórios e estado
  const filtered = devices.filter((d) => {
    if (selectedStore !== 'TODAS' && d.store !== selectedStore) return false;
    if (selectedSector !== 'TODOS' && d.sector !== selectedSector) return false;
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    if (!matchAdvancedCriteria(d, advancedCriteria)) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const activeAdvCount = countActiveAdvancedFilters(advancedCriteria);

  // Remove um acessório específico do filtro
  const removeAccessoryFilter = (acc: string) => {
    setAdvancedCriteria((prev) => ({
      ...prev,
      accessories: prev.accessories.filter((a) => a !== acc),
    }));
  };

  // Remove uma categoria de condição
  const removeConditionCategory = (cat: string) => {
    setAdvancedCriteria((prev) => ({
      ...prev,
      conditionCategories: prev.conditionCategories.filter((c) => c !== cat),
    }));
  };

  // Limpa todos os filtros avançados
  const clearAdvancedFilters = () => {
    setAdvancedCriteria(INITIAL_ADVANCED_FILTERS);
  };

  // Agrupa dispositivos por loja
  const storesToRender = selectedStore === 'TODAS' 
    ? Array.from(new Set(filtered.map((d) => d.store))) 
    : [selectedStore];

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Monta texto descritivo dos filtros ativos para o cabeçalho impresso
  const getFilterSummaryText = () => {
    const parts: string[] = [];
    if (advancedCriteria.accessories.length > 0) {
      const modeText = advancedCriteria.accessoryMode === 'has' ? 'Com' : 'Sem';
      parts.push(`${modeText} ${advancedCriteria.accessories.join(', ')}`);
    }
    if (advancedCriteria.conditionCategories.length > 0) {
      const condLabels = advancedCriteria.conditionCategories.map((c) => {
        if (c === 'TELA_QUEBRADA') return 'Tela Quebrada/Trincada';
        if (c === 'COM_AVARIAS') return 'Com Avarias';
        if (c === 'BATERIA_DEFEITO') return 'Bateria/Conector';
        if (c === 'EM_REPARO') return 'Em Manutenção';
        if (c === 'NOVO') return 'Novo';
        return c;
      });
      parts.push(`Condição: ${condLabels.join(', ')}`);
    }
    if (advancedCriteria.conditionCustomText.trim()) {
      parts.push(`Anotação: "${advancedCriteria.conditionCustomText}"`);
    }
    if (advancedCriteria.vpnFilter !== 'ALL') {
      parts.push(advancedCriteria.vpnFilter === 'WITH_VPN' ? 'Com VPN' : 'Sem VPN');
    }
    return parts.join(' | ');
  };

  const filterSummary = getFilterSummaryText();

  const renderAccessoriesAndConditionCell = (d: Device) => {
    const condUpper = (d.condition || '').toUpperCase();
    const notesLower = (d.notes || '').toLowerCase();
    const occText = (d.occurrences || []).map((o) => `${o.title} ${o.description}`).join(' ').toLowerCase();

    const isTelaDefect = condUpper.includes('TRINC') || condUpper.includes('QUEBRAD') || notesLower.includes('tela') || notesLower.includes('display') || occText.includes('tela') || occText.includes('display');
    const isBatteryDefect = notesLower.includes('bateria') || notesLower.includes('conector') || notesLower.includes('carga') || occText.includes('bateria') || occText.includes('conector');
    const isAvariaDefect = condUpper.includes('AVARIA') || notesLower.includes('avaria') || notesLower.includes('defeito') || notesLower.includes('risco') || notesLower.includes('amassado') || occText.includes('avaria');
    const isReparoDefect = condUpper.includes('REPARO') || d.status === 'MANUTENÇÃO';

    return (
      <td className="border border-zinc-300 py-1.5 px-2 text-[10px] min-w-[200px] max-w-[320px]">
        {/* Acessórios vinculados */}
        <div className="font-semibold text-zinc-900 leading-snug">
          {d.accessories && d.accessories.length > 0 ? (
            <span>{d.accessories.join(', ')}</span>
          ) : (
            <span className="text-zinc-400 italic">Sem acessórios vinculados</span>
          )}
        </div>

        {/* Badges de Estado e Defeitos identificados */}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
            condUpper === 'NOVO'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : isTelaDefect || isBatteryDefect || isAvariaDefect || isReparoDefect
                ? 'bg-red-50 text-red-900 border border-red-300'
                : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
          }`}>
            ESTADO: {d.condition || 'BOM'}
          </span>

          {isTelaDefect && (
            <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase bg-red-100 text-red-900 border border-red-400">
              🔨 TELA QUEBRADA / TRINCADA
            </span>
          )}

          {isBatteryDefect && (
            <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase bg-orange-100 text-orange-950 border border-orange-400">
              🔋 BATERIA / CARGA
            </span>
          )}

          {isAvariaDefect && !isTelaDefect && (
            <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase bg-amber-100 text-amber-950 border border-amber-400">
              ⚠️ COM AVARIAS
            </span>
          )}

          {isReparoDefect && (
            <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase bg-blue-100 text-blue-900 border border-blue-300">
              🛠️ EM MANUTENÇÃO
            </span>
          )}
        </div>

        {/* DESCRIÇÃO DA FICHA: TELA QUEBRADA, BATERIA, ETC. */}
        {d.notes && d.notes.trim() && (
          <div className="mt-1.5 p-1.5 bg-red-50/90 border border-red-300 rounded text-[9.5px] leading-tight text-red-950">
            <span className="font-bold text-red-800 block text-[9px] uppercase tracking-wide">
              Descrição da Ficha (Avaria / Defeito):
            </span>
            <span className="font-semibold text-black">{d.notes}</span>
          </div>
        )}

        {/* Ocorrências com histórico de reparo ou manutenção */}
        {d.occurrences && d.occurrences.length > 0 && d.occurrences.some(o => 
          (o.title + ' ' + o.description).toLowerCase().includes('tela') ||
          (o.title + ' ' + o.description).toLowerCase().includes('bateria') ||
          (o.title + ' ' + o.description).toLowerCase().includes('avaria') ||
          (o.title + ' ' + o.description).toLowerCase().includes('reparo') ||
          (o.title + ' ' + o.description).toLowerCase().includes('defeito') ||
          o.type === 'MANUTENÇÃO'
        ) && (
          <div className="mt-1 space-y-0.5">
            {d.occurrences
              .filter(o => 
                (o.title + ' ' + o.description).toLowerCase().includes('tela') ||
                (o.title + ' ' + o.description).toLowerCase().includes('bateria') ||
                (o.title + ' ' + o.description).toLowerCase().includes('avaria') ||
                (o.title + ' ' + o.description).toLowerCase().includes('reparo') ||
                (o.title + ' ' + o.description).toLowerCase().includes('defeito') ||
                o.type === 'MANUTENÇÃO'
              )
              .map(occ => (
                <div key={occ.id} className="p-1 bg-zinc-50 border border-zinc-300 rounded text-[8.5px] text-zinc-900 leading-tight">
                  <span className="font-bold text-red-700">[{occ.type}] </span>
                  <span className="font-semibold">{occ.title}:</span> {occ.description}
                </div>
              ))
            }
          </div>
        )}
      </td>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
          
          {/* Controls Toolbar (Oculto na Impressão) */}
          <div className="no-print px-6 py-4 border-b border-zinc-200 bg-zinc-950 text-white flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Filtro & Exportação de Relatório PDF
                  </h2>
                  <p className="text-xs text-zinc-300">
                    Modelo oficial Amilco Home Center (separado por grupos e unidades)
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

            {/* Linha 1 de Filtros do Relatório */}
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

              {/* Botão para abrir a Janelinha de Acessórios & Estado da Tela */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1 text-[11px]">
                  Filtro Completo:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAdvancedModalOpen(true)}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    activeAdvCount > 0
                      ? 'bg-red-600 text-white border-red-500 shadow-sm ring-1 ring-white/20'
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700'
                  }`}
                  title="Abrir janela com filtros de carregador, capa, tela quebrada e avarias"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">Acessórios & Estado</span>
                  {activeAdvCount > 0 && (
                    <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                      {activeAdvCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Linha 2 de Opções e Tags de Filtros Ativos */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900 text-xs">
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

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-200 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeOccurrences}
                    onChange={(e) => setIncludeOccurrences(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px]">Incluir Fichário / O.S.</span>
                </label>
              </div>

              {/* Botão de abrir janelinha e limpar */}
              {activeAdvCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 font-medium">Filtro Ativo:</span>
                  {advancedCriteria.accessories.map((acc) => (
                    <span
                      key={acc}
                      className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold"
                    >
                      {advancedCriteria.accessoryMode === 'has' ? '🔌 Com ' : '🔴 Sem '}{acc}
                      <button
                        onClick={() => removeAccessoryFilter(acc)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {advancedCriteria.conditionCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold"
                    >
                      {cat === 'TELA_QUEBRADA' ? '🔨 Tela Trincada' : cat}
                      <button
                        onClick={() => removeConditionCategory(cat)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearAdvancedFilters}
                    className="text-[10px] font-bold text-zinc-400 hover:text-white underline ml-1 cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Printable PDF Canvas - Modelo Oficial Amilco Home Center */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0 print:m-0 space-y-6 text-black text-xs font-sans">
            {/* Header Document */}
            <div className="border-b-2 border-black pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black uppercase">
                  AMILCO HOME CENTER
                </h1>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  RELATÓRIO DE CONTROLE DE PATRIMÔNIO DE CELULARES
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
                <p className="text-purple-950">Aparelhos Pessoais: <strong className="font-bold">{filtered.filter(d => Boolean(d.isPersonalDevice)).length}</strong></p>
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
                  Experimente abrir o botão <strong>"Acessórios & Estado"</strong> para ajustar os critérios.
                </p>
                <button
                  onClick={clearAdvancedFilters}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  Limpar Filtros Avançados
                </button>
              </div>
            )}

            {/* Render by Store Sections */}
            {storesToRender.map((storeName) => {
              const storeDevices = filtered.filter((d) => d.store === storeName);
              if (storeDevices.length === 0) return null;

              // Grupos de setores
              const sectorGroups = Array.from(new Set(storeDevices.map((d) => d.sector)));

              return (
                <div key={storeName} className="space-y-4 page-break-inside-avoid">
                  {/* Store Header Banner in Amilco Red & Black */}
                  <div className="bg-zinc-950 text-white p-2 px-3 rounded flex items-center justify-between border-l-4 border-red-600">
                    <h2 className="font-bold text-xs uppercase tracking-wider">
                      CONTROLE DE PATRIMÔNIO DE CELULARES DA EMPRESA AMILCO HOME CENTER - {storeName}
                    </h2>
                    <span className="text-xs font-mono font-bold bg-red-600 px-2 py-0.5 rounded">
                      {storeDevices.length} APARELHOS
                    </span>
                  </div>

                  {groupBySector ? (
                    // Agrupado por setores igual ao PDF original
                    sectorGroups.map((secName) => {
                      const secDevices = storeDevices.filter((d) => d.sector === secName);
                      return (
                        <div key={secName} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800 bg-zinc-100 px-2 py-1 border border-zinc-300 rounded">
                            <span className="uppercase text-red-700">SETOR: {secName}</span>
                            <span className="font-mono text-zinc-600">{secDevices.length} aparelho(s)</span>
                          </div>

                          <table className="w-full border-collapse border border-zinc-400 text-left text-[11px]">
                            <thead>
                              <tr className="bg-zinc-200 text-black font-bold uppercase text-[10px]">
                                <th className="border border-zinc-400 py-1.5 px-2 w-[85px]">N° PATRIMÔNIO</th>
                                <th className="border border-zinc-400 py-1.5 px-2">COLABORADOR / USUÁRIO</th>
                                <th className="border border-zinc-400 py-1.5 px-2">MODELO</th>
                                {showAccessoriesColumn && (
                                  <th className="border border-zinc-400 py-1.5 px-2">ACESSÓRIOS & ESTADO</th>
                                )}
                                <th className="border border-zinc-400 py-1.5 px-2 w-[70px]">VPN</th>
                                <th className="border border-zinc-400 py-1.5 px-2 w-[85px]">AQUISIÇÃO</th>
                                <th className="border border-zinc-400 py-1.5 px-2 w-[90px]">STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {secDevices.map((d) => {
                                const isTelaTrincada = (d.condition || '').toUpperCase().includes('TRINC') || (d.condition || '').toUpperCase().includes('QUEBRAD');
                                return (
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
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  ) : (
                    // Tabela consolidada da loja
                    <table className="w-full border-collapse border border-zinc-400 text-left text-[11px]">
                      <thead>
                        <tr className="bg-zinc-200 text-black font-bold uppercase text-[10px]">
                          <th className="border border-zinc-400 py-1.5 px-2 w-[85px]">N° PATRIMÔNIO</th>
                          <th className="border border-zinc-400 py-1.5 px-2">COLABORADOR / USUÁRIO</th>
                          <th className="border border-zinc-400 py-1.5 px-2">SETOR</th>
                          <th className="border border-zinc-400 py-1.5 px-2">MODELO</th>
                          {showAccessoriesColumn && (
                            <th className="border border-zinc-400 py-1.5 px-2">ACESSÓRIOS & ESTADO</th>
                          )}
                          <th className="border border-zinc-400 py-1.5 px-2 w-[70px]">VPN</th>
                          <th className="border border-zinc-400 py-1.5 px-2 w-[90px]">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeDevices.map((d) => {
                          const isTelaTrincada = (d.condition || '').toUpperCase().includes('TRINC') || (d.condition || '').toUpperCase().includes('QUEBRAD');
                          return (
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
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal Bottom Toolbar */}
          <div className="no-print px-6 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 text-xs text-zinc-600 shrink-0">
            <span>
              Total no Relatório: <strong>{filtered.length} aparelhos</strong>
              {activeAdvCount > 0 && ` (com ${activeAdvCount} filtro(s) avançados ativos)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdvancedModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Configurar Acessórios / Tela
              </button>
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
