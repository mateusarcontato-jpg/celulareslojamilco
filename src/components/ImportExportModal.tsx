import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  RotateCcw, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { Device } from '../types/device';
import { exportToCsv, exportAuditToCsv, parseCsvText } from '../services/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onImportDevices: (imported: Device[]) => void;
  onResetData: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  devices,
  onImportDevices,
  onResetData,
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleExportCsv = () => {
    exportToCsv(devices);
    setSuccessMsg('Planilha Padrão de Celulares (.CSV) baixada com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExportAuditCsv = () => {
    exportAuditToCsv(devices);
    setSuccessMsg('Planilha Exclusiva de Auditoria (.CSV) baixada com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(devices, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_patrimonio_amilco_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMsg('Backup JSON baixado com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onImportDevices(parsed);
            setSuccessMsg(`${parsed.length} aparelhos restaurados via backup JSON.`);
            setTimeout(() => {
              setSuccessMsg('');
              onClose();
            }, 1500);
          } else {
            setErrorMsg('Formato JSON inválido.');
          }
        } catch {
          setErrorMsg('Erro ao ler arquivo JSON.');
        }
      } else {
        const parsed = parseCsvText(content);
        if (parsed.length > 0) {
          onImportDevices(parsed);
          setSuccessMsg(`${parsed.length} aparelhos importados com sucesso da planilha!`);
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1500);
        } else {
          setErrorMsg('Nenhuma linha válida identificada no CSV.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente restaurar os 35 aparelhos originais da Amilco Home Center (Acaraú e Préa)? Todas as alterações manuais serão resetadas.')) {
      onResetData();
      setSuccessMsg('Base oficial de 35 aparelhos restaurada!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Integração com Excel & Backup
              </h2>
              <p className="text-xs text-zinc-300">
                Amilco Home Center · Importe ou exporte relatórios
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
        <div className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Export Section */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-2.5">
            <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              1. Exportar Planilha Excel (.CSV)
            </h3>
            <p className="text-zinc-600">
              Escolha entre exportar apenas os dados padrão dos celulares ou a planilha exclusiva de auditoria:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Apenas dados cadastrais padrão dos celulares, sem auditoria"
              >
                <Download className="w-4 h-4" />
                <span>Planilha Padrão (Só Celulares)</span>
              </button>

              <button
                onClick={handleExportAuditCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Planilha exclusiva com diagnósticos de auditoria, tela, película, bateria e itens"
              >
                <Download className="w-4 h-4 text-red-500" />
                <span>Planilha Só de Auditoria</span>
              </button>

              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 font-semibold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-zinc-500" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border border-zinc-200 rounded-xl p-4 space-y-2.5">
            <h3 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              2. Importar Arquivo de Planilha
            </h3>
            <p className="text-zinc-600">
              Carregue um arquivo .CSV ou .JSON para sincronizar aparelhos:
            </p>
            <div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-zinc-800 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-red-600" />
                <span>Selecionar Arquivo (.CSV ou .JSON)</span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset section */}
          <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-zinc-900">Restaurar Base de 35 Aparelhos</h4>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                Restaura os dados originais da Amilco Home Center (Acaraú e Préa).
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
