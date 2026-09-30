import React from 'react';
import { X, Printer, FileCheck } from 'lucide-react';
import { Device } from '../types/device';

interface ResponsibilityTermModalProps {
  device: Device | null;
  onClose: () => void;
}

export const ResponsibilityTermModal: React.FC<ResponsibilityTermModalProps> = ({
  device,
  onClose,
}) => {
  if (!device) return null;

  const handlePrint = () => {
    window.print();
  };

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
        <div className="no-print px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Termo de Responsabilidade e Entrega de Celular
              </h2>
              <p className="text-xs text-zinc-300">
                Amilco Home Center · Impressão oficial formatada para A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <h3 className="font-bold text-black uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
              1. IDENTIFICAÇÃO DO COLABORADOR
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-zinc-500 font-medium">Nome:</span>{' '}
                <strong className="text-black uppercase">{device.employeeName}</strong>
                {device.previousEmployeeName && (
                  <span className="text-[10px] text-zinc-500 block">
                    (Usuário anterior: {device.previousEmployeeName})
                  </span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Setor / Departamento:</span>{' '}
                <strong className="text-black uppercase">{device.sector}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Unidade / Loja:</span>{' '}
                <strong className="text-black uppercase">{device.store}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Data da Entrega:</span>{' '}
                <strong className="text-black">{device.acquisitionDate || currentDate}</strong>
              </div>
            </div>
          </div>

          {/* 2. Dados do Equipamento */}
          <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 space-y-1.5 text-xs print:bg-white print:border-black/40">
            <h3 className="font-bold text-black uppercase border-b border-zinc-200 pb-1 text-[11px] text-red-700 print:text-black">
              2. ESPECIFICAÇÃO DO EQUIPAMENTO E ACESSÓRIOS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-zinc-500 font-medium">N° de Patrimônio:</span>{' '}
                <strong className="text-black font-mono font-bold">
                  {device.hasAssetTag ? device.assetNumber : 'SEM PT (EM REGULARIZAÇÃO)'}
                </strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Marca / Modelo:</span>{' '}
                <strong className="text-black">{device.brand} - {device.model}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">IMEI Principal:</span>{' '}
                <strong className="text-black font-mono">{device.imei1 || 'Conforme Registro do Aparelho'}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Linha Telefônica:</span>{' '}
                <strong className="text-black font-mono">{device.phoneNumber || 'Chip Corporativo'}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Estado Físico:</span>{' '}
                <strong className="text-black">{device.condition}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Acesso VPN Corporativa:</span>{' '}
                <strong className="text-black">{device.hasVpn ? 'SIM (Configurado)' : 'NÃO'}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 print:border-black/20">
              <span className="text-zinc-500 font-medium">Acessórios Entregues:</span>{' '}
              <strong className="text-black">
                {device.accessories && device.accessories.length > 0
                  ? device.accessories.join(', ')
                  : 'Nenhum acessório adicional registrado'}
              </strong>
            </div>
          </div>

          {/* 3. Cláusulas Oficiais Amilco Home Center */}
          <div className="space-y-1.5 text-xs text-justify text-zinc-800 leading-normal">
            <h3 className="font-bold text-black uppercase text-[11px] text-red-700 print:text-black border-b border-zinc-200 print:border-black/20 pb-1">
              3. CONDIÇÕES GERAIS E OBRIGAÇÕES DO COLABORADOR
            </h3>
            <p>
              <strong>1-</strong> Se o equipamento for danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá novo equipamento e cobrará o valor de um equipamento da mesma marca ou equivalente ao da praça.
            </p>
            <p>
              <strong>2-</strong> Em caso de dano, inutilização, ou extravio do equipamento deverei comunicar imediatamente ao setor competente.
            </p>
            <p>
              <strong>3-</strong> Terminando os serviços ou no caso de rescisão do contrato de trabalho, devolverei o equipamento completo e em perfeito estado de conservação, considerando-se o tempo do uso do mesmo (tempo de vida útil), ao setor competente.
            </p>
            <p>
              <strong>4-</strong> Estando os equipamentos em minha posse, estarei sujeito a inspeções sem prévio aviso.
            </p>
          </div>

          {/* Campo de Assinaturas */}
          <div className="pt-6 space-y-6">
            <p className="text-xs text-center text-zinc-700 font-medium">
              Acaraú / Préa - CE, {currentDate}.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="text-center">
                <div className="border-t border-black pt-1 mx-auto w-11/12"></div>
                <p className="text-xs font-bold text-black uppercase">{device.employeeName}</p>
                <p className="text-[10px] text-zinc-600">Assinatura do Colaborador (Recebedor)</p>
              </div>

              <div className="text-center">
                <div className="border-t border-black pt-1 mx-auto w-11/12"></div>
                <p className="text-xs font-bold text-black uppercase">AMILCO HOME CENTER</p>
                <p className="text-[10px] text-zinc-600">Responsável Patrimônio / TI / Gerência</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="text-center">
                <div className="border-t border-zinc-400 pt-1 mx-auto w-10/12"></div>
                <p className="text-[10px] text-zinc-600">Testemunha 1 (Assinatura e CPF)</p>
              </div>

              <div className="text-center">
                <div className="border-t border-zinc-400 pt-1 mx-auto w-10/12"></div>
                <p className="text-[10px] text-zinc-600">Testemunha 2 (Assinatura e CPF)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="no-print px-6 py-3 border-t border-zinc-200 flex items-center justify-between bg-zinc-50 text-xs text-zinc-500 shrink-0">
          <span>AMILCO HOME CENTER · Imprima ou salve em PDF usando o botão acima.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
