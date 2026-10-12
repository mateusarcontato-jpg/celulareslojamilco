import React from 'react';
import { X, Printer, FileCheck, Upload, FolderCheck, CheckCircle2 } from 'lucide-react';
import { Device } from '../types/device';

interface ResponsibilityTermModalProps {
  device: Device | null;
  onClose: () => void;
  onOpenDirectoryForUpload?: (device: Device) => void;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  device,
  onClose,
  onOpenDirectoryForUpload,
}) => {
  if (!device) return null;

  const handlePrint = () => {
    window.print();
  };

  const hasUploadedTerm = Array.isArray(device.signedTerms) && device.signedTerms.length > 0;

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print-modal-card">
        {/* Modal Toolbar in Amilco Black & Red */}
        <div className="no-print px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Termo de Responsabilidade e Entrega de Celular
                </h2>
                {hasUploadedTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Escaneado no Diretório
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                Amilco Home Center · Impressão oficial A4 para assinatura física e posterior upload no Diretório
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDirectoryForUpload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectoryForUpload(device);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-300 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                title="Abrir Diretório para anexar a foto ou documento escaneado pós-assinatura"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anexar Termo Escaneado</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Termo (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Termo Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-zinc-900 text-xs sm:text-sm space-y-4 print:p-6 print:space-y-4 font-sans leading-relaxed print-sheet-a4">
          {/* Banner informativo no topo (não sai na impressão) */}
          {onOpenDirectoryForUpload && (
            <div className="no-print bg-zinc-900 text-white p-3 rounded-xl border-l-4 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Após imprimir e colher a assinatura de <strong>{device.employeeName}</strong>, guarde a foto ou PDF escaneado no Diretório.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectoryForUpload(device);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar Foto / Escaneado para o Diretório</span>
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

          {/* 4. Assinaturas */}
          <div className="pt-6 space-y-6">
            <p className="text-right text-xs text-zinc-600">
              {device.store}, {currentDate}.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="text-center">
                <div className="border-t border-black pt-1.5 mx-4">
                  <p className="font-bold text-black text-xs uppercase">{device.employeeName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Colaborador(a) / Usuário(a)</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">CPF: ___________________________</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-black pt-1.5 mx-4">
                  <p className="font-bold text-black text-xs uppercase">AMILCO HOME CENTER</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Responsável pela Entrega / T.I.</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Assinatura e Carimbo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
