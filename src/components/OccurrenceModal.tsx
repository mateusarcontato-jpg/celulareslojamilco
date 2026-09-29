import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  ArrowRightLeft, 
  AlertOctagon, 
  FileText, 
  Check, 
  Paperclip, 
  Calendar, 
  DollarSign, 
  User,
  Image as ImageIcon
} from 'lucide-react';
import { Device, DeviceOccurrence, OccurrenceType, DeviceStatus } from '../types/device';

interface OccurrenceModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOccurrence: (updatedDevice: Device, occurrence: DeviceOccurrence) => void;
  sectors: string[];
}

export const OccurrenceModal: React.FC<OccurrenceModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveOccurrence,
  sectors,
}) => {
  if (!isOpen || !device) return null;

  const [type, setType] = useState<OccurrenceType>('MANUTENÇÃO');
  const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Troca de usuário / aparelho
  const [previousUser, setPreviousUser] = useState(device.employeeName);
  const [newUser, setNewUser] = useState('');
  const [newSector, setNewSector] = useState(device.sector);
  const [updateCurrentEmployee, setUpdateCurrentEmployee] = useState(true);

  // Manutenção
  const [serviceOrderOrBo, setServiceOrderOrBo] = useState('');
  const [cost, setCost] = useState('');
  const [technicianOrProvider, setTechnicianOrProvider] = useState('');
  const [changeStatusToMaintenance, setChangeStatusToMaintenance] = useState(true);

  // Perda
  const [changeStatusToLoss, setChangeStatusToLoss] = useState(true);

  // Responsável & Anexos
  const [recordedBy, setRecordedBy] = useState('Gestor de Patrimônio');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setAttachmentPreview(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const generatedTitle = title.trim() || 
      (type === 'MANUTENÇÃO' ? `Manutenção - ${technicianOrProvider || 'Assistência Técnica'}` :
       type === 'TROCA' ? `Troca de Usuário: ${previousUser} ➔ ${newUser || 'Novo Colaborador'}` :
       type === 'PERDA' ? `Registro de Perda/Extravio` : `${type}`);

    const newOcc: DeviceOccurrence = {
      id: `occ-${Date.now()}`,
      date,
      type,
      title: generatedTitle,
      description: description.trim() || 'Sem observações adicionais.',
      previousUser: type === 'TROCA' ? previousUser : undefined,
      newUser: type === 'TROCA' ? (newUser.trim().toUpperCase() || 'Novo Colaborador') : undefined,
      serviceOrderOrBo: serviceOrderOrBo.trim() || undefined,
      cost: cost.trim() || undefined,
      technicianOrProvider: technicianOrProvider.trim() || undefined,
      recordedBy: recordedBy.trim() || 'Gestor',
      attachmentName: attachmentName || undefined,
      attachmentData: attachmentPreview || undefined,
    };

    // Atualiza dados no aparelho se aplicável
    let updatedStatus: DeviceStatus = device.status;
    let updatedEmployee = device.employeeName;
    let updatedPreviousEmployee = device.previousEmployeeName;
    let updatedSector = device.sector;

    if (type === 'TROCA' && updateCurrentEmployee && newUser.trim()) {
      updatedPreviousEmployee = device.employeeName;
      updatedEmployee = newUser.trim().toUpperCase();
      updatedSector = newSector;
      if (updatedStatus === 'DISPONÍVEL') updatedStatus = 'EM USO';
    } else if (type === 'MANUTENÇÃO' && changeStatusToMaintenance) {
      updatedStatus = 'MANUTENÇÃO';
    } else if (type === 'PERDA' && changeStatusToLoss) {
      updatedStatus = 'PERDA / EXTRAVIO';
    } else if (type === 'DEVOLUCAO') {
      updatedStatus = 'DISPONÍVEL';
      updatedPreviousEmployee = device.employeeName;
      updatedEmployee = '— (Reserva Técnica)';
    }

    const updatedDevice: Device = {
      ...device,
      employeeName: updatedEmployee,
      previousEmployeeName: updatedPreviousEmployee,
      sector: updatedSector,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
      occurrences: [newOcc, ...device.occurrences],
    };

    onSaveOccurrence(updatedDevice, newOcc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Amilco Red & Black */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              {type === 'MANUTENÇÃO' && <Wrench className="w-5 h-5" />}
              {type === 'TROCA' && <ArrowRightLeft className="w-5 h-5" />}
              {type === 'PERDA' && <AlertOctagon className="w-5 h-5" />}
              {type === 'ENTREGA' && <FileText className="w-5 h-5" />}
              {type === 'DEVOLUCAO' && <Check className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Anexar Ocorrência ao Fichário
              </h2>
              <p className="text-xs text-zinc-300">
                PT: {device.hasAssetTag ? device.assetNumber : 'SEM PT'} · {device.model} ({device.employeeName})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Seletor de Tipo de Ocorrência */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1.5 uppercase text-[11px] tracking-wider">
              Tipo de Evento no Fichário <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['MANUTENÇÃO', 'TROCA', 'PERDA', 'ENTREGA', 'DEVOLUCAO'] as OccurrenceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-1 text-center font-bold text-[11px] rounded-lg border transition-all ${
                    type === t
                      ? 'bg-red-600 border-red-600 text-white shadow-xs'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Data do Evento <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <Calendar className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Título / Resumo da Ocorrência
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'MANUTENÇÃO' ? 'Troca de tela frontal' : type === 'TROCA' ? 'Troca de usuário' : 'Descrição curta'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Campos específicos de TROCA */}
          {type === 'TROCA' && (
            <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <ArrowRightLeft className="w-4 h-4 text-red-600" />
                <span>Registro de Troca de Aparelho / Usuário</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Quem estava com o aparelho (Usuário Anterior):
                  </label>
                  <input
                    type="text"
                    value={previousUser}
                    onChange={(e) => setPreviousUser(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Com quem ficou / Novo Usuário: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="Ex: MARCOS ALVES"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 uppercase font-semibold focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Novo Setor:
                  </label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900"
                  >
                    {sectors.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      checked={updateCurrentEmployee}
                      onChange={(e) => setUpdateCurrentEmployee(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span>Atualizar responsável no cadastro principal</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos de MANUTENÇÃO */}
          {type === 'MANUTENÇÃO' && (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Wrench className="w-4 h-4 text-red-600" />
                <span>Dados do Reparo / Assistência Técnica</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Prestador / Assistência:
                  </label>
                  <input
                    type="text"
                    value={technicianOrProvider}
                    onChange={(e) => setTechnicianOrProvider(e.target.value)}
                    placeholder="Ex: Oficina Autorizada / Sobral"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    N° da O.S. (Ordem de Serviço):
                  </label>
                  <input
                    type="text"
                    value={serviceOrderOrBo}
                    onChange={(e) => setServiceOrderOrBo(e.target.value)}
                    placeholder="Ex: OS-2026-981"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Custo / Valor (R$):
                  </label>
                  <input
                    type="text"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Ex: R$ 250,00"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-800">
                <input
                  type="checkbox"
                  checked={changeStatusToMaintenance}
                  onChange={(e) => setChangeStatusToMaintenance(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Mudar status do aparelho para "MANUTENÇÃO"</span>
              </label>
            </div>
          )}

          {/* Campos específicos de PERDA */}
          {type === 'PERDA' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Registro de Perda, Furto ou Extravio</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    N° do Boletim de Ocorrência (B.O.):
                  </label>
                  <input
                    type="text"
                    value={serviceOrderOrBo}
                    onChange={(e) => setServiceOrderOrBo(e.target.value)}
                    placeholder="Ex: BO-2026/0491-Acaraú"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-950">
                    <input
                      type="checkbox"
                      checked={changeStatusToLoss}
                      onChange={(e) => setChangeStatusToLoss(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Marcar status como "PERDA / EXTRAVIO"</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Descrição Detalhada / Laudo */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Descrição Detalhada / Laudo Técnico / Histórico
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que ocorreu, motivo da troca, defeito constatado ou circunstâncias..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Anexo de Documento ou Comprovante */}
          <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                Anexo de Fichário (Nota, Laudo, Comprovante ou Foto)
              </span>
              {attachmentName && (
                <span className="text-[11px] text-emerald-700 font-semibold truncate max-w-[200px]">
                  {attachmentName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors shadow-2xs">
                <Paperclip className="w-3.5 h-3.5 text-red-600" />
                <span>Escolher Arquivo</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {attachmentPreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="w-8 h-8 rounded object-cover border border-zinc-300"
                  />
                  <span className="text-[11px] text-zinc-500">Imagem anexada</span>
                </div>
              )}
            </div>
          </div>

          {/* Responsável pelo Registro */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Responsável pelo Registro (Gerência / TI):
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Gravar Ocorrência no Fichário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
