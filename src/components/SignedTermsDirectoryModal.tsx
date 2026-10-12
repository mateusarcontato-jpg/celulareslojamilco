import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  FolderCheck,
  Search,
  Printer,
  Trash2,
  Eye,
  Upload,
  CheckCircle2,
  FileCheck2,
  Calendar,
  Camera,
  FileText,
  Download,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Device, SignedTermRecord, DeviceOccurrence } from '../types/device';

interface SignedTermsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  initialUploadDevice?: Device | null;
  currentTechnicianName?: string;
  onSaveUploadedTerm: (
    updatedDevice: Device,
    newTerm: SignedTermRecord,
    newOccurrence: DeviceOccurrence
  ) => Promise<void>;
  onDeleteSignedTerm: (deviceId: string, termId: string) => void;
  onOpenPrintBlankTerm?: (device: Device) => void;
}

export const SignedTermsDirectoryModal: React.FC<SignedTermsDirectoryModalProps> = ({
  isOpen,
  onClose,
  devices,
  initialUploadDevice = null,
  currentTechnicianName,
  onSaveUploadedTerm,
  onDeleteSignedTerm,
  onOpenPrintBlankTerm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('TODAS');
  const [statusTab, setStatusTab] = useState<'ARQUIVADOS' | 'ENVIAR_NOVO' | 'PENDENTES'>('ARQUIVADOS');
  const [viewingTerm, setViewingTerm] = useState<SignedTermRecord | null>(null);

  // Estado do formulário de Upload de Foto / Documento Escaneado
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileMime, setSelectedFileMime] = useState<string>('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string>('');
  const [termNotes, setTermNotes] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && initialUploadDevice) {
      setSelectedDeviceId(initialUploadDevice.id);
      setStatusTab('ENVIAR_NOVO');
      setViewingTerm(null);
    }
  }, [isOpen, initialUploadDevice]);

  // Lista ordenada de todos os termos escaneados/anexados
  const allSignedTerms = useMemo(() => {
    const list: { term: SignedTermRecord; device: Device }[] = [];
    for (const dev of devices) {
      if (Array.isArray(dev.signedTerms)) {
        for (const t of dev.signedTerms) {
          list.push({ term: t, device: dev });
        }
      }
    }
    return list.sort((a, b) => {
      const dateA = a.term.uploadedAtIso || a.term.signedAtIso || '';
      const dateB = b.term.uploadedAtIso || b.term.signedAtIso || '';
      return dateB.localeCompare(dateA);
    });
  }, [devices]);

  const devicesWithTermCount = useMemo(() => {
    return devices.filter((d) => Array.isArray(d.signedTerms) && d.signedTerms.length > 0).length;
  }, [devices]);

  const devicesPendingUpload = useMemo(() => {
    return devices.filter((d) => !Array.isArray(d.signedTerms) || d.signedTerms.length === 0);
  }, [devices]);

  const filteredSignedTerms = useMemo(() => {
    return allSignedTerms.filter(({ term }) => {
      if (storeFilter !== 'TODAS' && term.store !== storeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEmp = term.employeeName.toLowerCase().includes(q);
        const matchPt = term.assetNumber.toLowerCase().includes(q);
        const matchModel = term.model.toLowerCase().includes(q);
        const matchSector = term.sector.toLowerCase().includes(q);
        const matchFile = (term.fileName || '').toLowerCase().includes(q);
        if (!matchEmp && !matchPt && !matchModel && !matchSector && !matchFile) return false;
      }
      return true;
    });
  }, [allSignedTerms, storeFilter, searchQuery]);

  const filteredPendingDevices = useMemo(() => {
    return devicesPendingUpload.filter((d) => {
      if (storeFilter !== 'TODAS' && d.store !== storeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEmp = d.employeeName.toLowerCase().includes(q);
        const matchPt = d.assetNumber.toLowerCase().includes(q);
        const matchModel = d.model.toLowerCase().includes(q);
        const matchSector = d.sector.toLowerCase().includes(q);
        if (!matchEmp && !matchPt && !matchModel && !matchSector) return false;
      }
      return true;
    });
  }, [devicesPendingUpload, storeFilter, searchQuery]);

  if (!isOpen) return null;

  // Compressão inteligente de imagem caso o usuário suba foto de celular muito pesada (> 800KB) para caber com folga no Firestore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1400;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setSelectedFileName(file.name);
            setSelectedFileMime('image/jpeg');
            setSelectedFileDataUrl(compressedDataUrl);
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF ou outro documento
      if (file.size > 900 * 1024) {
        setUploadError('O arquivo PDF excede 900KB. Prefira enviar uma foto/imagem escaneada (JPG/PNG) que é otimizada automaticamente.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedFileName(file.name);
        setSelectedFileMime(file.type || 'application/pdf');
        setSelectedFileDataUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDevice = devices.find((d) => d.id === selectedDeviceId);
    if (!targetDevice) {
      setUploadError('Selecione o colaborador / celular referente a este termo assinado.');
      return;
    }
    if (!selectedFileDataUrl) {
      setUploadError('Selecione a foto ou documento escaneado do termo assinado.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('pt-BR') +
        ' às ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const newTerm: SignedTermRecord = {
        id: `scan-${Date.now()}`,
        deviceId: targetDevice.id,
        employeeName: targetDevice.employeeName,
        store: targetDevice.store,
        sector: targetDevice.sector,
        assetNumber: targetDevice.hasAssetTag ? targetDevice.assetNumber : 'SEM PT',
        brand: targetDevice.brand,
        model: targetDevice.model,
        imei1: targetDevice.imei1,
        phoneNumber: targetDevice.phoneNumber,
        condition: targetDevice.condition,
        accessories: targetDevice.accessories || [],
        fileName: selectedFileName || `Termo_${targetDevice.employeeName}.jpg`,
        fileMimeType: selectedFileMime || 'image/jpeg',
        fileDataUrl: selectedFileDataUrl,
        uploadedAt: formattedDate,
        uploadedAtIso: now.toISOString(),
        recordedBy: currentTechnicianName || 'T.I. Amilco',
        notes: termNotes.trim() || undefined,
      };

      const newOccurrence: DeviceOccurrence = {
        id: `occ-scan-${Date.now()}`,
        date: now.toLocaleDateString('pt-BR'),
        type: 'ENTREGA',
        title: `Termo Assinado Escaneado Arquivado (${targetDevice.employeeName})`,
        description: `Foto/documento escaneado do Termo de Responsabilidade assinado por ${targetDevice.employeeName} foi salvo no Diretório de Termos.${termNotes.trim() ? ` Obs: ${termNotes.trim()}` : ''}`,
        recordedBy: currentTechnicianName || 'T.I. Amilco',
        attachmentName: newTerm.fileName,
        attachmentData: selectedFileDataUrl,
      };

      const existingTerms = Array.isArray(targetDevice.signedTerms) ? targetDevice.signedTerms : [];
      const updatedDevice: Device = {
        ...targetDevice,
        signedTerms: [newTerm, ...existingTerms],
        occurrences: [newOccurrence, ...(targetDevice.occurrences || [])],
        updatedAt: now.toISOString(),
      };

      await onSaveUploadedTerm(updatedDevice, newTerm, newOccurrence);

      // Limpa form e volta para a pasta de arquivados mostrando o documento recém enviado
      setSelectedFileName('');
      setSelectedFileDataUrl('');
      setTermNotes('');
      setStatusTab('ARQUIVADOS');
      setViewingTerm(newTerm);
    } catch (err) {
      console.error('Erro ao arquivar termo escaneado:', err);
      setUploadError('Erro ao salvar o documento no diretório.');
    } finally {
      setIsUploading(false);
    }
  };

  // Visualização em tela cheia do documento escaneado / foto do termo assinado
  if (viewingTerm) {
    const fileUrl = viewingTerm.fileDataUrl || viewingTerm.signatureDataUrl || '';
    const isPdf = (viewingTerm.fileMimeType || '').includes('pdf') || fileUrl.startsWith('data:application/pdf');

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
          <div className="no-print px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-950 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Termo Escaneado Arquivado · {viewingTerm.employeeName}
                </h2>
                <p className="text-xs text-zinc-400">
                  {viewingTerm.brand} {viewingTerm.model} (PT: {viewingTerm.assetNumber}) · Enviado em{' '}
                  {viewingTerm.uploadedAt || viewingTerm.signedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingTerm(null)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                ← Voltar ao Diretório
              </button>
              <a
                href={fileUrl}
                download={viewingTerm.fileName || `Termo_${viewingTerm.employeeName}.jpg`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Arquivo</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 print:bg-white print:p-0 space-y-4">
            {/* Cabeçalho de metadados do arquivo */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs no-print">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Colaborador</span>
                <strong className="text-zinc-900">{viewingTerm.employeeName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Aparelho / Patrimônio</span>
                <strong className="text-zinc-900">
                  {viewingTerm.brand} {viewingTerm.model} (PT: {viewingTerm.assetNumber})
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Setor / Unidade</span>
                <strong className="text-zinc-900">
                  {viewingTerm.sector} · {viewingTerm.store}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Arquivado por</span>
                <strong className="text-zinc-900">{viewingTerm.recordedBy}</strong>
              </div>
              {viewingTerm.notes && (
                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Observações:</span>
                  <span className="text-zinc-700">{viewingTerm.notes}</span>
                </div>
              )}
            </div>

            {/* Imagem ou PDF escaneado */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-center shadow-xs print:border-none print:shadow-none">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  title={viewingTerm.fileName}
                  className="w-full h-[70vh] rounded-lg border border-zinc-200"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt={`Termo assinado de ${viewingTerm.employeeName}`}
                  className="max-w-full max-h-[75vh] print:max-h-none object-contain rounded-lg mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header do Diretório */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-sm">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Diretório de Termos Assinados (Fotos e Escaneados)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {allSignedTerms.length} {allSignedTerms.length === 1 ? 'arquivo guardado' : 'arquivos guardados'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Pasta central para guardar fotos ou documentos escaneados dos termos de responsabilidade pós-assinatura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusTab('ENVIAR_NOVO')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Foto / Termo Escaneado</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navegação de Abas do Diretório */}
        <div className="p-4 bg-zinc-100 border-b border-zinc-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setStatusTab('ARQUIVADOS')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusTab === 'ARQUIVADOS'
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    statusTab === 'ARQUIVADOS' ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  📁 1. Pasta de Termos Arquivados
                </span>
                <strong className="text-base font-black font-mono">
                  {allSignedTerms.length} documentos salvos
                </strong>
                <span
                  className={`text-[11px] block ${
                    statusTab === 'ARQUIVADOS' ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {devicesWithTermCount} aparelhos com termo escaneado
                </span>
              </div>
              <FolderCheck
                className={`w-6 h-6 ${
                  statusTab === 'ARQUIVADOS' ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('ENVIAR_NOVO')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusTab === 'ENVIAR_NOVO'
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-emerald-400'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    statusTab === 'ENVIAR_NOVO' ? 'text-emerald-200' : 'text-emerald-700'
                  }`}
                >
                  📤 2. Upar Foto / Escaneado
                </span>
                <strong className="text-base font-black">
                  Anexar Termo Assinado
                </strong>
                <span
                  className={`text-[11px] block ${
                    statusTab === 'ENVIAR_NOVO' ? 'text-emerald-100' : 'text-zinc-500'
                  }`}
                >
                  Envie foto da folha assinada ou PDF
                </span>
              </div>
              <Camera
                className={`w-6 h-6 ${
                  statusTab === 'ENVIAR_NOVO' ? 'text-white' : 'text-emerald-600'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('PENDENTES')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusTab === 'PENDENTES'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-red-300'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    statusTab === 'PENDENTES' ? 'text-red-100' : 'text-amber-700'
                  }`}
                >
                  ⏳ 3. Pendentes de Upload
                </span>
                <strong className="text-base font-black font-mono">
                  {devicesPendingUpload.length} aparelhos sem foto
                </strong>
                <span
                  className={`text-[11px] block ${
                    statusTab === 'PENDENTES' ? 'text-red-100' : 'text-zinc-500'
                  }`}
                >
                  Imprima o termo ou anexe o escaneado
                </span>
              </div>
              <FileText
                className={`w-6 h-6 ${
                  statusTab === 'PENDENTES' ? 'text-white' : 'text-zinc-500'
                }`}
              />
            </button>
          </div>

          {statusTab !== 'ENVIAR_NOVO' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador, patrimônio, modelo ou setor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['TODAS', 'LOJA ACARAÚ', 'LOJA PRÉA'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStoreFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      storeFilter === st
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {st === 'TODAS' ? 'Todas as Lojas' : st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo Principal do Diretório */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50">
          {statusTab === 'ENVIAR_NOVO' ? (
            /* FORMULÁRIO DE UPLOAD DE FOTO OU DOCUMENTO ESCANEADO */
            <form
              onSubmit={handleUploadSubmit}
              className="max-w-2xl mx-auto bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-4 text-xs"
            >
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Guardar Foto ou Documento Escaneado Pós-Assinatura</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Selecione o celular/colaborador e envie a foto da folha assinada ou o arquivo escaneado para ficar arquivado no diretório.
                </p>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  1. Selecione o Colaborador / Aparelho Celular <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-zinc-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">— Escolha o aparelho / colaborador —</option>
                  {devices
                    .slice()
                    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'pt-BR'))
                    .map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.employeeName} — {dev.brand} {dev.model} (PT: {dev.hasAssetTag ? dev.assetNumber : 'SEM PT'}) · {dev.store}
                      </option>
                    ))}
                </select>
              </div>

              {/* Área de Upload de Arquivo (Foto da Câmera / Galeria / Escaneado) */}
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  2. Foto do Termo Assinado ou Documento Escaneado <span className="text-red-600">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFileDataUrl
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-zinc-300 hover:border-red-500 bg-zinc-50 hover:bg-zinc-100/70'
                  }`}
                >
                  {selectedFileDataUrl ? (
                    <div className="space-y-2">
                      {selectedFileMime.includes('pdf') ? (
                        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mx-auto font-bold">
                          PDF
                        </div>
                      ) : (
                        <img
                          src={selectedFileDataUrl}
                          alt="Prévia do termo escaneado"
                          className="max-h-48 mx-auto rounded-lg border border-zinc-300 object-contain shadow-xs"
                        />
                      )}
                      <p className="font-bold text-emerald-900 text-xs">
                        ✓ Arquivo carregado: {selectedFileName}
                      </p>
                      <p className="text-[11px] text-zinc-500 underline">
                        Clique aqui se quiser trocar a foto/arquivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-200/80 text-zinc-700 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6 text-red-600" />
                      </div>
                      <p className="font-bold text-zinc-900 text-xs sm:text-sm">
                        Clique para selecionar a Foto do Termo ou Escaneado (JPG, PNG ou PDF)
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Você pode tirar foto pelo celular ou escolher o documento digitalizado no computador
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  3. Observações do Arquivamento (Opcional)
                </label>
                <input
                  type="text"
                  value={termNotes}
                  onChange={(e) => setTermNotes(e.target.value)}
                  placeholder="Ex: Termo assinado na entrega do aparelho novo com capa, película e cartão de memória..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusTab('ARQUIVADOS')}
                  className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUploading ? 'Arquivando...' : 'Salvar Termo no Diretório'}</span>
                </button>
              </div>
            </form>
          ) : statusTab === 'ARQUIVADOS' ? (
            /* PASTA DE DOCUMENTOS ARQUIVADOS */
            filteredSignedTerms.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
                  <FolderCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Nenhum termo escaneado guardado nesta pasta ainda
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Após imprimir o termo e colher a assinatura física do colaborador, clique no botão abaixo para subir a foto ou documento escaneado.
                </p>
                <button
                  type="button"
                  onClick={() => setStatusTab('ENVIAR_NOVO')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Primeira Foto / Termo Escaneado</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSignedTerms.map(({ term, device }) => {
                  const previewUrl = term.fileDataUrl || term.signatureDataUrl || '';
                  const isPdf = (term.fileMimeType || '').includes('pdf') || previewUrl.startsWith('data:application/pdf');
                  return (
                    <div
                      key={term.id}
                      className="bg-white rounded-xl border border-zinc-200 hover:border-emerald-500/70 shadow-2xs p-4 flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Termo Escaneado
                            </span>
                            <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                              {term.fileName || 'Documento'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-zinc-950 uppercase mt-1.5 truncate">
                            {term.employeeName}
                          </h4>
                          <p className="text-xs text-zinc-600 font-medium">
                            {term.brand} {term.model} ·{' '}
                            <strong className="font-mono text-zinc-900">
                              PT: {term.assetNumber}
                            </strong>{' '}
                            · {term.sector} ({term.store.replace('LOJA ', '')})
                          </p>
                          {term.notes && (
                            <p className="text-[11px] text-zinc-500 italic mt-1 line-clamp-1">
                              "{term.notes}"
                            </p>
                          )}
                        </div>

                        {/* Miniatura da Foto / Escaneado */}
                        <div
                          onClick={() => setViewingTerm(term)}
                          className="w-24 h-20 rounded-lg border border-zinc-200 bg-zinc-100 p-1 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-emerald-500 overflow-hidden"
                          title="Clique para abrir a foto / documento escaneado"
                        >
                          {isPdf ? (
                            <span className="text-[10px] font-black text-red-600 uppercase">
                              PDF Escaneado
                            </span>
                          ) : (
                            <img
                              src={previewUrl}
                              alt={`Termo ${term.employeeName}`}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          {term.uploadedAt || term.signedAt}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingTerm(term)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Foto / Imprimir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeviceId(device.id);
                              setStatusTab('ENVIAR_NOVO');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                            title="Enviar nova foto para este colaborador"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Novo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Deseja remover este termo escaneado de ${term.employeeName} do diretório?`
                                )
                              ) {
                                onDeleteSignedTerm(device.id, term.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Excluir arquivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ABA 3: APARELHOS PENDENTES DE FOTO/UPLOAD */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPendingDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white rounded-xl border border-zinc-200 p-3.5 flex items-center justify-between gap-3 hover:border-zinc-300"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                        {dev.hasAssetTag ? `PT ${dev.assetNumber}` : 'SEM PT'}
                      </span>
                      <span className="text-xs font-black text-zinc-950 uppercase truncate">
                        {dev.employeeName}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {dev.brand} {dev.model} · {dev.sector} · {dev.store}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenPrintBlankTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPrintBlankTerm(dev);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                        title="Imprimir folha A4 para assinatura física"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeviceId(dev.id);
                        setStatusTab('ENVIAR_NOVO');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upar Foto</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
