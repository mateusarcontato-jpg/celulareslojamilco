/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Table as TableIcon, 
  LayoutGrid, 
  Filter, 
  FileText, 
  Download, 
  Shield, 
  HelpCircle,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Wrench,
  History,
  Layers,
  Building,
  CloudCheck,
  SlidersHorizontal,
  ClipboardCheck
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Device, DeviceOccurrence, DeviceStatus, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS } from './types/device';
import { matchAdvancedCriteria, countActiveAdvancedFilters } from './utils/filterUtils';
import { 
  getStoredDevices, 
  saveStoredDevices, 
  getStoredStores, 
  getStoredSectors, 
  resetToInitialData,
  exportToCsv
} from './services/storage';
import { 
  subscribeToDevices, 
  saveDeviceToFirestore, 
  deleteDeviceFromFirestore, 
  seedInitialDevices,
  importBatchDevicesToFirestore 
} from './services/firebaseDeviceService';
import { auth, loginWithGoogle, logout, testConnection } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { DeviceTable } from './components/DeviceTable';
import { DeviceCardGrid } from './components/DeviceCardGrid';
import { DeviceFormModal } from './components/DeviceFormModal';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { ResponsibilityTermModal } from './components/ResponsibilityTermModal';
import { QuickTransferModal } from './components/QuickTransferModal';
import { ImportExportModal } from './components/ImportExportModal';
import { OccurrenceModal } from './components/OccurrenceModal';
import { DeviceHistoryModal } from './components/DeviceHistoryModal';
import { PdfReportModal } from './components/PdfReportModal';
import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { DeviceAuditModal } from './components/DeviceAuditModal';
import { LoginScreen } from './components/LoginScreen';
import { TechnicianUser } from './types/auth';
import { getStoredCurrentTechnician, logoutTechnicianService } from './services/authService';

export default function App() {
  const [devices, setDevices] = useState<Device[]>(() => getStoredDevices());
  const [stores, setStores] = useState<string[]>(() => getStoredStores());
  const [sectors, setSectors] = useState<string[]>(() => getStoredSectors());

  // Autenticação de Técnicos
  const [currentTechnician, setCurrentTechnician] = useState<TechnicianUser | null>(() => getStoredCurrentTechnician());

  // Firebase State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Filter States
  const [currentStore, setCurrentStore] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('TODOS');
  const [vpnOnly, setVpnOnly] = useState<boolean>(false);
  const [semPtOnly, setSemPtOnly] = useState<boolean>(false);
  const [personalOnly, setPersonalOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isGroupedBySector, setIsGroupedBySector] = useState<boolean>(true); // Separado por grupos igual no PDF

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [termDevice, setTermDevice] = useState<Device | null>(null);
  const [transferDevice, setTransferDevice] = useState<Device | null>(null);
  const [occurrenceDevice, setOccurrenceDevice] = useState<Device | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [auditDevice, setAuditDevice] = useState<Device | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'OK' | 'MISSING' | 'PENDING'>('ALL');
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isMainAdvancedModalOpen, setIsMainAdvancedModalOpen] = useState(false);
  const [mainAdvancedCriteria, setMainAdvancedCriteria] = useState<AdvancedFilterCriteria>(INITIAL_ADVANCED_FILTERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Auth Listener e Teste de Conexão Firebase
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Sincronização em Tempo Real com o Firestore
  useEffect(() => {
    const unsubscribeSnapshot = subscribeToDevices(
      (firestoreDevices) => {
        if (firestoreDevices && firestoreDevices.length > 0) {
          setDevices(firestoreDevices);
          saveStoredDevices(firestoreDevices);
          setIsFirebaseConnected(true);
        }
      },
      (error) => {
        console.warn('Operando com armazenamento local devido a erro no Firestore:', error);
        setIsFirebaseConnected(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filtered devices calculation
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      if (currentStore !== 'TODAS' && device.store !== currentStore) {
        return false;
      }

      if (statusFilter !== 'ALL' && device.status !== statusFilter) {
        return false;
      }

      if (sectorFilter !== 'TODOS' && device.sector !== sectorFilter) {
        return false;
      }

      if (vpnOnly && !device.hasVpn) {
        return false;
      }

      if (semPtOnly && (device.hasAssetTag && device.assetNumber !== 'SEM PT')) {
        return false;
      }

      if (personalOnly && !device.isPersonalDevice) {
        return false;
      }

      // Filtro de Auditoria / Checkup
      if (auditFilter === 'OK' && device.auditInfo?.status !== 'OK') {
        return false;
      }
      if (auditFilter === 'MISSING' && device.auditInfo?.status !== 'COM_PENDENCIA') {
        return false;
      }
      if (auditFilter === 'PENDING' && (device.auditInfo && device.auditInfo.status !== 'NAO_AUDITADO')) {
        return false;
      }

      if (!matchAdvancedCriteria(device, mainAdvancedCriteria)) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = device.employeeName.toLowerCase().includes(query);
        const matchPrev = (device.previousEmployeeName || '').toLowerCase().includes(query);
        const matchAsset = device.assetNumber.toLowerCase().includes(query);
        const matchModel = device.model.toLowerCase().includes(query);
        const matchSector = device.sector.toLowerCase().includes(query);
        const matchPhone = (device.phoneNumber || '').toLowerCase().includes(query);
        const matchImei = (device.imei1 || '').toLowerCase().includes(query);

        if (!matchName && !matchPrev && !matchAsset && !matchModel && !matchSector && !matchPhone && !matchImei) {
          return false;
        }
      }

      return true;
    });
  }, [devices, currentStore, statusFilter, sectorFilter, vpnOnly, semPtOnly, personalOnly, auditFilter, searchQuery, mainAdvancedCriteria]);

  // Estatísticas de Auditoria e Checkup
  const auditStats = useMemo(() => {
    const total = devices.length;
    const ok = devices.filter((d) => d.auditInfo?.status === 'OK').length;
    const missing = devices.filter((d) => d.auditInfo?.status === 'COM_PENDENCIA').length;
    const pending = devices.filter((d) => !d.auditInfo || d.auditInfo.status === 'NAO_AUDITADO').length;
    const percent = total > 0 ? Math.round(((ok + missing) / total) * 100) : 0;
    return { total, ok, missing, pending, percent };
  }, [devices]);

  // Contagem de Celulares Pessoais encontrados na filtragem atual
  const filteredPersonalCount = useMemo(() => {
    return filteredDevices.filter((d) => Boolean(d.isPersonalDevice)).length;
  }, [filteredDevices]);

  // Actions Handlers integrados ao Firebase
  const handleSaveDevice = async (savedDevice: Device) => {
    // Atualização otimista local
    setDevices((prev) => {
      const exists = prev.some((d) => d.id === savedDevice.id);
      const updated = exists 
        ? prev.map((d) => (d.id === savedDevice.id ? savedDevice : d))
        : [savedDevice, ...prev];
      saveStoredDevices(updated);
      return updated;
    });

    try {
      await saveDeviceToFirestore(savedDevice);
      setIsFirebaseConnected(true);
      showToast(
        savedDevice.assetNumber === 'SEM PT'
          ? `Aparelho de ${savedDevice.employeeName} salvo e sincronizado na nuvem Firebase!`
          : `Aparelho PT ${savedDevice.assetNumber} salvo e sincronizado na nuvem Firebase!`
      );
    } catch (e) {
      console.error('[App] Erro ao sincronizar com Firebase:', e);
      showToast('Aparelho salvo localmente.');
    }
  };

  const handleSaveOccurrence = async (updatedDevice: Device, occurrence: DeviceOccurrence) => {
    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d));
      saveStoredDevices(updated);
      return updated;
    });
    if (historyDevice && historyDevice.id === updatedDevice.id) {
      setHistoryDevice(updatedDevice);
    }

    try {
      await saveDeviceToFirestore(updatedDevice);
      setIsFirebaseConnected(true);
      showToast(`Ocorrência "${occurrence.title}" gravada no Firebase!`);
    } catch (e) {
      console.error('[App] Erro ao gravar ocorrência no Firebase:', e);
      showToast('Ocorrência gravada localmente.');
    }
  };

  const handleQuickTransfer = async (updatedDevice: Device) => {
    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d));
      saveStoredDevices(updated);
      return updated;
    });
    try {
      await saveDeviceToFirestore(updatedDevice);
      setIsFirebaseConnected(true);
      showToast(`Troca salva no Firebase: Alocado para ${updatedDevice.employeeName}.`);
    } catch (e) {
      console.error('[App] Erro na transferência:', e);
      showToast(`Troca registrada localmente.`);
    }
  };

  const handleSaveAudit = async (updatedDevice: Device) => {
    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d));
      saveStoredDevices(updated);
      return updated;
    });
    if (detailDevice && detailDevice.id === updatedDevice.id) {
      setDetailDevice(updatedDevice);
    }
    if (historyDevice && historyDevice.id === updatedDevice.id) {
      setHistoryDevice(updatedDevice);
    }

    try {
      await saveDeviceToFirestore(updatedDevice);
      setIsFirebaseConnected(true);
      const isOk = updatedDevice.auditInfo?.status === 'OK';
      showToast(
        isOk
          ? `✅ Checkup 100% OK gravado para ${updatedDevice.employeeName}!`
          : `⚠️ Checkup com Pendência gravado para ${updatedDevice.employeeName}!`
      );
    } catch (e) {
      console.error('[App] Erro ao gravar auditoria no Firebase:', e);
      showToast('Checkup gravado localmente.');
    }
  };

  const handleDeleteDevice = async (deviceToDelete: Device) => {
    const confirmMessage = `Tem certeza que deseja remover o celular de ${deviceToDelete.employeeName} (Patrimônio: ${deviceToDelete.assetNumber})?`;
    if (window.confirm(confirmMessage)) {
      setDevices((prev) => {
        const updated = prev.filter((d) => d.id !== deviceToDelete.id);
        saveStoredDevices(updated);
        return updated;
      });
      try {
        await deleteDeviceFromFirestore(deviceToDelete.id);
        setIsFirebaseConnected(true);
        showToast('Celular removido do Firebase e do inventário.');
      } catch (e) {
        console.error('[App] Erro ao excluir no Firebase:', e);
        showToast('Celular removido do inventário.');
      }
    }
  };

  const handleImportDevices = async (imported: Device[]) => {
    setDevices(imported);
    try {
      await importBatchDevicesToFirestore(imported);
      showToast(`${imported.length} celulares sincronizados na nuvem Firebase.`);
    } catch (e) {
      showToast(`${imported.length} celulares importados localmente.`);
    }
  };

  const handleResetData = async () => {
    const initial = resetToInitialData();
    setDevices(initial);
    setCurrentStore('TODAS');
    setStatusFilter('ALL');
    setSectorFilter('TODOS');
    setSearchQuery('');
    setVpnOnly(false);
    setSemPtOnly(false);

    try {
      await seedInitialDevices();
      showToast('Base dos 35 aparelhos sincronizada no Firebase Firestore!');
    } catch (e) {
      showToast('Base de 35 aparelhos restaurada localmente.');
    }
  };

  const clearAllFilters = () => {
    setCurrentStore('TODAS');
    setStatusFilter('ALL');
    setSectorFilter('TODOS');
    setSearchQuery('');
    setVpnOnly(false);
    setSemPtOnly(false);
    setPersonalOnly(false);
    setAuditFilter('ALL');
    setMainAdvancedCriteria(INITIAL_ADVANCED_FILTERS);
  };

  const activeMainAdvCount = countActiveAdvancedFilters(mainAdvancedCriteria);

  const activeFiltersCount = 
    (currentStore !== 'TODAS' ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (sectorFilter !== 'TODOS' ? 1 : 0) +
    (vpnOnly ? 1 : 0) +
    (semPtOnly ? 1 : 0) +
    (personalOnly ? 1 : 0) +
    (auditFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    activeMainAdvCount;

  const handleLogout = async () => {
    await logoutTechnicianService();
    setCurrentTechnician(null);
    showToast('Sessão encerrada com sucesso.');
  };

  // Se o técnico não estiver autenticado, exige a tela de login
  if (!currentTechnician) {
    return (
      <LoginScreen
        onSuccess={(tech) => {
          setCurrentTechnician(tech);
          showToast(`Bem-vindo, ${tech.name}!`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-950 text-white border-l-4 border-red-600 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar in Amilco Red, Black and White with Firebase */}
      <Navbar
        currentStore={currentStore}
        stores={stores}
        onSelectStore={setCurrentStore}
        onOpenNewDeviceModal={() => {
          setEditingDevice(null);
          setIsFormOpen(true);
        }}
        onOpenImportExportModal={() => setIsImportExportOpen(true)}
        onOpenPdfReportModal={() => setIsPdfModalOpen(true)}
        totalDevicesCount={devices.length}
        isFirebaseConnected={isFirebaseConnected}
        currentTechnician={currentTechnician}
        onOpenLoginModal={() => setCurrentTechnician(null)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${termDevice || isPdfModalOpen ? 'no-print' : ''}`}>
        {/* Banner de Contexto da Loja e Unidade */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800">
                {currentStore === 'TODAS' ? 'Painel Consolidado (35 Aparelhos)' : currentStore}
              </span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                Amilco Home Center
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 mt-1">
              Controle de Patrimônio de Celulares
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Acaraú (24 aparelhos) · Préa (11 aparelhos) · Nuvem Firebase Firestore Ativa em Tempo Real
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Botão de Filtro e Exportação de PDF */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 border-b-2 border-red-600 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <span>Exportar Relatório PDF</span>
            </button>

            <button
              onClick={() => exportToCsv(filteredDevices)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
              title="Exportar planilha Excel"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => {
                setEditingDevice(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Celular</span>
            </button>
          </div>
        </div>

        {/* Dashboard de Estatísticas com Cores Preto, Vermelho e Branco */}
        <StatsCards
          devices={devices}
          selectedStatus={statusFilter}
          onFilterStatus={(st) => {
            setStatusFilter(st === statusFilter ? 'ALL' : st);
            setSemPtOnly(false);
          }}
          vpnOnly={vpnOnly}
          onToggleVpnOnly={() => setVpnOnly(!vpnOnly)}
          semPtOnly={semPtOnly}
          onToggleSemPtOnly={() => {
            setSemPtOnly(!semPtOnly);
            if (!semPtOnly) {
              setStatusFilter('ALL');
            }
          }}
          personalOnly={personalOnly}
          onTogglePersonalOnly={() => setPersonalOnly(!personalOnly)}
          onFilterStore={(store) => {
            setCurrentStore(currentStore === store ? 'TODAS' : store);
          }}
        />

        {/* Barra de Filtros, Pesquisa e Controles de Visualização */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 mb-3 shadow-2xs no-print space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por colaborador, usuário anterior, patrimônio, modelo, IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-zinc-300 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controles de Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Setor */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200 font-medium">
                <span className="font-bold text-zinc-900">Setor:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="TODOS">Todos os Setores</option>
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão Rápido Celular Pessoal do Colaborador */}
              <button
                type="button"
                onClick={() => setPersonalOnly(!personalOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  personalOnly
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs ring-2 ring-purple-400/30'
                    : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
                title="Filtrar colaboradores que utilizam aparelho pessoal"
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Pessoal ({filteredPersonalCount})</span>
              </button>

              {/* Botão Rápido de VPN */}
              <button
                type="button"
                onClick={() => setVpnOnly(!vpnOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  vpnOnly
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>VPN</span>
              </button>

              {/* Botão Rápido Sem Tombamento */}
              <button
                type="button"
                onClick={() => setSemPtOnly(!semPtOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  semPtOnly
                    ? 'bg-red-100 text-red-900 border-red-400 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Sem PT</span>
              </button>

              {/* Botão Janelinha de Acessórios & Estado Físico */}
              <button
                type="button"
                onClick={() => setIsMainAdvancedModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  activeMainAdvCount > 0
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
                title="Filtrar colaboradores por quem tem carregador, capa, tela quebrada ou avarias"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
                <span>Acessórios & Estado</span>
                {activeMainAdvCount > 0 && (
                  <span className="bg-white text-black px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono">
                    {activeMainAdvCount}
                  </span>
                )}
              </button>

              {/* Limpar Filtros se houver ativos */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  Limpar ({activeFiltersCount})
                </button>
              )}

              {/* Alternador de Visualização (Tabela vs Cards) */}
              <div className="flex items-center border border-zinc-300 rounded-lg p-0.5 bg-zinc-100">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Modo Tabela / Planilha"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Modo Cartões"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Resumo Dinâmico dos Filtros com Exibição de Celulares Pessoais */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl mb-4 text-xs font-medium shadow-2xs no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-600">
              Aparelhos na filtragem: <strong className="text-zinc-950 font-bold">{filteredDevices.length}</strong> de {devices.length}
            </span>
            <span className="text-zinc-300">·</span>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
              filteredPersonalCount > 0 
                ? 'bg-purple-100 text-purple-900 border border-purple-300' 
                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}>
              <Smartphone className="w-3.5 h-3.5 text-purple-600" />
              <span>
                Celulares Pessoais neste filtro: <strong className="text-purple-950 font-black">{filteredPersonalCount}</strong> {filteredPersonalCount === 1 ? 'usuário' : 'usuários'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filteredPersonalCount > 0 && !personalOnly && (
              <button
                type="button"
                onClick={() => setPersonalOnly(true)}
                className="text-[11px] font-bold text-purple-800 hover:text-purple-950 underline cursor-pointer"
              >
                Isolar os {filteredPersonalCount} pessoais
              </button>
            )}

            {personalOnly && (
              <button
                type="button"
                onClick={() => setPersonalOnly(false)}
                className="text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
              >
                Voltar a exibir todos
              </button>
            )}
          </div>
        </div>

        {/* Painel de Auditoria & Checkup em Tempo Real */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 mb-4 shadow-2xs no-print flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-950">
                  Auditoria & Checkup Presencial de Itens
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200 font-mono">
                  {auditStats.ok + auditStats.missing} de {auditStats.total} conferidos ({auditStats.percent}%)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Conferência física: verifique se está tudo OK ou se faltam carregador, cabo, capa e película
              </p>
            </div>
          </div>

          {/* Filtros Rápidos de Auditoria */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setAuditFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                auditFilter === 'ALL'
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Todos ({auditStats.total})
            </button>

            <button
              type="button"
              onClick={() => setAuditFilter(auditFilter === 'OK' ? 'ALL' : 'OK')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                auditFilter === 'OK'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conferidos 100% OK ({auditStats.ok})</span>
            </button>

            <button
              type="button"
              onClick={() => setAuditFilter(auditFilter === 'MISSING' ? 'ALL' : 'MISSING')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                auditFilter === 'MISSING'
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-red-50 text-red-950 border-red-200 hover:bg-red-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Faltando Itens ({auditStats.missing})</span>
            </button>

            <button
              type="button"
              onClick={() => setAuditFilter(auditFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                auditFilter === 'PENDING'
                  ? 'bg-zinc-700 text-white border-zinc-700 shadow-2xs'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              <span>Pendentes ({auditStats.pending})</span>
            </button>
          </div>
        </div>

        {/* Visão de Conteúdo Principal (Tabela ou Cards) */}
        {viewMode === 'table' ? (
          <DeviceTable
            devices={filteredDevices}
            onViewDetails={(d) => setDetailDevice(d)}
            onOpenHistory={(d) => setHistoryDevice(d)}
            onOpenAddOccurrence={(d) => setOccurrenceDevice(d)}
            onEditDevice={(d) => {
              setEditingDevice(d);
              setIsFormOpen(true);
            }}
            onOpenTerm={(d) => setTermDevice(d)}
            onQuickTransfer={(d) => setTransferDevice(d)}
            onDeleteDevice={handleDeleteDevice}
            onOpenAudit={(d) => setAuditDevice(d)}
            isGroupedBySector={isGroupedBySector}
            onToggleGrouped={() => setIsGroupedBySector(!isGroupedBySector)}
          />
        ) : (
          <DeviceCardGrid
            devices={filteredDevices}
            onViewDetails={(d) => setDetailDevice(d)}
            onEditDevice={(d) => {
              setEditingDevice(d);
              setIsFormOpen(true);
            }}
            onOpenTerm={(d) => setTermDevice(d)}
            onQuickTransfer={(d) => setTransferDevice(d)}
            onDeleteDevice={handleDeleteDevice}
            onOpenAudit={(d) => setAuditDevice(d)}
          />
        )}
      </main>

      {/* Footer corporativo Amilco */}
      <footer className="bg-zinc-950 text-zinc-400 border-t-2 border-red-600 py-4 px-6 text-center text-xs no-print mt-12">
        <p className="font-bold text-white uppercase tracking-wider">
          AMILCO HOME CENTER · CONTROLE DE PATRIMÔNIO DE CELULARES
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Loja Acaraú (24 aparelhos) · Loja Préa (11 aparelhos) · Base Sincronizada em Nuvem com Firebase Firestore
        </p>
      </footer>

      {/* Modais do Sistema */}

      {/* 1. Modal de Cadastro e Edição */}
      <DeviceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDevice(null);
        }}
        onSave={handleSaveDevice}
        editingDevice={editingDevice}
        stores={stores}
        sectors={sectors}
      />

      {/* 2. Modal do Fichário Completo e Histórico */}
      <DeviceHistoryModal
        device={historyDevice}
        isOpen={Boolean(historyDevice)}
        onClose={() => setHistoryDevice(null)}
        onOpenAddOccurrence={(d) => setOccurrenceDevice(d)}
      />

      {/* 3. Modal de Anexar Ocorrência (Manutenção / Troca / Perda) */}
      <OccurrenceModal
        device={occurrenceDevice}
        isOpen={Boolean(occurrenceDevice)}
        onClose={() => setOccurrenceDevice(null)}
        onSaveOccurrence={handleSaveOccurrence}
        sectors={sectors}
        currentTechnicianName={currentTechnician?.name}
      />

      {/* 4. Modal de Troca Rápida de Usuário */}
      <QuickTransferModal
        device={transferDevice}
        onClose={() => setTransferDevice(null)}
        onTransfer={handleQuickTransfer}
        sectors={sectors}
      />

      {/* 5. Modal de Termo de Responsabilidade (A4 Print) */}
      <ResponsibilityTermModal
        device={termDevice}
        onClose={() => setTermDevice(null)}
      />

      {/* 6. Modal de Filtro e Exportação de Relatório PDF */}
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        devices={devices}
        stores={stores}
        sectors={sectors}
      />

      {/* 7. Modal de Importação e Exportação Excel / Backup */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        devices={devices}
        onImportDevices={handleImportDevices}
        onResetData={handleResetData}
      />

      {/* 8. Ficha Técnica Rápida */}
      <DeviceDetailModal
        device={detailDevice}
        onClose={() => setDetailDevice(null)}
        onEdit={(d) => {
          setDetailDevice(null);
          setEditingDevice(d);
          setIsFormOpen(true);
        }}
        onOpenTerm={(d) => {
          setDetailDevice(null);
          setTermDevice(d);
        }}
        onQuickTransfer={(d) => {
          setDetailDevice(null);
          setTransferDevice(d);
        }}
        onOpenAudit={(d) => {
          setDetailDevice(null);
          setAuditDevice(d);
        }}
      />

      {/* 9. Janelinha Dedicada: Filtro Avançado de Acessórios & Estado */}
      <AdvancedFilterModal
        isOpen={isMainAdvancedModalOpen}
        onClose={() => setIsMainAdvancedModalOpen(false)}
        criteria={mainAdvancedCriteria}
        onApplyCriteria={(c) => setMainAdvancedCriteria(c)}
        devices={devices}
      />

      {/* 10. Modal de Checkup e Auditoria Presencial */}
      <DeviceAuditModal
        isOpen={Boolean(auditDevice)}
        onClose={() => setAuditDevice(null)}
        device={auditDevice}
        onSaveAudit={handleSaveAudit}
        currentAuditorName={currentTechnician?.name || 'Mateus (Auditoria T.I.)'}
      />
    </div>
  );
}
