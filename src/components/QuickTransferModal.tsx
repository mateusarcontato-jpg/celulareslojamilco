import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Check,
  ArrowRight,
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Package,
} from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';
import { getSynchronizedEmployees } from '../utils/userSyncUtils';

interface QuickTransferModalProps {
  device: Device | null;
  allDevices: Device[];
  onClose: () => void;
  onTransfer: (updatedDevices: Device[]) => void;
  sectors: string[];
  currentTechnicianName?: string;
}

export const QuickTransferModal: React.FC<QuickTransferModalProps> = ({
  device,
  allDevices,
  onClose,
  onTransfer,
  sectors,
  currentTechnicianName,
}) => {
  const [transferMode, setTransferMode] = useState<'CADASTRADO' | 'NOVO' | 'ESTOQUE'>('CADASTRADO');
  const [selectedExistingUser, setSelectedExistingUser] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [newEmployeeName, setNewEmployeeName] = useState<string>('');
  const [newSector, setNewSector] = useState<string>(device?.sector || 'VENDAS');
  const [reason, setReason] = useState<string>('Troca de usuário / remanejamento de aparelho');
  const [recordedBy, setRecordedBy] = useState<string>(currentTechnicianName || 'Gerência / TI');
  const [isPersonal, setIsPersonal] = useState<boolean>(Boolean(device?.isPersonalDevice));
  // Se o usuário escolhido já possui outro aparelho em uso, o que fazer com o aparelho antigo dele?
  const [oldDeviceAction, setOldDeviceAction] = useState<'ESTOQUE' | 'SWAP_COM_ANTERIOR' | 'MANTER_DOIS'>('ESTOQUE');

  // Lista sincronizada de todos os usuários cadastrados no sistema
  const synchronizedUsers = useMemo(() => {
    return getSynchronizedEmployees(allDevices);
  }, [allDevices]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return synchronizedUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return synchronizedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.sector.toLowerCase().includes(q) ||
        u.store.toLowerCase().includes(q) ||
        u.currentDevices.some((d) => d.model.toLowerCase().includes(q) || d.assetNumber.toLowerCase().includes(q))
    );
  }, [synchronizedUsers, userSearchQuery]);

  useEffect(() => {
    if (device) {
      setTransferMode('CADASTRADO');
      setSelectedExistingUser('');
      setUserSearchQuery('');
      setNewEmployeeName('');
      setNewSector(device.sector || 'VENDAS');
      setIsPersonal(Boolean(device.isPersonalDevice));
      setOldDeviceAction('ESTOQUE');
    }
  }, [device]);

  if (!device) return null;

  const chosenExistingUserObj = synchronizedUsers.find((u) => u.name === selectedExistingUser) || null;
  const chosenUserOtherDevices = chosenExistingUserObj
    ? chosenExistingUserObj.currentDevices.filter((d) => d.id !== device.id)
    : [];

  const handleSelectExistingUser = (userName: string) => {
    setSelectedExistingUser(userName);
    const found = synchronizedUsers.find((u) => u.name === userName);
    if (found && found.sector && found.sector !== 'ESTOQUE') {
      setNewSector(found.sector);
    }
  };

  const targetDisplayUser =
    transferMode === 'ESTOQUE'
      ? '— (Reserva Técnica)'
      : transferMode === 'CADASTRADO'
        ? selectedExistingUser || 'Selecione um usuário...'
        : newEmployeeName.trim().toUpperCase() || 'Novo Colaborador';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isStock = transferMode === 'ESTOQUE';
    const finalEmployeeName = isStock
      ? '— (Reserva Técnica)'
      : transferMode === 'CADASTRADO'
        ? selectedExistingUser.trim().toUpperCase()
        : newEmployeeName.trim().toUpperCase();

    if (!isStock && !finalEmployeeName) {
      return;
    }

    const finalStatus: DeviceStatus = isStock ? 'DISPONÍVEL' : 'EM USO';
    const finalSector = isStock ? 'ESTOQUE' : newSector;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');

    const newOcc = {
      id: `occ-trans-${Date.now()}`,
      date: dateStr,
      type: isStock ? ('DEVOLUCAO' as const) : ('TROCA' as const),
      title: isStock
        ? 'Devolução para Estoque (Disponível)'
        : `Troca / Remanejamento: ${device.employeeName} ➔ ${finalEmployeeName}`,
      description: isStock
        ? `Aparelho recolhido para o estoque de disponíveis. Estava com: ${device.employeeName}. Motivo: ${reason}`
        : `Aparelho alocado para ${finalEmployeeName} (Setor: ${finalSector}). Usuário anterior: ${device.employeeName}. Motivo: ${reason}`,
      previousUser: device.employeeName,
      newUser: finalEmployeeName,
      recordedBy,
    };

    const updatedMainDevice: Device = {
      ...device,
      previousEmployeeName: device.employeeName,
      employeeName: finalEmployeeName,
      sector: finalSector,
      status: finalStatus,
      isPersonalDevice: isStock ? false : isPersonal,
      updatedAt: now.toISOString(),
      occurrences: [newOcc, ...device.occurrences],
    };

    const devicesToUpdate: Device[] = [updatedMainDevice];

    // Sincronismo inteligente: se escolheu um usuário já cadastrado que tinha outro celular em uso
    if (
      transferMode === 'CADASTRADO' &&
      chosenUserOtherDevices.length > 0 &&
      oldDeviceAction !== 'MANTER_DOIS'
    ) {
      for (const oldDev of chosenUserOtherDevices) {
        if (oldDeviceAction === 'ESTOQUE') {
          const oldOcc = {
            id: `occ-sync-stock-${Date.now()}-${oldDev.id}`,
            date: dateStr,
            type: 'DEVOLUCAO' as const,
            title: `Recolhido p/ Estoque (Substituído pelo PT ${device.assetNumber})`,
            description: `O colaborador ${finalEmployeeName} recebeu o aparelho ${device.brand} ${device.model} (PT: ${device.assetNumber}) e este aparelho (${oldDev.model}) foi movido automaticamente para Celulares Disponíveis em Estoque.`,
            previousUser: finalEmployeeName,
            newUser: '— (Reserva Técnica)',
            recordedBy,
          };
          devicesToUpdate.push({
            ...oldDev,
            previousEmployeeName: finalEmployeeName,
            employeeName: '— (Reserva Técnica)',
            sector: 'ESTOQUE',
            status: 'DISPONÍVEL',
            isPersonalDevice: false,
            updatedAt: now.toISOString(),
            occurrences: [oldOcc, ...(oldDev.occurrences || [])],
          });
        } else if (oldDeviceAction === 'SWAP_COM_ANTERIOR') {
          const prevHolder = device.employeeName;
          const prevSector = device.sector;
          const oldOcc = {
            id: `occ-sync-swap-${Date.now()}-${oldDev.id}`,
            date: dateStr,
            type: 'TROCA' as const,
            title: `Permuta Cruzada: ${finalEmployeeName} ➔ ${prevHolder}`,
            description: `Permuta sincronizada de aparelhos entre ${finalEmployeeName} e ${prevHolder}.`,
            previousUser: finalEmployeeName,
            newUser: prevHolder,
            recordedBy,
          };
          devicesToUpdate.push({
            ...oldDev,
            previousEmployeeName: finalEmployeeName,
            employeeName: prevHolder,
            sector: prevSector,
            status: 'EM USO',
            updatedAt: now.toISOString(),
            occurrences: [oldOcc, ...(oldDev.occurrences || [])],
          });
        }
      }
    }

    onTransfer(devicesToUpdate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Troca de Usuário / Remanejamento Sincronizado
              </h2>
              <p className="text-xs text-zinc-300">
                PT: {device.hasAssetTag ? device.assetNumber : 'SEM PT'} · {device.brand} {device.model} ({device.store})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Resumo Visual De -> Para */}
          <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 block uppercase">
                Titular Atual
              </span>
              <strong className="text-zinc-950 text-sm font-bold uppercase">
                {device.employeeName}
              </strong>
              <span className="text-zinc-500 block text-[11px]">{device.sector}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-red-600 shrink-0 mx-2" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-500 block uppercase">
                Novo Destino Sincronizado
              </span>
              <strong className="text-red-700 text-sm font-bold uppercase">
                {targetDisplayUser}
              </strong>
              <span className="text-zinc-500 block text-[11px]">
                {transferMode === 'ESTOQUE' ? 'ESTOQUE (DISPONÍVEL)' : newSector}
              </span>
            </div>
          </div>

          {/* 3 Opções de Destino: 1) Usuário Cadastrado (Lista Completa), 2) Novo Usuário, 3) Enviar p/ Estoque */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1.5 uppercase text-[11px]">
              1. Escolha o Tipo de Movimentação:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTransferMode('CADASTRADO')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  transferMode === 'CADASTRADO'
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${transferMode === 'CADASTRADO' ? 'text-red-500' : 'text-zinc-500'}`} />
                <div>
                  <span className="font-bold block text-[11px]">Usuário Cadastrado</span>
                  <span className={`text-[10px] block ${transferMode === 'CADASTRADO' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Listar os {synchronizedUsers.length} usuários
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('NOVO')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  transferMode === 'NOVO'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <UserPlus className={`w-4 h-4 shrink-0 ${transferMode === 'NOVO' ? 'text-white' : 'text-red-600'}`} />
                <div>
                  <span className="font-bold block text-[11px]">Cadastrar Novo</span>
                  <span className={`text-[10px] block ${transferMode === 'NOVO' ? 'text-red-100' : 'text-zinc-500'}`}>
                    Novo colaborador
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('ESTOQUE')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  transferMode === 'ESTOQUE'
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Package className={`w-4 h-4 shrink-0 ${transferMode === 'ESTOQUE' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                <div>
                  <span className="font-bold block text-[11px]">Devolver ao Estoque</span>
                  <span className={`text-[10px] block ${transferMode === 'ESTOQUE' ? 'text-emerald-100' : 'text-zinc-500'}`}>
                    Fica Disponível
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* MODO 1: LISTA SINCRONIZADA DE TODOS OS USUÁRIOS CADASTRADOS */}
          {transferMode === 'CADASTRADO' && (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-900">
                  Selecione um Usuário Cadastrado ({synchronizedUsers.length} em sincronismo):
                </label>
                {selectedExistingUser && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Selecionado: {selectedExistingUser}
                  </span>
                )}
              </div>

              {/* Busca rápida de usuário */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar usuário por nome, setor ou aparelho atual..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Lista clicável de todos os usuários sincronizados */}
              <div className="max-h-44 overflow-y-auto border border-zinc-200 rounded-xl bg-white divide-y divide-zinc-100">
                {filteredUsers.map((u) => {
                  const isSelected = selectedExistingUser === u.name;
                  const isCurrentHolder = u.name === device.employeeName.toUpperCase();
                  return (
                    <button
                      key={u.name}
                      type="button"
                      disabled={isCurrentHolder}
                      onClick={() => handleSelectExistingUser(u.name)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isCurrentHolder
                          ? 'opacity-45 bg-zinc-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-red-50 text-red-950 font-bold'
                            : 'hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs uppercase truncate">{u.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-semibold">
                            {u.sector}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {u.store.replace('LOJA ', '')}
                          </span>
                        </div>
                        {u.currentDevices.length > 0 ? (
                          <span className="text-[10px] text-zinc-500 block truncate">
                            Aparelho atual:{' '}
                            <strong>
                              {u.currentDevices.map((d) => `${d.model} (PT ${d.assetNumber})`).join(', ')}
                            </strong>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Sem aparelho ativo no momento (Histórico)
                          </span>
                        )}
                      </div>

                      {isCurrentHolder ? (
                        <span className="text-[10px] font-bold text-zinc-400">Atual</span>
                      ) : isSelected ? (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shrink-0">
                          ✓ Escolhido
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                          Selecionar
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Se o usuário selecionado já tem outro celular em uso, oferece sincronismo automático */}
              {chosenUserOtherDevices.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Sincronismo: {selectedExistingUser} já está com{' '}
                      {chosenUserOtherDevices.map((d) => `${d.model} (PT ${d.assetNumber})`).join(', ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    O que deseja fazer com o aparelho antigo que estava com {selectedExistingUser}?
                  </p>
                  <div className="space-y-1.5 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                      <input
                        type="radio"
                        name="oldDeviceAction"
                        checked={oldDeviceAction === 'ESTOQUE'}
                        onChange={() => setOldDeviceAction('ESTOQUE')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>
                        Enviar o aparelho antigo dele automaticamente para <strong>Celulares Disponíveis (Estoque)</strong>
                      </span>
                    </label>
                    {device.status !== 'DISPONÍVEL' && (
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                        <input
                          type="radio"
                          name="oldDeviceAction"
                          checked={oldDeviceAction === 'SWAP_COM_ANTERIOR'}
                          onChange={() => setOldDeviceAction('SWAP_COM_ANTERIOR')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>
                          Permutar (trocar cruzado): passar o aparelho antigo dele para <strong>{device.employeeName}</strong>
                        </span>
                      </label>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                      <input
                        type="radio"
                        name="oldDeviceAction"
                        checked={oldDeviceAction === 'MANTER_DOIS'}
                        onChange={() => setOldDeviceAction('MANTER_DOIS')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>Manter os dois aparelhos no nome de {selectedExistingUser}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: CADASTRAR NOVO USUÁRIO */}
          {transferMode === 'NOVO' && (
            <div className="p-3.5 bg-red-50/50 border border-red-200 rounded-xl space-y-3">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Nome do Novo Colaborador <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MARCOS LIMA"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-bold uppercase focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950 text-xs select-none">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Celular Pessoal do Colaborador (Uso Próprio)</span>
                </label>
              </div>
            </div>
          )}

          {transferMode !== 'ESTOQUE' && (
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Setor do Usuário
              </label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 font-semibold"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Motivo da Troca / Remanejamento
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Substituição de aparelho, admissão..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Registrado por
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={transferMode === 'CADASTRADO' && !selectedExistingUser}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e Sincronizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
