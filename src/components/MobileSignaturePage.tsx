import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileCheck2,
  Building2,
  FolderCheck,
} from 'lucide-react';
import { Device, SignedTermRecord, DeviceOccurrence } from '../types/device';
import { SignaturePadCanvas } from './SignaturePadCanvas';

interface MobileSignaturePageProps {
  device: Device | null;
  isLoading: boolean;
  onSaveSignedTerm: (
    updatedDevice: Device,
    newTerm: SignedTermRecord,
    newOccurrence: DeviceOccurrence
  ) => Promise<void>;
  onExitMobileMode: () => void;
}

export const MobileSignaturePage: React.FC<MobileSignaturePageProps> = ({
  device,
  isLoading,
  onSaveSignedTerm,
  onExitMobileMode,
}) => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedRecord, setSignedRecord] = useState<SignedTermRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center mb-4 animate-pulse">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-base font-bold">Carregando Termo Digital Amilco...</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Sincronizando dados do aparelho com a nuvem...
        </p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-base font-bold">Equipamento não localizado</h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          O link de assinatura digital pode estar incompleto ou o aparelho foi removido.
        </p>
        <button
          type="button"
          onClick={onExitMobileMode}
          className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Ir para o Painel Principal
        </button>
      </div>
    );
  }

  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureDataUrl) {
      setErrorMsg('Por favor, faça sua assinatura com o dedo no quadro de assinatura abaixo.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Confirme que leu e concorda com o Termo de Responsabilidade.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

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
        recordedBy: `${device.employeeName} (Assinatura no Celular)`,
        signedVia: 'LINK_CELULAR',
        userAgentInfo: navigator.userAgent.slice(0, 120),
      };

      const newOccurrence: DeviceOccurrence = {
        id: `occ-sign-${Date.now()}`,
        date: now.toLocaleDateString('pt-BR'),
        type: 'ENTREGA',
        title: `Termo Assinado Digitalmente pelo Celular (${verificationHash})`,
        description: `O colaborador ${device.employeeName} assinou digitalmente na tela do celular o Termo de Responsabilidade do aparelho ${device.brand} ${device.model} (PT: ${device.assetNumber}). Acessórios confirmados: ${(device.accessories || []).join(', ') || 'Nenhum'}. Arquivado automaticamente no Diretório de Termos Assinados.`,
        recordedBy: device.employeeName,
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

      await onSaveSignedTerm(updatedDevice, newTerm, newOccurrence);
      setSignedRecord(newTerm);
    } catch (err) {
      console.error('Erro ao salvar assinatura mobile:', err);
      setErrorMsg('Erro ao gravar assinatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signedRecord) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md w-full mx-auto my-auto bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              Documento Arquivado no Diretório
            </span>
            <h1 className="text-lg font-bold text-white pt-1">
              Termo Assinado Digitalmente!
            </h1>
            <p className="text-xs text-zinc-300">
              Obrigado, <strong>{signedRecord.employeeName}</strong>. Seu termo de responsabilidade foi assinado e guardado automaticamente no diretório oficial da <strong>Amilco Home Center</strong>.
            </p>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Colaborador:</span>
              <span className="font-bold text-white">{signedRecord.employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Aparelho:</span>
              <span className="font-bold text-white">
                {signedRecord.brand} {signedRecord.model} (PT: {signedRecord.assetNumber})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Data e Hora:</span>
              <span className="font-mono text-emerald-400">{signedRecord.signedAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Código Autenticador:</span>
              <span className="font-mono font-bold text-amber-400">
                {signedRecord.verificationHash}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-zinc-200 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
              Rubrica Digital Registrada
            </span>
            <img
              src={signedRecord.signatureDataUrl}
              alt="Assinatura Digital"
              className="max-h-20 mx-auto object-contain"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onExitMobileMode}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <FolderCheck className="w-4 h-4 text-emerald-400" />
              <span>Abrir Diretório de Termos Assinados (Painel TI)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-500 mt-4">
          Amilco Home Center · Validação Digital com Carimbo de Tempo
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-10">
      {/* Top Header Mobile */}
      <header className="bg-zinc-950 text-white px-4 py-3.5 border-b-2 border-red-600 sticky top-0 z-20 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-wide uppercase">
                AMILCO HOME CENTER
              </h1>
              <p className="text-[10px] text-red-400 font-bold uppercase">
                Assinatura Digital pelo Celular · {device.store}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            <Lock className="w-2.5 h-2.5" />
            Seguro
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3.5 pt-4 space-y-4">
        {/* Card Resumo do Aparelho e Colaborador */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                Termo de Responsabilidade Digital
              </span>
              <h2 className="text-sm font-black text-zinc-950 uppercase">
                {device.employeeName}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 font-semibold block">Patrimônio</span>
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-zinc-900 text-white">
                {device.hasAssetTag ? `PT ${device.assetNumber}` : 'SEM PT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Aparelho / Modelo
              </span>
              <strong className="text-zinc-900">
                {device.brand} {device.model}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Setor / Loja
              </span>
              <strong className="text-zinc-900">
                {device.sector} · {device.store.replace('LOJA ', '')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                IMEI 1
              </span>
              <span className="font-mono text-zinc-800 text-[11px]">
                {device.imei1 || 'Não informado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Linha / Chip
              </span>
              <span className="font-mono text-zinc-800 text-[11px]">
                {device.phoneNumber || 'Sem linha'}
              </span>
            </div>
            <div className="col-span-2 pt-1 border-t border-zinc-200/80">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
                Acessórios Entregues e Conferidos:
              </span>
              <span className="font-bold text-zinc-900 text-xs">
                {device.accessories && device.accessories.length > 0
                  ? device.accessories.join(', ')
                  : 'Nenhum acessório adicional'}
              </span>
            </div>
          </div>

          {/* Resumo das Cláusulas */}
          <div className="text-[11px] text-zinc-700 bg-zinc-50/70 border border-zinc-200 rounded-xl p-3 space-y-1.5 leading-relaxed">
            <p className="font-bold text-zinc-900 uppercase text-[10.5px]">
              Declaração de Recebimento e Compromisso:
            </p>
            <p>
              Declaro ter recebido da <strong>AMILCO HOME CENTER ({device.store})</strong> o
              celular corporativo e os acessórios descritos acima em perfeitas condições de uso,
              comprometendo-me a utilizá-lo exclusivamente para fins profissionais, zelar pela
              sua guarda e conservação (incluindo capa, película, carregador e cartão de memória,
              quando houver) e devolvê-lo imediatamente quando solicitado pela empresa.
            </p>
          </div>
        </div>

        {/* Formulário de Assinatura no Celular */}
        <form
          onSubmit={handleConfirmSignature}
          className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-xs space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              CPF do Colaborador (Opcional para constar no Termo):
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={employeeCpf}
              onChange={(e) => setEmployeeCpf(formatCpf(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Quadro de Assinatura Touch */}
          <SignaturePadCanvas
            onSignatureChange={setSignatureDataUrl}
            signerName={device.employeeName}
          />

          {/* Checkbox de Concordância */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded text-red-600 focus:ring-red-600"
            />
            <span className="text-[11px] text-zinc-700 leading-snug">
              Li e concordo com os termos de responsabilidade acima e confirmo que esta é minha
              assinatura digital de recebimento do aparelho.
            </span>
          </label>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Gravando Termo no Diretório...'
                : 'Confirmar Assinatura e Arquivar Termo'}
            </span>
          </button>
        </form>
      </main>
    </div>
  );
};
