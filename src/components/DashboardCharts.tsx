import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Device } from '../types/device';

interface DashboardChartsProps {
  devices: Device[];
  currentStore: string;
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

type StatusCategory = 'Ativo' | 'Em Manutenção' | 'Inativo';

export const categorizeDeviceStatus = (device: Device): StatusCategory => {
  if (device.status === 'MANUTENÇÃO' || device.condition === 'EM REPARO') {
    return 'Em Manutenção';
  }
  if (
    device.status === 'DISPONÍVEL' ||
    device.status === 'PERDA / EXTRAVIO' ||
    device.status === 'DESCARTADO' ||
    device.condition === 'EXTRAVIADO'
  ) {
    return 'Inativo';
  }
  return 'Ativo';
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  devices,
  currentStore,
  selectedSector,
  onSelectSector,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartView, setChartView] = useState<'stacked' | 'grouped'>('stacked');

  const storeFilteredDevices = useMemo(() => {
    if (currentStore === 'TODAS') return devices;
    return devices.filter((d) => d.store === currentStore);
  }, [devices, currentStore]);

  const sectorDistributionData = useMemo(() => {
    const sectorMap = new Map<
      string,
      {
        sector: string;
        Ativo: number;
        'Em Manutenção': number;
        Inativo: number;
        total: number;
      }
    >();

    storeFilteredDevices.forEach((device) => {
      const sectorName = (device.sector || 'OUTROS').trim().toUpperCase();
      if (!sectorMap.has(sectorName)) {
        sectorMap.set(sectorName, {
          sector: sectorName,
          Ativo: 0,
          'Em Manutenção': 0,
          Inativo: 0,
          total: 0,
        });
      }

      const entry = sectorMap.get(sectorName)!;
      const category = categorizeDeviceStatus(device);
      entry[category] += 1;
      entry.total += 1;
    });

    return Array.from(sectorMap.values()).sort((a, b) => b.total - a.total);
  }, [storeFilteredDevices]);

  const statusSummaryData = useMemo(() => {
    const counts = {
      Ativo: 0,
      'Em Manutenção': 0,
      Inativo: 0,
    };

    storeFilteredDevices.forEach((device) => {
      const cat = categorizeDeviceStatus(device);
      counts[cat] += 1;
    });

    return [
      {
        name: 'Ativo',
        quantidade: counts['Ativo'],
        color: '#10b981',
      },
      {
        name: 'Em Manutenção',
        quantidade: counts['Em Manutenção'],
        color: '#f59e0b',
      },
      {
        name: 'Inativo',
        quantidade: counts['Inativo'],
        color: '#71717a',
      },
    ];
  }, [storeFilteredDevices]);

  const totalActive = statusSummaryData[0].quantidade;
  const totalMaintenance = statusSummaryData[1].quantidade;
  const totalInactive = statusSummaryData[2].quantidade;
  const totalDevices = storeFilteredDevices.length;

  return (
    <section
      aria-label="Visualização de Dados do Patrimônio"
      className="bg-white border border-zinc-200/90 rounded-xl mb-5 shadow-2xs no-print overflow-hidden"
    >
      {/* Barra Superior Compacta e Integrada */}
      <div className="px-4 py-3 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-600 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Análise de Distribuição por Setor e Status
            </h3>
          </div>

          <span className="text-zinc-300 hidden sm:inline">·</span>

          {/* Indicadores Resumidos Inline */}
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ativo:</span>
              <strong className="font-mono-nums text-zinc-900">{totalActive}</strong>
            </span>
            <span className="text-zinc-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Em Manutenção:</span>
              <strong className="font-mono-nums text-zinc-900">{totalMaintenance}</strong>
            </span>
            <span className="text-zinc-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Inativo:</span>
              <strong className="font-mono-nums text-zinc-900">{totalInactive}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {selectedSector !== 'TODOS' && (
            <button
              type="button"
              onClick={() => onSelectSector('TODOS')}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            >
              <Filter className="w-3 h-3" />
              <span>Setor: {selectedSector} (Limpar)</span>
            </button>
          )}

          {isExpanded && (
            <div
              role="group"
              aria-label="Modo de exibição das barras"
              className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[11px]"
            >
              <button
                type="button"
                onClick={() => setChartView('stacked')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  chartView === 'stacked'
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Empilhado
              </button>
              <button
                type="button"
                onClick={() => setChartView('grouped')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  chartView === 'grouped'
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Agrupado
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Recolher' : 'Expandir Gráficos'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Gráfico 1: Distribuição por Setor e Status */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                Aparelhos por Setor (Clique em uma barra para filtrar a tabela)
              </span>
              <span className="text-[11px] text-zinc-400 font-mono-nums">
                {sectorDistributionData.length} setores
              </span>
            </div>

            <div className="w-full h-56" data-testid="sector-status-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorDistributionData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 20 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      const clickedSector = String(state.activeLabel);
                      onSelectSector(
                        selectedSector === clickedSector ? 'TODOS' : clickedSector
                      );
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis
                    dataKey="sector"
                    tick={{ fontSize: 10, fill: '#52525b', fontWeight: 600 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={44}
                    stroke="#e4e4e7"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    stroke="#e4e4e7"
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '8px 10px',
                    }}
                    itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                    labelStyle={{ fontWeight: 700, marginBottom: '4px', color: '#f4f4f5' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={26}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="Ativo"
                    name="Ativo"
                    stackId={chartView === 'stacked' ? 'status' : undefined}
                    fill="#10b981"
                    radius={chartView === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    cursor="pointer"
                  />
                  <Bar
                    dataKey="Em Manutenção"
                    name="Em Manutenção"
                    stackId={chartView === 'stacked' ? 'status' : undefined}
                    fill="#f59e0b"
                    radius={chartView === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    cursor="pointer"
                  />
                  <Bar
                    dataKey="Inativo"
                    name="Inativo"
                    stackId={chartView === 'stacked' ? 'status' : undefined}
                    fill="#71717a"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Consolidado por Status Operacional */}
          <div className="lg:border-l lg:border-zinc-100 lg:pl-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                Consolidado por Status
              </span>
              <span className="text-[11px] text-zinc-400 font-mono-nums">
                Total: {totalDevices}
              </span>
            </div>

            <div className="w-full h-56" data-testid="overall-status-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusSummaryData}
                  margin={{ top: 16, right: 12, left: -18, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#3f3f46', fontWeight: 600 }}
                    stroke="#e4e4e7"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    stroke="#e4e4e7"
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                    }}
                    formatter={(value) => [`${value ?? 0} aparelho(s)`, 'Quantidade']}
                  />
                  <Bar
                    dataKey="quantidade"
                    name="Aparelhos"
                    radius={[5, 5, 0, 0]}
                    barSize={38}
                  >
                    {statusSummaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
