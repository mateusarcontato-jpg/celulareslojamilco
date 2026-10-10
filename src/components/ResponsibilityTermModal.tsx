import React, { useState } from 'react';
import {
  X,
  Printer,
  FileCheck,
  Smartphone,
  QrCode,
  PenTool,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  FolderCheck,
  AlertCircle,
} from 'lucide-react';
import { Device, SignedTermRecord, DeviceOccurrence } from '../types/device';
import { SignaturePadCanvas } from './SignaturePadCanvas';

interface ResponsibilityTermModalProps {
  device: Device | null;
  onClose: () => void;
  onTermSignedAndOpenDirectory?: (
    updatedDevice: Device,
    newTerm: SignedTermRecord,
    newOccurrence: DeviceOccurrence
  ) => Promise<void>;
  onOpenDirectory?: () => void;
  currentTechnicianName?: string;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  device,
  onClose,
  onTermSignedAndOpenDirectory,
  onOpenDirectory,
  currentTechnicianName,
}) => {
  const [activeTab, setActiveTab] = useState<'DOCUMENTO' | 'ASSINAR_CELULAR'>('DOCUMENTO');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!device) return null;

  const latestSignedTerm =
    Array.isArray(device.signedTerms) && device.signedTerms.length > 0
      ? device.signedTerms[0]
      : null;

  const handlePrint = () => {
    setActiveTab('DOCUMENTO');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // URL de assinatura pelo celular
  const mobileSignUrl = `${window.location.origin}${window.location.pathname}?assinar=${encodeURIComponent(device.id)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(mobileSignUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileSignUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleSaveDirectSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureDataUrl) {
      setErrorMsg('Peça para o colaborador assinar com o dedo (ou caneta/mouse) no quadro abaixo.');
      return;
    }
    if (!onTermSignedAndOpenDirectory) return;

    setErrorMsg(null);
    setIsSaving(true);

    try {
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('pt-BR') +
        ' às ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const verificationHash = `AMILCO-${device.assetNumber === 'SEM PT' ? 'SPT' : device.assetNumber}-${randomCode}-${now.getFullYear()}`;

      const newTerm: SignedTermRecord = {
        id: `term-${Date.now()}`,
        deviceId: device.id,
        employeeName: device.employeeName,
        employeeCpf: employeeCpf.trim() || undefined,
        store: device.store,
        sector: device.sector,
        assetNumber: device.hasAssetTag ? device.assetNumber : 'SEM PT',
        brand: device.brand,
        model: device.model,
        imei1: device.imei1,
        phoneNumber: device.phoneNumber,
        condition: device.condition,
        accessories: device.accessories || [],
        signatureDataUrl,
        signedAt: formattedDate,
        signedAtIso: now.toISOString(),
        verificationHash,
        recordedBy: currentTechnicianName || 'T.I. Amilco',
        signedVia: 'TELA_DIRETA',
      };

      const newOccurrence: DeviceOccurrence = {
        id: `occ-sign-${Date.now()}`,
        date: now.toLocaleDateString('pt-BR'),
        type: 'ENTREGA',
        title: `Termo Assinado Digitalmente (${verificationHash})`,
        description: `Termo de responsabilidade assinado digitalmente por ${device.employeeName} referente ao aparelho ${device.brand} ${device.model} (PT: ${device.assetNumber}). Acessórios: ${(device.accessories || []).join(', ') || 'Nenhum'}. Guardado no Diretório de Termos Assinados.`,
        recordedBy: currentTechnicianName || device.employeeName,
        attachmentName: `Termo_Assinado_${device.employeeName.replace(/\s+/g, '_')}.png`,
        attachmentData: signatureDataUrl,
      };

      const existingSignedTerms = Array.isArray(device.signedTerms) ? device.signedTerms : [];
      const updatedDevice: Device = {
        ...device,
        signedTerms: [newTerm, ...existingSignedTerms],
        occurrences: [newOccurrence, ...(device.occurrences || [])],
        updatedAt: now.toISOString(),
      };

      await onTermSignedAndOpenDirectory(updatedDevice, newTerm, newOccurrence);
    } catch (err) {
      console.error('Erro ao gravar assinatura:', err);
      setErrorMsg('Não foi possível salvar a assinatura.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
        {/* Modal Toolbar in Amilco Black & Red */}
        <div className="no-print px-5 py-3.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Termo de Responsabilidade · {device.employeeName}
                </h2>
                {latestSignedTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Assinado Digitalmente
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Amilco Home Center · Assinatura Digital pelo Celular + Arquivamento em Diretório
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternador de Abas: Documento A4 vs Assinar pelo Celular */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('DOCUMENTO')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'DOCUMENTO'
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-red-600" />
                <span>Termo (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ASSINAR_CELULAR')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'ASSINAR_CELULAR'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Assinar pelo Celular</span>
              </button>
            </div>

            {onOpenDirectory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectory();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                title="Abrir Diretório de Termos Assinados"
              >
                <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Diretório</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir (A4)</span>
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

        {/* ABA 1: ASSINAR PELO CELULAR (QR CODE + LINK + ASSINATURA TOUCH DIRETA) */}
        {activeTab === 'ASSINAR_CELULAR' ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-zinc-50 space-y-5 no-print">
            {/* Guia: Opção 1 (QR Code / Link no Celular do Colaborador) vs Opção 2 (Assinar nesta tela) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Coluna Esquerda: QR Code para o Celular do Colaborador */}
              <div className="lg:col-span-5 bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                    <QrCode className="w-3.5 h-3.5" />
                    Opção 1 · No Celular do Colaborador
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Escaneie o QR Code com a câmera do celular
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O colaborador aponta a câmera do celular (ou recebe o link no WhatsApp), assina com o dedo na tela dele e o termo cai <strong>em tempo real</strong> no seu Diretório de Termos Assinados!
                  </p>
                </div>

                {/* QR Code Box */}
                <div className="bg-white p-3.5 rounded-2xl mx-auto shadow-lg border-4 border-red-600/80 flex flex-col items-center">
                  <img
                    src={qrCodeImageUrl}
                    alt="QR Code para Assinatura no Celular"
                    className="w-44 h-44 object-contain"
                  />
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-wider mt-1">
                    {device.employeeName} · PT {device.assetNumber}
                  </span>
                </div>

                {/* Copiar Link para enviar no WhatsApp */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Ou envie o link direto pelo WhatsApp:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={mobileSignUrl}
                      className="flex-1 px-2.5 py-2 text-[11px] font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Coletar Assinatura Agora (Na tela / celular / tablet) */}
              <form
                onSubmit={handleSaveDirectSignature}
                className="lg:col-span-7 bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                      <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                      Opção 2 · Assinar Agora Nesta Tela
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500">
                      Abre o Diretório Pós-Assinatura
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                        Colaborador:
                      </span>
                      <strong className="text-zinc-900">{device.employeeName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                        Aparelho:
                      </span>
                      <strong className="text-zinc-900">
                        {device.brand} {device.model}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                        Patrimônio / Setor:
                      </span>
                      <strong className="text-zinc-900">
                        {device.hasAssetTag ? `PT ${device.assetNumber}` : 'SEM PT'} · {device.sector}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      CPF do Colaborador (Opcional para constar no Termo):
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={employeeCpf}
                      onChange={(e) => setEmployeeCpf(formatCpf(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Quadro de Assinatura Digital */}
                  <SignaturePadCanvas
                    onSignatureChange={setSignatureDataUrl}
                    signerName={device.employeeName}
                  />

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500">
                    Ao confirmar, o sistema abrirá automaticamente o{' '}
                    <strong className="text-zinc-800">Diretório de Termos Assinados</strong>.
                  </span>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                  >
                    <FolderCheck className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? 'Salvando no Diretório...'
                        : 'Concluir Assinatura e Abrir Diretório'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* ABA 2: CORPO DO TERMO A4 (COM ASSINATURA DIGITAL SE JÁ ASSINADO) */
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-zinc-900 text-xs sm:text-sm space-y-4 print:p-6 print:space-y-4 font-sans leading-relaxed print-sheet-a4">
            {/* Banner Rápido para Assinar no Celular caso ainda não esteja assinado */}
            {!latestSignedTerm && (
              <div className="no-print bg-zinc-950 text-white p-3.5 rounded-xl border-l-4 border-red-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Deseja que {device.employeeName} assine digitalmente pelo celular?
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Gere o QR Code / Link para ele assinar com o dedo no celular e arquivar automaticamente no Diretório.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ASSINAR_CELULAR')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Assinar Digitalmente pelo Celular</span>
                </button>
              </div>
            )}

            {/* Header Document */}
            <div className="text-center border-b-2 border-black pb-3">
              <h1 className="text-xl font-bold tracking-tight text-black uppercase">
                AMILCO HOME CENTER
              </h1>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-0.5">
                CONTROLE DE PATRIMÔNIO CORPORATIVO — {device.store}
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-black mt-2 bg-zinc-100 py-1 border border-zinc-300 rounded uppercase">
                TERMO DE ENTREGA E RESPONSABILIDADE DE EQUIPAMENTO TELEFÔNICO
              </h2>
            </div>

            {/* Declaração de Recebimento */}
            <p className="text-xs text-justify text-zinc-800 leading-normal">
              Pelo presente instrumento, o(a) colaborador(a) abaixo qualificado(a) declara haver recebido da empresa{' '}
              <strong className="text-black">AMILCO HOME CENTER ({device.store})</strong>, a título de empréstimo para uso
              estritamente profissional nas dependências e atividades laborais da empresa, o equipamento móvel e acessórios especificados
              a seguir, em perfeitas condições de uso, conservação e funcionamento.
            </p>

            {/* 1. Dados do Colaborador */}
            <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5 text-xs print:bg-white print:border-black/40">
              <h3 className="font-bold uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
                1. IDENTIFICAÇÃO DO COLABORADOR
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Nome Completo:</span>
                  <span className="font-bold text-black">{device.employeeName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Setor / Departamento:</span>
                  <span className="font-semibold text-black">{device.sector}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Loja / Unidade:</span>
                  <span className="font-semibold text-black">{device.store}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Data de Aquisição / Entrega:</span>
                  <span className="font-medium text-zinc-900">{device.acquisitionDate || currentDate}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Colaborador Anterior:</span>
                  <span className="font-medium text-zinc-700">{device.previousEmployeeName || 'Nenhum'}</span>
                </div>
              </div>
            </div>

            {/* 2. Dados do Aparelho */}
            <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5 text-xs print:bg-white print:border-black/40">
              <h3 className="font-bold uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
                2. ESPECIFICAÇÕES DO EQUIPAMENTO CELULAR
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Marca / Modelo:</span>
                  <span className="font-bold text-black">{device.brand} {device.model}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Nº Patrimônio (Plaqueta):</span>
                  <span className="font-mono font-bold text-black bg-zinc-200 px-1 py-0.5 rounded text-[11px]">
                    {device.hasAssetTag ? device.assetNumber : 'SEM PT'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">IMEI 1:</span>
                  <span className="font-mono text-zinc-900">{device.imei1 || 'Não cadastrado'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Linha Telefônica:</span>
                  <span className="font-medium text-black">{device.phoneNumber || 'Sem Linha'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">VPN Instalada:</span>
                  <span className="font-semibold text-zinc-900">{device.hasVpn ? 'SIM (Instalada)' : 'NÃO'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Estado do Aparelho:</span>
                  <span className="font-medium text-zinc-900">{device.condition}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Acessórios Entregues:</span>
                  <span className="font-medium text-zinc-900">
                    {device.accessories && device.accessories.length > 0
                      ? device.accessories.join(', ')
                      : 'Nenhum acessório adicional'}
                  </span>
                </div>
              </div>
              {device.notes && (
                <div className="mt-1 pt-1 border-t border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Observações / Avarias:</span>
                  <span className="text-zinc-700 italic">{device.notes}</span>
                </div>
              )}
            </div>

            {/* 3. Obrigações e Cláusulas */}
            <div className="space-y-1.5 text-[11px] text-zinc-700 leading-relaxed border border-zinc-200 rounded-lg p-3 bg-zinc-50/50 print:bg-white print:border-black/30">
              <h3 className="font-bold uppercase text-[11px] text-red-700 print:text-black">
                3. TERMOS E CONDIÇÕES DE USO
              </h3>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  O aparelho destina-se exclusivamente ao desempenho das funções de trabalho, sendo vedada a cessão,
                  empréstimo ou transferência a terceiros sem prévia autorização expressa do setor de TI / Diretoria.
                </li>
                <li>
                  O colaborador compromete-se a zelar pelo bom estado de conservação do celular, protegendo-o contra
                  quedas, umidade, danos físicos e extravio.
                </li>
                <li>
                  É expressamente proibida a remoção ou adulteração da plaqueta de patrimônio (quando houver) ou dos números de série/IMEI.
                </li>
                <li>
                  Em caso de perda, furto ou roubo, o colaborador deverá comunicar imediatamente a empresa e apresentar o
                  respectivo Boletim de Ocorrência (B.O.) em até 24 horas.
                </li>
                <li>
                  Havendo dano causado por negligência, imprudência ou dolo, a empresa reserva-se o direito de apurar as
                  responsabilidades conforme as normas internas e legislação vigente.
                </li>
                <li>
                  O colaborador compromete-se a restituir imediatamente o equipamento e todos os seus acessórios no ato de
                  desligamento, troca de função ou sempre que solicitado pela empresa.
                </li>
              </ol>
            </div>

            {/* 4. Assinaturas (Exibe Rubrica Digital se já assinado, ou linha tradicional) */}
            <div className="pt-4 space-y-4">
              <p className="text-right text-xs text-zinc-600">
                {device.store}, {latestSignedTerm ? latestSignedTerm.signedAt : currentDate}.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-2 items-end">
                <div className="text-center">
                  {latestSignedTerm && (
                    <div className="mb-1 flex flex-col items-center">
                      <img
                        src={latestSignedTerm.signatureDataUrl}
                        alt={`Assinatura Digital ${device.employeeName}`}
                        className="max-h-16 object-contain mx-auto"
                      />
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700">
                        <ShieldCheck className="w-3 h-3" />
                        Assinado Digitalmente · {latestSignedTerm.verificationHash}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-black pt-1.5 mx-4">
                    <p className="font-bold text-black text-xs uppercase">{device.employeeName}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">Colaborador(a) / Usuário(a)</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      CPF: {latestSignedTerm?.employeeCpf || '___________________________'}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="border-t border-black pt-1.5 mx-4">
                    <p className="font-bold text-black text-xs uppercase">AMILCO HOME CENTER</p>
                    <p className="text-[10px] text-zinc-500 uppercase">Responsável pela Entrega / T.I.</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {latestSignedTerm ? `Validado por ${latestSignedTerm.recordedBy}` : 'Assinatura e Carimbo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
