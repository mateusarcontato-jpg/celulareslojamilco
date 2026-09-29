import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Filter, 
  Check, 
  Layers, 
  Building,
  Shield
} from 'lucide-react';
import { Device, ReportFilterOptions } from '../types/device';

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

  if (!isOpen) return null;

  // Filter devices based on PDF settings
  const filtered = devices.filter((d) => {
    if (selectedStore !== 'TODAS' && d.store !== selectedStore) return false;
    if (selectedSector !== 'TODOS' && d.sector !== selectedSector) return false;
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  // Group devices by store then by sector if requested
  const storesToRender = selectedStore === 'TODAS' 
    ? Array.from(new Set(filtered.map((d) => d.store))) 
    : [selectedStore];

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Controls Toolbar (hidden during print) */}
        <div className="no-print px-6 py-4 border-b border-zinc-200 bg-zinc-950 text-white flex flex-col gap-3">
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

          {/* Filtros do Relatório */}
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

            <div className="flex flex-col justify-end gap-1">
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
                  checked={includeOccurrences}
                  onChange={(e) => setIncludeOccurrences(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span className="text-[11px]">Incluir Fichário / O.S.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable PDF Canvas - Exact Layout matching User's PDF */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0 print:m-0 space-y-6 text-black text-xs font-sans">
          {/* Header */}
          <div className="border-b-2 border-black pb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black uppercase">
                AMILCO HOME CENTER
              </h1>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                RELATÓRIO DE CONTROLE DE PATRIMÔNIO DE CELULARES
              </p>
            </div>
            <div className="text-right text-[11px] text-zinc-600 font-mono">
              <p>Emissão: <strong>{currentDate}</strong></p>
              <p>Total Listado: <strong className="text-black font-bold">{filtered.length} Aparelhos</strong></p>
            </div>
          </div>

          {/* Render by Store Sections */}
          {storesToRender.map((storeName) => {
            const storeDevices = filtered.filter((d) => d.store === storeName);
            if (storeDevices.length === 0) return null;

            // Get groups
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
                  // Grouped by sectors like the PDF
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
                              <th className="border border-zinc-400 py-1.5 px-2">N° PATRIMÔNIO</th>
                              <th className="border border-zinc-400 py-1.5 px-2">NOME</th>
                              <th className="border border-zinc-400 py-1.5 px-2">MARCA</th>
                              <th className="border border-zinc-400 py-1.5 px-2">MODELO</th>
                              <th className="border border-zinc-400 py-1.5 px-2">SETOR</th>
                              <th className="border border-zinc-400 py-1.5 px-2">DATA AQUISIÇÃO</th>
                              <th className="border border-zinc-400 py-1.5 px-2">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {secDevices.map((d) => (
                              <tr key={d.id} className="hover:bg-zinc-50 border-b border-zinc-300">
                                <td className="border border-zinc-300 py-1 px-2 font-mono font-bold">
                                  {d.hasAssetTag ? d.assetNumber : 'SEM PT'}
                                </td>
                                <td className="border border-zinc-300 py-1 px-2 font-semibold">
                                  {d.employeeName} {d.hasVpn ? '(vpn)' : ''}
                                  {d.previousEmployeeName && (
                                    <span className="text-[10px] text-zinc-500 block">
                                      (Anterior: {d.previousEmployeeName})
                                    </span>
                                  )}
                                </td>
                                <td className="border border-zinc-300 py-1 px-2">{d.brand}</td>
                                <td className="border border-zinc-300 py-1 px-2 font-medium">{d.model}</td>
                                <td className="border border-zinc-300 py-1 px-2">{d.sector}</td>
                                <td className="border border-zinc-300 py-1 px-2 font-mono">{d.acquisitionDate}</td>
                                <td className="border border-zinc-300 py-1 px-2 font-semibold">
                                  {d.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                ) : (
                  // Single table per store
                  <table className="w-full border-collapse border border-zinc-400 text-left text-[11px]">
                    <thead>
                      <tr className="bg-zinc-200 text-black font-bold uppercase text-[10px]">
                        <th className="border border-zinc-400 py-1.5 px-2">N° PATRIMÔNIO</th>
                        <th className="border border-zinc-400 py-1.5 px-2">NOME</th>
                        <th className="border border-zinc-400 py-1.5 px-2">MARCA</th>
                        <th className="border border-zinc-400 py-1.5 px-2">MODELO</th>
                        <th className="border border-zinc-400 py-1.5 px-2">SETOR</th>
                        <th className="border border-zinc-400 py-1.5 px-2">DATA AQUISIÇÃO</th>
                        <th className="border border-zinc-400 py-1.5 px-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeDevices.map((d) => (
                        <tr key={d.id} className="hover:bg-zinc-50 border-b border-zinc-300">
                          <td className="border border-zinc-300 py-1 px-2 font-mono font-bold">
                            {d.hasAssetTag ? d.assetNumber : 'SEM PT'}
                          </td>
                          <td className="border border-zinc-300 py-1 px-2 font-semibold">
                            {d.employeeName} {d.hasVpn ? '(vpn)' : ''}
                            {d.previousEmployeeName && (
                              <span className="text-[10px] text-zinc-500 block">
                                (Anterior: {d.previousEmployeeName})
                              </span>
                            )}
                          </td>
                          <td className="border border-zinc-300 py-1 px-2">{d.brand}</td>
                          <td className="border border-zinc-300 py-1 px-2 font-medium">{d.model}</td>
                          <td className="border border-zinc-300 py-1 px-2">{d.sector}</td>
                          <td className="border border-zinc-300 py-1 px-2 font-mono">{d.acquisitionDate}</td>
                          <td className="border border-zinc-300 py-1 px-2 font-semibold">{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Subtotal da Loja */}
                <div className="flex justify-end pt-1">
                  <div className="border border-black bg-zinc-100 px-4 py-1 text-xs font-bold text-black flex items-center gap-4">
                    <span>{storeName.replace('LOJA ', '')}:</span>
                    <span className="font-mono text-red-700">{storeDevices.length} APARELHOS</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand Total Box (Matching Page 5 of User's PDF) */}
          <div className="border-t-2 border-black pt-4 flex justify-end">
            <div className="border-2 border-black bg-zinc-950 text-white p-3 px-6 text-sm font-bold flex items-center gap-6">
              <span className="uppercase tracking-wider">TOTAL CONSOLIDADO:</span>
              <span className="text-xl font-mono text-red-500">{filtered.length} APARELHOS</span>
            </div>
          </div>

          {/* Cláusula / Assinatura do Relatório */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-black pt-1 mx-auto w-10/12"></div>
              <p className="font-bold">CONFERIDO POR (TI / PATRIMÔNIO)</p>
            </div>
            <div>
              <div className="border-t border-black pt-1 mx-auto w-10/12"></div>
              <p className="font-bold">VISTO DA GERÊNCIA GERAL</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Relatório configurado nas cores da Amilco Home Center (Preto, Vermelho e Branco).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
