import React, { useState, useMemo } from 'react';
import {
  X,
  FolderCheck,
  Search,
  Printer,
  Trash2,
  Eye,
  Smartphone,
  CheckCircle2,
  FileCheck2,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  PenTool,
  ExternalLink,
} from 'lucide-react';
import { Device, SignedTermRecord } from '../types/device';

interface SignedTermsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  initialSelectedTerm?: SignedTermRecord | null;
  onOpenSignForDevice: (device: Device) => void;
  onDeleteSignedTerm: (deviceId: string, termId: string) => void;
}

export const SignedTermsDirectoryModal: React.FC<SignedTermsDirectoryModalProps> = ({
  isOpen,
  onClose,
  devices,
  initialSelectedTerm = null,
  onOpenSignForDevice,
  onDeleteSignedTerm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('TODAS');
  const [statusTab, setStatusTab] = useState<'ASSINADOS' | 'PENDENTES' | 'TODOS'>('ASSINADOS');
  const [viewingTerm, setViewingTerm] = useState<SignedTermRecord | null>(initialSelectedTerm);

  // Sync when initialSelectedTerm is passed (e.g., right after signing!)
  React.useEffect(() => {
    if (initialSelectedTerm) {
      setViewingTerm(initialSelectedTerm);
      setStatusTab('ASSINADOS');
    }
  }, [initialSelectedTerm]);

  // Flatten all signed terms across all devices
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
      const dateA = a.term.signedAtIso || '';
      const dateB = b.term.signedAtIso || '';
      return dateB.localeCompare(dateA);
    });
  }, [devices]);

  const devicesWithSignedTerm = useMemo(() => {
    return devices.filter((d) => Array.isArray(d.signedTerms) && d.signedTerms.length > 0);
  }, [devices]);

  const devicesPendingSignature = useMemo(() => {
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
        const matchHash = term.verificationHash.toLowerCase().includes(q);
        if (!matchEmp && !matchPt && !matchModel && !matchSector && !matchHash) return false;
      }
      return true;
    });
  }, [allSignedTerms, storeFilter, searchQuery]);

  const filteredPendingDevices = useMemo(() => {
    return devicesPendingSignature.filter((d) => {
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
  }, [devicesPendingSignature, storeFilter, searchQuery]);

  if (!isOpen) return null;

  // Se estiver visualizando um termo assinado específico para impressão A4 / arquivo
  if (viewingTerm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
          {/* Top Bar */}
          <div className="no-print px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Termo Arquivado · {viewingTerm.employeeName}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    {viewingTerm.verificationHash}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Assinado digitalmente em {viewingTerm.signedAt} · Diretório Oficial Amilco
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
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Baixar PDF / Imprimir (A4)</span>
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

          {/* Documento A4 Assinado */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-zinc-900 text-xs sm:text-sm space-y-4 print:p-6 print:space-y-4 font-sans leading-relaxed print-sheet-a4">
            <div className="text-center border-b-2 border-black pb-3">
              <h1 className="text-xl font-bold tracking-tight text-black uppercase">
                AMILCO HOME CENTER
              </h1>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-0.5">
                DIRETÓRIO DE TERMOS ASSINADOS DIGITALMENTE — {viewingTerm.store}
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-black mt-2 bg-zinc-100 py-1 border border-zinc-300 rounded uppercase">
                TERMO DE ENTREGA E RESPONSABILIDADE DE EQUIPAMENTO TELEFÔNICO
              </h2>
            </div>

            <p className="text-xs text-justify text-zinc-800 leading-normal">
              Pelo presente instrumento, o(a) colaborador(a) abaixo qualificado(a) declara haver
              recebido da empresa <strong className="text-black">AMILCO HOME CENTER ({viewingTerm.store})</strong>,
              a título de empréstimo para uso estritamente profissional nas dependências e
              atividades laborais da empresa, o equipamento móvel e acessórios especificados a
              seguir, em perfeitas condições de uso, conservação e funcionamento.
            </p>

            {/* 1. Dados do Colaborador */}
            <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5 text-xs print:bg-white print:border-black/40">
              <h3 className="font-bold uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
                1. IDENTIFICAÇÃO DO COLABORADOR
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Nome Completo:
                  </span>
                  <span className="font-bold text-black">{viewingTerm.employeeName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    CPF:
                  </span>
                  <span className="font-mono font-semibold text-black">
                    {viewingTerm.employeeCpf || 'Confirmado Digitalmente'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Setor / Departamento:
                  </span>
                  <span className="font-semibold text-black">{viewingTerm.sector}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Loja / Unidade:
                  </span>
                  <span className="font-semibold text-black">{viewingTerm.store}</span>
                </div>
              </div>
            </div>

            {/* 2. Dados do Aparelho */}
            <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5 text-xs print:bg-white print:border-black/40">
              <h3 className="font-bold uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
                2. ESPECIFICAÇÕES DO EQUIPAMENTO E ACESSÓRIOS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Marca / Modelo:
                  </span>
                  <span className="font-bold text-black">
                    {viewingTerm.brand} {viewingTerm.model}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Nº Patrimônio:
                  </span>
                  <span className="font-mono font-bold text-black bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">
                    {viewingTerm.assetNumber}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    IMEI 1:
                  </span>
                  <span className="font-mono text-zinc-900">
                    {viewingTerm.imei1 || 'Não cadastrado'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Linha Telefônica:
                  </span>
                  <span className="font-medium text-black">
                    {viewingTerm.phoneNumber || 'Sem Linha'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-4 pt-1 border-t border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Acessórios Entregues:
                  </span>
                  <span className="font-bold text-zinc-900">
                    {viewingTerm.accessories && viewingTerm.accessories.length > 0
                      ? viewingTerm.accessories.join(', ')
                      : 'Nenhum acessório adicional'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Cláusulas */}
            <div className="space-y-1.5 text-[11px] text-zinc-700 leading-relaxed border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 print:bg-white print:border-black/30">
              <h3 className="font-bold uppercase text-[11px] text-red-700 print:text-black">
                3. TERMOS E CONDIÇÕES DE USO
              </h3>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  O aparelho destina-se exclusivamente ao desempenho das funções de trabalho, sendo
                  vedada a cessão ou empréstimo a terceiros sem autorização da TI / Diretoria.
                </li>
                <li>
                  O colaborador compromete-se a zelar pelo bom estado de conservação do celular e de
                  seus acessórios (carregador, cabo, capa, película e cartão de memória).
                </li>
                <li>
                  Em caso de perda, furto, roubo ou avaria, o colaborador deverá comunicar
                  imediatamente o setor responsável da empresa.
                </li>
                <li>
                  O colaborador compromete-se a restituir o equipamento e seus acessórios no ato de
                  desligamento, troca de função ou sempre que solicitado pela empresa.
                </li>
              </ol>
            </div>

            {/* 4. Quadro de Assinatura Digital Autenticada */}
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                {/* Assinatura Digital do Colaborador */}
                <div className="border-2 border-emerald-600/70 rounded-xl p-3 bg-emerald-50/30 text-center relative print:border-black">
                  <div className="flex items-center justify-between text-[9px] font-bold text-emerald-800 uppercase mb-1 px-1">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Assinado Digitalmente no Celular
                    </span>
                    <span className="font-mono">{viewingTerm.verificationHash}</span>
                  </div>

                  <div className="bg-white rounded-lg border border-zinc-200 py-2 px-3 my-1 flex items-center justify-center min-h-[76px]">
                    <img
                      src={viewingTerm.signatureDataUrl}
                      alt={`Assinatura de ${viewingTerm.employeeName}`}
                      className="max-h-16 object-contain mx-auto"
                    />
                  </div>

                  <div className="border-t border-black pt-1 mt-1">
                    <p className="font-bold text-black text-xs uppercase">
                      {viewingTerm.employeeName}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      Colaborador(a) · {viewingTerm.sector} · Assinado em {viewingTerm.signedAt}
                    </p>
                  </div>
                </div>

                {/* Carimbo Corporativo Amilco */}
                <div className="border border-zinc-300 rounded-xl p-3 bg-zinc-50 text-center print:bg-white print:border-black">
                  <div className="min-h-[82px] flex flex-col items-center justify-center text-zinc-700">
                    <span className="text-xs font-black tracking-wider text-zinc-900 uppercase">
                      AMILCO HOME CENTER
                    </span>
                    <span className="text-[10px] text-red-600 font-bold uppercase mt-0.5">
                      Gestão de Patrimônio & T.I. ({viewingTerm.store})
                    </span>
                    <span className="text-[9.5px] font-mono text-zinc-500 mt-1">
                      Validado por: {viewingTerm.recordedBy}
                    </span>
                  </div>
                  <div className="border-t border-black pt-1 mt-1">
                    <p className="font-bold text-black text-xs uppercase">AMILCO HOME CENTER</p>
                    <p className="text-[10px] text-zinc-500 uppercase">
                      Arquivo Digital Oficial · Hash {viewingTerm.verificationHash}
                    </p>
                  </div>
                </div>
              </div>
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
                  Diretório de Termos Assinados Digitalmente
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {allSignedTerms.length} {allSignedTerms.length === 1 ? 'termo arquivado' : 'termos arquivados'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Repositório central de termos assinados pelo celular com rubrica digital, data/hora e código autenticador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Rápido + Abas do Diretório */}
        <div className="p-4 bg-zinc-100 border-b border-zinc-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setStatusTab('ASSINADOS')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusTab === 'ASSINADOS'
                  ? 'bg-emerald-950 text-white border-emerald-500 shadow-xs'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-emerald-400'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    statusTab === 'ASSINADOS' ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  📁 Pasta: Termos Assinados
                </span>
                <strong className="text-lg font-black font-mono">
                  {allSignedTerms.length} documentos
                </strong>
                <span
                  className={`text-[11px] block ${
                    statusTab === 'ASSINADOS' ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {devicesWithSignedTerm.length} aparelhos com termo assinado
                </span>
              </div>
              <CheckCircle2
                className={`w-7 h-7 ${
                  statusTab === 'ASSINADOS' ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('PENDENTES')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusTab === 'PENDENTES'
                  ? 'bg-zinc-900 text-white border-red-500 shadow-xs'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-red-300'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    statusTab === 'PENDENTES' ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  ✍️ Aguardando Assinatura Digital
                </span>
                <strong className="text-lg font-black font-mono">
                  {devicesPendingSignature.length} aparelhos
                </strong>
                <span
                  className={`text-[11px] block ${
                    statusTab === 'PENDENTES' ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  Clique para enviar link / QR Code ao celular
                </span>
              </div>
              <QrCode
                className={`w-7 h-7 ${
                  statusTab === 'PENDENTES' ? 'text-red-400' : 'text-zinc-600'
                }`}
              />
            </button>

            <div className="p-3 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">
                Como funciona a Assinatura no Celular:
              </span>
              <p className="text-[11px] text-zinc-600 leading-snug mt-0.5">
                1. Clique em <strong>Assinar pelo Celular</strong> em qualquer aparelho.<br />
                2. O colaborador escaneia o <strong>QR Code</strong> (ou abre o link no WhatsApp) e assina com o dedo.<br />
                3. O termo cai automaticamente nesta pasta!
              </p>
            </div>
          </div>

          {/* Barra de Busca e Filtro de Loja */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar termo assinado por colaborador, patrimônio, modelo ou código hash..."
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
        </div>

        {/* Lista de Documentos no Diretório */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50">
          {statusTab === 'ASSINADOS' ? (
            filteredSignedTerms.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
                  <FolderCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Nenhum termo assinado encontrado nesta pasta
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Assim que um colaborador assinar digitalmente pelo celular (via QR Code, link ou
                  na própria tela), o documento assinado ficará guardado aqui para consulta e
                  impressão a qualquer momento.
                </p>
                <button
                  type="button"
                  onClick={() => setStatusTab('PENDENTES')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Ver Aparelhos Pendentes para Coletar Assinatura ({devicesPendingSignature.length})</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSignedTerms.map(({ term, device }) => (
                  <div
                    key={term.id}
                    className="bg-white rounded-xl border border-zinc-200 hover:border-emerald-500/70 shadow-2xs p-4 flex flex-col justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Termo Assinado
                          </span>
                          <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {term.verificationHash}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-zinc-950 uppercase mt-1.5">
                          {term.employeeName}
                        </h4>
                        <p className="text-xs text-zinc-600 font-medium">
                          {term.brand} {term.model} ·{' '}
                          <strong className="font-mono text-zinc-900">
                            PT: {term.assetNumber}
                          </strong>{' '}
                          · {term.sector} ({term.store.replace('LOJA ', '')})
                        </p>
                      </div>

                      {/* Miniatura da Assinatura Digital */}
                      <div
                        onClick={() => setViewingTerm(term)}
                        className="w-28 h-16 rounded-lg border border-zinc-200 bg-zinc-50 p-1 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-emerald-500"
                        title="Clique para abrir o Termo Assinado completo"
                      >
                        <img
                          src={term.signatureDataUrl}
                          alt={`Rubrica ${term.employeeName}`}
                          className="max-h-10 object-contain"
                        />
                        <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5">
                          Rubrica Digital
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        {term.signedAt}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingTerm(term)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir / Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenSignForDevice(device)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                          title="Coletar nova assinatura atualizada"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Nova</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deseja remover este termo assinado de ${term.employeeName} do diretório?`
                              )
                            ) {
                              onDeleteSignedTerm(device.id, term.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Excluir termo arquivado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Aba de Pendentes para Coletar Assinatura */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPendingDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white rounded-xl border border-zinc-200 p-3.5 flex items-center justify-between gap-3 hover:border-zinc-300"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                        {dev.hasAssetTag ? `PT ${dev.assetNumber}` : 'SEM PT'}
                      </span>
                      <span className="text-xs font-black text-zinc-950 uppercase">
                        {dev.employeeName}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {dev.brand} {dev.model} · {dev.sector} · {dev.store}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSignForDevice(dev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Assinar pelo Celular</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
