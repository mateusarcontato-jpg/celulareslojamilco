import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  SlidersHorizontal, 
  Smartphone, 
  Plug, 
  ShieldCheck, 
  Wrench, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw,
  Search,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  History
} from 'lucide-react';
import { Device, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS } from '../types/device';
import { matchAdvancedCriteria } from '../utils/filterUtils';

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: AdvancedFilterCriteria;
  onApplyCriteria: (newCriteria: AdvancedFilterCriteria) => void;
  devices: Device[];
}

const COMMON_ACCESSORIES_LIST = [
  { id: 'Carregador', label: 'Carregador Original', icon: '🔌' },
  { id: 'Capa', label: 'Capa Protetora', icon: '🛡️' },
  { id: 'Película', label: 'Película de Vidro', icon: '📱' },
  { id: 'Cabo', label: 'Cabo USB-C', icon: '⚡' },
  { id: 'Veicular', label: 'Carregador Veicular', icon: '🚗' },
  { id: 'Fone', label: 'Fone de Ouvido', icon: '🎧' },
  { id: 'Caixa', label: 'Caixa / Manual', icon: '📦' },
];

const CONDITION_PRESETS = [
  { id: 'TELA_QUEBRADA', label: 'Tela Quebrada / Trincada', icon: '🔨', color: 'border-red-500 bg-red-50 text-red-900' },
  { id: 'COM_AVARIAS', label: 'Com Avarias / Desgaste', icon: '⚠️', color: 'border-amber-500 bg-amber-50 text-amber-900' },
  { id: 'BATERIA_DEFEITO', label: 'Bateria / Conector de Carga', icon: '🔋', color: 'border-orange-500 bg-orange-50 text-orange-900' },
  { id: 'EM_REPARO', label: 'Em Reparo / Manutenção', icon: '🛠️', color: 'border-blue-500 bg-blue-50 text-blue-900' },
  { id: 'BOM', label: 'Bom Estado', icon: '👍', color: 'border-zinc-400 bg-zinc-50 text-zinc-900' },
  { id: 'NOVO', label: 'Novo / Excelente', icon: '✨', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  criteria,
  onApplyCriteria,
  devices,
}) => {
  const [localCriteria, setLocalCriteria] = useState<AdvancedFilterCriteria>(criteria);

  // Sincroniza estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalCriteria(criteria);
    }
  }, [isOpen, criteria]);

  if (!isOpen) return null;

  // Toggle acessório
  const toggleAccessory = (accId: string) => {
    setLocalCriteria((prev) => {
      const exists = prev.accessories.includes(accId);
      const updated = exists 
        ? prev.accessories.filter((a) => a !== accId)
        : [...prev.accessories, accId];
      return { ...prev, accessories: updated };
    });
  };

  // Toggle categoria de condição
  const toggleConditionCategory = (catId: string) => {
    setLocalCriteria((prev) => {
      const exists = prev.conditionCategories.includes(catId);
      const updated = exists 
        ? prev.conditionCategories.filter((c) => c !== catId)
        : [...prev.conditionCategories, catId];
      return { ...prev, conditionCategories: updated };
    });
  };

  // Contagem de aparelhos em tempo real para o filtro atual
  const matchingCount = devices.filter((d) => matchAdvancedCriteria(d, localCriteria)).length;

  const handleApply = () => {
    onApplyCriteria(localCriteria);
    onClose();
  };

  const handleReset = () => {
    setLocalCriteria(INITIAL_ADVANCED_FILTERS);
  };

  // Auxiliares de contagem individual por acessório
  const countWithAccessory = (accLabel: string) => {
    return devices.filter((d) => 
      (d.accessories || []).some((a) => a.toLowerCase().includes(accLabel.toLowerCase()))
    ).length;
  };

  // Auxiliares de contagem por tela quebrada
  const countTelaQuebrada = devices.filter((d) => {
    const condStr = (d.condition || '').toUpperCase();
    const notesStr = (d.notes || '').toLowerCase();
    const occStr = (d.occurrences || []).map((o) => `${o.title} ${o.description}`).join(' ').toLowerCase();
    return condStr.includes('TRINC') || condStr.includes('QUEBRAD') || notesStr.includes('tela') || occStr.includes('tela');
  }).length;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between border-b-2 border-red-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Filtro de Acessórios & Estado Físico
              </h2>
              <p className="text-xs text-zinc-300">
                Selecione quem possui carregador, capa, tela trincada, avarias ou recursos
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-zinc-900 leading-relaxed font-sans">
          
          {/* SEÇÃO 1: FILTRO DE ACESSÓRIOS */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <span className="font-bold text-black uppercase text-xs">
                  Filtro por Acessórios do Celular
                </span>
              </div>

              {/* Seletor de Modo: Quem TEM vs Quem NÃO TEM */}
              <div className="flex items-center bg-zinc-200 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setLocalCriteria((prev) => ({ ...prev, accessoryMode: 'has' }))}
                  className={`px-3 py-1 rounded-md transition-all ${
                    localCriteria.accessoryMode === 'has'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  🟢 Quem Possui o Acessório
                </button>
                <button
                  type="button"
                  onClick={() => setLocalCriteria((prev) => ({ ...prev, accessoryMode: 'missing' }))}
                  className={`px-3 py-1 rounded-md transition-all ${
                    localCriteria.accessoryMode === 'missing'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-zinc-700 hover:text-black'
                  }`}
                >
                  🔴 Quem NÃO Possui (Faltando)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600">
              {localCriteria.accessoryMode === 'has'
                ? 'Listar colaboradores que receberam e possuem os seguintes itens vinculados:'
                : 'Listar colaboradores que estão SEM os seguintes itens vinculados no inventário:'}
            </p>

            {/* Chips de Acessórios */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {COMMON_ACCESSORIES_LIST.map((item) => {
                const isSelected = localCriteria.accessories.includes(item.id);
                const count = countWithAccessory(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAccessory(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50 font-bold text-red-950 shadow-2xs ring-1 ring-red-600'
                        : 'border-zinc-300 bg-white hover:border-zinc-400 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1 ${
                      isSelected ? 'bg-red-200 text-red-900 font-bold' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: ESTADO DA TELA, CONDIÇÃO & AVARIAS */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span className="font-bold text-black uppercase text-xs">
                  Condição Física, Tela & Defeitos
                </span>
              </div>
              <span className="text-[11px] text-red-600 font-semibold">
                {countTelaQuebrada} com registro de tela
              </span>
            </div>

            <p className="text-[11px] text-zinc-600">
              Selecione o estado físico ou informe avarias específicas (tela trincada, bateria, carcaça):
            </p>

            {/* Presets de Condição */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONDITION_PRESETS.map((preset) => {
                const isSelected = localCriteria.conditionCategories.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleConditionCategory(preset.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${preset.color} font-bold shadow-2xs ring-2 ring-red-600`
                        : 'border-zinc-300 bg-white hover:border-zinc-400 text-zinc-800'
                    }`}
                  >
                    <span className="text-sm">{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Busca textual de avaria específica */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Ou buscar por defeito / anotação específica:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: tela trincada, lente da câmera, alto falante, molhou, botão quebrado..."
                  value={localCriteria.conditionCustomText}
                  onChange={(e) => setLocalCriteria((prev) => ({ ...prev, conditionCustomText: e.target.value }))}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: RECURSOS CORPORATIVOS E PATRIMÔNIO */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span className="font-bold text-black uppercase text-xs">
                Recursos, Tombamento & Histórico
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* VPN */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  VPN Corporativa:
                </label>
                <select
                  value={localCriteria.vpnFilter}
                  onChange={(e) => setLocalCriteria((prev) => ({ ...prev, vpnFilter: e.target.value as any }))}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Todas as situações</option>
                  <option value="WITH_VPN">🔒 Apenas Com VPN</option>
                  <option value="WITHOUT_VPN">Sem VPN</option>
                </select>
              </div>

              {/* Plaqueta de Patrimônio */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Plaqueta de Patrimônio:
                </label>
                <select
                  value={localCriteria.tagFilter}
                  onChange={(e) => setLocalCriteria((prev) => ({ ...prev, tagFilter: e.target.value as any }))}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Todas as situações</option>
                  <option value="WITH_TAG">🏷️ Com Plaqueta (Tombados da Loja)</option>
                  <option value="SEM_PT">❓ Sem Plaqueta (SEM PT da Loja)</option>
                  <option value="PESSOAL">📱 Celular Pessoal do Colaborador</option>
                </select>
              </div>

              {/* Linha Telefônica */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Chip / Linha Móvel:
                </label>
                <select
                  value={localCriteria.hasPhoneLine}
                  onChange={(e) => setLocalCriteria((prev) => ({ ...prev, hasPhoneLine: e.target.value as any }))}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-red-600"
                >
                  <option value="ALL">Todas as situações</option>
                  <option value="WITH_LINE">📞 Com Linha Telefônica</option>
                  <option value="WITHOUT_LINE">Sem Linha Telefônica</option>
                </select>
              </div>
            </div>

            {/* Checkbox apenas com ocorrências */}
            <div className="pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-zinc-800">
                <input
                  type="checkbox"
                  checked={localCriteria.hasOccurrencesOnly}
                  onChange={(e) => setLocalCriteria((prev) => ({ ...prev, hasOccurrencesOnly: e.target.checked }))}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span>Apenas aparelhos que possuem ocorrências ou manutenções registradas no fichário</span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer com Contagem em Tempo Real */}
        <div className="px-5 py-3.5 bg-zinc-100 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 font-medium">Resultado:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
              {matchingCount} de {devices.length} aparelhos
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Limpar Filtros</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Filtro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
