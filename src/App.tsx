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
  List,
  Building,
  CloudCheck,
  SlidersHorizontal,
  ClipboardCheck,
  FolderCheck,
  Package
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Device, DeviceOccurrence, DeviceStatus, AdvancedFilterCriteria, INITIAL_ADVANCED_FILTERS, SignedTermRecord } from './types/device';
import { matchAdvancedCriteria, countActiveAdvancedFilters } from './utils/filterUtils';
import { getManufacturerModelSpec, getFleetGenerationSummary } from './utils/modelSpecsUtils';
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
import { DashboardCharts } from './components/DashboardCharts';
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
import { SignedTermsDirectoryModal } from './components/SignedTermsDirectoryModal';
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
  const [modelGenFilter, setModelGenFilter] = useState<
    | 'TODOS'
    | 'ORDEM_MAIS_ANTIGO'
    | 'ORDEM_MAIS_NOVO'
    | 'MAIS_ANTIGOS_2021'
    | 'MAIS_NOVOS_5G'
    | 'GERACAO_2022'
    | 'GERACAO_2023'
    | 'GERACAO_2024'
  >('TODOS');
  const [showTechSpecBanner, setShowTechSpecBanner] = useState<boolean>(false);
  const [vpnOnly, setVpnOnly] = useState<boolean>(false);
  const [semPtOnly, setSemPtOnly] = useState<boolean>(false);
  const [personalOnly, setPersonalOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isGroupedBySector, setIsGroupedBySector] = useState<boolean>(true); // Separado por grupos igual no PDF
  const [mainSectionMode, setMainSectionMode] = useState<'PADRAO' | 'AUDITORIA' | 'ESTOQUE'>('AUDITORIA');

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
  const [pdfReportInitialMode, setPdfReportInitialMode] = useState<'INVENTARIO' | 'AUDITORIA'>('INVENTARIO');
  const [isMainAdvancedModalOpen, setIsMainAdvancedModalOpen] = useState(false);
  const [mainAdvancedCriteria, setMainAdvancedCriteria] = useState<AdvancedFilterCriteria>(INITIAL_ADVANCED_FILTERS);
  const [isSignedDirectoryOpen, setIsSignedDirectoryOpen] = useState(false);
  const [directoryInitialUploadDevice, setDirectoryInitialUploadDevice] = useState<Device | null>(null);
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
    const baseList = devices.filter((device) => {
      if (currentStore !== 'TODAS' && device.store !== currentStore) {
        return false;
      }

      if (mainSectionMode === 'ESTOQUE' && device.status !== 'DISPONÍVEL') {
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

      // Filtro de Geração / Ficha Técnica da Fabricante (Mais Antigo vs Mais Novo)
      if (modelGenFilter !== 'TODOS' && modelGenFilter !== 'ORDEM_MAIS_ANTIGO' && modelGenFilter !== 'ORDEM_MAIS_NOVO') {
        const spec = getManufacturerModelSpec(device.model, device.brand);
        if (modelGenFilter === 'MAIS_ANTIGOS_2021' && spec.category !== 'LEGADO_2021') {
          return false;
        }
        if (modelGenFilter === 'MAIS_NOVOS_5G' && spec.category !== 'ULTIMA_GERACAO') {
          return false;
        }
        if (modelGenFilter === 'GERACAO_2022' && spec.category !== 'GERACAO_2022') {
          return false;
        }
        if (modelGenFilter === 'GERACAO_2023' && spec.category !== 'GERACAO_2023') {
          return false;
        }
        if (modelGenFilter === 'GERACAO_2024' && spec.category !== 'GERACAO_2024') {
          return false;
        }
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

    if (modelGenFilter === 'ORDEM_MAIS_ANTIGO') {
      return [...baseList].sort((a, b) => {
        const specA = getManufacturerModelSpec(a.model, a.brand);
        const specB = getManufacturerModelSpec(b.model, b.brand);
        return specA.chronologicalRank - specB.chronologicalRank;
      });
    }

    if (modelGenFilter === 'ORDEM_MAIS_NOVO') {
      return [...baseList].sort((a, b) => {
        const specA = getManufacturerModelSpec(a.model, a.brand);
        const specB = getManufacturerModelSpec(b.model, b.brand);
        return specB.chronologicalRank - specA.chronologicalRank;
      });
    }

    return baseList;
  }, [devices, currentStore, mainSectionMode, statusFilter, sectorFilter, modelGenFilter, vpnOnly, semPtOnly, personalOnly, auditFilter, searchQuery, mainAdvancedCriteria]);

  const fleetGenSummary = useMemo(() => getFleetGenerationSummary(devices), [devices]);

  const availableInStockCount = useMemo(() => {
    return devices.filter(
      (d) => d.status === 'DISPONÍVEL' && (currentStore === 'TODAS' || d.store === currentStore)
    ).length;
  }, [devices, currentStore]);

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

  // Total de Termos Assinados Digitalmente no Diretório
  const signedTermsTotalCount = useMemo(() => {
    return devices.reduce((acc, d) => acc + (Array.isArray(d.signedTerms) ? d.signedTerms.length : 0), 0);
  }, [devices]);

  const handleSaveUploadedTerm = async (
    updatedDevice: Device,
    _newTerm: SignedTermRecord,
    _newOccurrence: DeviceOccurrence
  ) => {
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
      showToast(
        `📁 Arquivo do termo de ${updatedDevice.employeeName} anexado no Diretório!`
      );
    } catch (e) {
      console.error('[App] Erro ao gravar arquivo do termo no Firebase:', e);
      showToast('Arquivo do termo salvo no Diretório local.');
    }
  };

  const handleDeleteSignedTerm = async (deviceId: string, termId: string) => {
    const targetDevice = devices.find((d) => d.id === deviceId);
    if (!targetDevice) return;

    const updatedTerms = (targetDevice.signedTerms || []).filter((t) => t.id !== termId);
    const updatedDevice: Device = {
      ...targetDevice,
      signedTerms: updatedTerms,
      updatedAt: new Date().toISOString(),
    };

    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === deviceId ? updatedDevice : d));
      saveStoredDevices(updated);
      return updated;
    });

    try {
      await saveDeviceToFirestore(updatedDevice);
      showToast('Arquivo removido do diretório.');
    } catch (e) {
      showToast('Arquivo removido localmente.');
    }
  };

  // Actions Handlers integrados ao Firebase
  const handleSaveDevice = async (savedDevice: Device, additionalUpdatedDevices?: Device[]) => {
    const extraList = additionalUpdatedDevices || [];

    // Atualização otimista local (aparelho principal + eventuais aparelhos remanejados em sincronismo)
    setDevices((prev) => {
      const exists = prev.some((d) => d.id === savedDevice.id);
      let updated = exists
        ? prev.map((d) => (d.id === savedDevice.id ? savedDevice : d))
        : [savedDevice, ...prev];

      if (extraList.length > 0) {
        const extraMap = new Map(extraList.map((ed) => [ed.id, ed]));
        updated = updated.map((d) => extraMap.get(d.id) || d);
      }

      saveStoredDevices(updated);
      return updated;
    });

    try {
      await saveDeviceToFirestore(savedDevice);
      for (const extraDev of extraList) {
        await saveDeviceToFirestore(extraDev);
      }
      setIsFirebaseConnected(true);
      showToast(
        extraList.length > 0
          ? `Aparelho salvo e ${extraList.length} remanejamento(s) sincronizado(s) no Firebase!`
          : savedDevice.assetNumber === 'SEM PT'
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

  const handleQuickTransfer = async (updatedDevices: Device[]) => {
    if (!updatedDevices || updatedDevices.length === 0) return;
    const primary = updatedDevices[0];
    const mapUpdates = new Map(updatedDevices.map((u) => [u.id, u]));

    setDevices((prev) => {
      const updated = prev.map((d) => mapUpdates.get(d.id) || d);
      saveStoredDevices(updated);
      return updated;
    });
    try {
      for (const dev of updatedDevices) {
        await saveDeviceToFirestore(dev);
      }
      setIsFirebaseConnected(true);
      showToast(
        updatedDevices.length > 1
          ? `Troca e sincronismo salvos: Alocado para ${primary.employeeName}.`
          : `Troca salva no Firebase: Alocado para ${primary.employeeName}.`
      );
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

  const handleDeleteOccurrence = async (deviceId: string, occurrenceId: string) => {
    const targetDevice = devices.find((d) => d.id === deviceId);
    if (!targetDevice) return;

    const updatedOccurrences = (targetDevice.occurrences || []).filter((o, idx) => {
      return o.id !== occurrenceId && `occ-${idx}` !== occurrenceId;
    });

    const updatedDevice: Device = {
      ...targetDevice,
      occurrences: updatedOccurrences,
      updatedAt: new Date().toISOString()
    };

    setDevices((prev) => {
      const updated = prev.map((d) => (d.id === deviceId ? updatedDevice : d));
      saveStoredDevices(updated);
      return updated;
    });

    if (detailDevice && detailDevice.id === deviceId) {
      setDetailDevice(updatedDevice);
    }
    if (historyDevice && historyDevice.id === deviceId) {
      setHistoryDevice(updatedDevice);
    }

    try {
      await saveDeviceToFirestore(updatedDevice);
      setIsFirebaseConnected(true);
      showToast('Registro de histórico/manutenção excluído com sucesso!');
    } catch (e) {
      console.error('[App] Erro ao sincronizar exclusão no Firebase:', e);
      showToast('Registro excluído localmente.');
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
    setModelGenFilter('TODOS');
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
    (modelGenFilter !== 'TODOS' ? 1 : 0) +
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
        onOpenSignedDirectoryModal={() => {
          setDirectoryInitialUploadDevice(null);
          setIsSignedDirectoryOpen(true);
        }}
        signedTermsCount={signedTermsTotalCount}
        totalDevicesCount={devices.length}
        isFirebaseConnected={isFirebaseConnected}
        currentTechnician={currentTechnician}
        onOpenLoginModal={() => setCurrentTechnician(null)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-6 ${termDevice || isPdfModalOpen || isSignedDirectoryOpen ? 'no-print' : ''}`}>
        {/* Cabeçalho de Contexto e Exportação */}
        <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/90 no-print">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span className="font-bold uppercase tracking-wider text-red-600">
                {currentStore === 'TODAS' ? 'Painel Consolidado' : currentStore}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Acaraú ({devices.filter((d) => d.store === 'LOJA ACARAÚ').length})
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Préa ({devices.filter((d) => d.store === 'LOJA PRÉA').length})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 mt-0.5">
              Controle de Patrimônio e Auditoria de Celulares
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setDirectoryInitialUploadDevice(null);
                setIsSignedDirectoryOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Abrir Diretório para anexar fotos ou documentos escaneados dos termos assinados"
            >
              <FolderCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diretório de Termos Anexados ({signedTermsTotalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPdfReportInitialMode('INVENTARIO');
                setIsPdfModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Gerar PDF apenas com a planilha padrão dos celulares (sem dados de auditoria)"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-600" />
              <span>PDF: Planilha de Celulares</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPdfReportInitialMode('AUDITORIA');
                setIsPdfModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Gerar PDF exclusivo de auditoria, conferência e pendências"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-red-500" />
              <span>PDF: Só Auditoria</span>
            </button>

            <button
              type="button"
              onClick={() => exportToCsv(filteredDevices)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
              title="Baixar planilha Excel padrão dos celulares"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Excel Padrão</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingDevice(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Celular</span>
            </button>
          </div>
        </div>

        {/* Cards de Indicadores Rápidos */}
        <StatsCards
          devices={devices}
          currentStore={currentStore}
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

        {/* Visualização de Dados: Distribuição por Setor e Status */}
        <DashboardCharts
          devices={devices}
          currentStore={currentStore}
          selectedSector={sectorFilter}
          onSelectSector={(sector) => setSectorFilter(sector)}
          selectedStatus={statusFilter}
          onSelectStatus={(status) => setStatusFilter(status)}
        />

        {/* Central Unificada de Pesquisa, Filtros e Seletor de Lacuna (Planilha Padrão vs Auditoria) */}
        <div className="bg-white border border-zinc-200/90 rounded-xl mb-4 shadow-2xs no-print divide-y divide-zinc-100">
          {/* Topo: Lacunas Separadas (Planilha Padrão dos Celulares vs Lacuna Só de Auditoria) */}
          <div className="px-3.5 py-2.5 bg-zinc-950 text-white rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMainSectionMode('PADRAO');
                  setAuditFilter('ALL');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainSectionMode === 'PADRAO'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Smartphone className={`w-3.5 h-3.5 ${mainSectionMode === 'PADRAO' ? 'text-red-600' : 'text-zinc-400'}`} />
                <span>Planilha Padrão dos Celulares (Sem Auditoria)</span>
              </button>

              <button
                type="button"
                onClick={() => setMainSectionMode('AUDITORIA')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainSectionMode === 'AUDITORIA'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Auditoria & Checkup ({auditStats.percent}%)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMainSectionMode('ESTOQUE');
                  setAuditFilter('ALL');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainSectionMode === 'ESTOQUE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
                title="Exibir exclusivamente celulares disponíveis em estoque prontos para entrega ou remanejamento"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Disponíveis em Estoque ({availableInStockCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-300">
              <span>
                Exibindo <strong className="text-white font-mono-nums">{filteredDevices.length}</strong> de{' '}
                <strong className="text-zinc-200 font-mono-nums">{devices.length}</strong> aparelhos
              </span>
              {activeFiltersCount > 0 && (
                <>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                  >
                    Limpar filtros ({activeFiltersCount})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Linha 1: Busca Rápida, Filtros Operacionais e Modos de Exibição */}
          <div className="p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar colaborador, patrimônio, modelo, IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-zinc-300 bg-zinc-50/50 focus:bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controles de Filtro e Layout */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Seletor de Setor */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-100/80 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 font-medium">
                <span className="text-zinc-500">Setor:</span>
                <select
                  aria-label="Filtrar por setor"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="TODOS">Todos</option>
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Geração do Modelo pela Ficha Técnica da Fabricante (Mais Antigo vs Mais Novo) */}
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  modelGenFilter !== 'TODOS'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                    : 'bg-zinc-100/80 text-zinc-700 border-zinc-200/80'
                }`}
                title="Filtrar ou ordenar aparelhos pelo ano de lançamento e ficha técnica da fabricante (Samsung)"
              >
                <span className={modelGenFilter !== 'TODOS' ? 'text-red-400 font-bold' : 'text-zinc-500'}>
                  Modelo (Ano Fab.):
                </span>
                <select
                  aria-label="Filtrar por geração do modelo"
                  value={modelGenFilter}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setModelGenFilter(val);
                    if (val === 'ORDEM_MAIS_ANTIGO' || val === 'ORDEM_MAIS_NOVO') {
                      setIsGroupedBySector(false);
                    }
                    if (val !== 'TODOS') {
                      setShowTechSpecBanner(true);
                    }
                  }}
                  className={`bg-transparent font-bold focus:outline-none cursor-pointer text-xs ${
                    modelGenFilter !== 'TODOS' ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  <option value="TODOS" className="text-zinc-900 bg-white">Todos os Modelos</option>
                  <option value="ORDEM_MAIS_ANTIGO" className="text-zinc-900 bg-white">⏳ Ordenar: Do Mais Antigo ao Mais Novo</option>
                  <option value="ORDEM_MAIS_NOVO" className="text-zinc-900 bg-white">🚀 Ordenar: Do Mais Novo ao Mais Antigo</option>
                  <option value="MAIS_ANTIGOS_2021" className="text-zinc-900 bg-white">
                    ⚠️ Mais Antigos · Linha 2021 (A03s / A03) [{fleetGenSummary.counts.LEGADO_2021}]
                  </option>
                  <option value="GERACAO_2022" className="text-zinc-900 bg-white">
                    📱 Geração 2022 · Entrada (A04s / A04e) [{fleetGenSummary.counts.GERACAO_2022}]
                  </option>
                  <option value="GERACAO_2023" className="text-zinc-900 bg-white">
                    ⚡ Geração 2023 · Interm. (A14 / A54 5G) [{fleetGenSummary.counts.GERACAO_2023}]
                  </option>
                  <option value="GERACAO_2024" className="text-zinc-900 bg-white">
                    🔥 Geração 2024 · Premium 5G (A55 5G) [{fleetGenSummary.counts.GERACAO_2024}]
                  </option>
                  <option value="MAIS_NOVOS_5G" className="text-zinc-900 bg-white">
                    🚀 Mais Novos · Linha 2025/2026 (A16 / A56 / A57) [{fleetGenSummary.counts.ULTIMA_GERACAO}]
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowTechSpecBanner(!showTechSpecBanner)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  showTechSpecBanner
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title="Ver análise das fichas técnicas da fabricante (Qual o modelo mais antigo e qual o mais novo)"
              >
                <Smartphone className={`w-3.5 h-3.5 ${showTechSpecBanner ? 'text-red-500' : 'text-zinc-600'}`} />
                <span>Raio-X de Modelos</span>
              </button>

              {/* Filtro Pessoal */}
              <button
                type="button"
                onClick={() => setPersonalOnly(!personalOnly)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  personalOnly
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
                title="Filtrar colaboradores que utilizam aparelho pessoal"
              >
                <Smartphone className={`w-3.5 h-3.5 ${personalOnly ? 'text-purple-200' : 'text-purple-600'}`} />
                <span>Pessoal ({filteredPersonalCount})</span>
              </button>

              {/* Filtro VPN */}
              <button
                type="button"
                onClick={() => setVpnOnly(!vpnOnly)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  vpnOnly
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>VPN</span>
              </button>

              {/* Filtro Sem PT */}
              <button
                type="button"
                onClick={() => setSemPtOnly(!semPtOnly)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  semPtOnly
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <HelpCircle className={`w-3.5 h-3.5 ${semPtOnly ? 'text-white' : 'text-red-600'}`} />
                <span>Sem PT</span>
              </button>

              {/* Filtro Avançado de Acessórios & Estado (Apenas na aba de Auditoria ou se já ativo) */}
              {(mainSectionMode === 'AUDITORIA' || activeMainAdvCount > 0) && (
                <button
                  type="button"
                  onClick={() => setIsMainAdvancedModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeMainAdvCount > 0
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                  title="Filtrar por acessórios, película trincada, tela quebrada ou avarias"
                >
                  <SlidersHorizontal className={`w-3.5 h-3.5 ${activeMainAdvCount > 0 ? 'text-white' : 'text-red-500'}`} />
                  <span>Acessórios & Estado</span>
                  {activeMainAdvCount > 0 && (
                    <span className="font-mono font-bold underline ml-0.5">
                      ({activeMainAdvCount})
                    </span>
                  )}
                </button>
              )}

              <div className="h-5 w-px bg-zinc-200 mx-0.5 hidden sm:block" />

              {/* Alternador Agrupar por Setor vs Lista Contínua */}
              {viewMode === 'table' && (
                <button
                  type="button"
                  onClick={() => setIsGroupedBySector(!isGroupedBySector)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isGroupedBySector
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                  title={isGroupedBySector ? 'Exibindo separado por grupos/setores' : 'Exibindo em lista contínua'}
                >
                  {isGroupedBySector ? (
                    <>
                      <Layers className="w-3.5 h-3.5 text-red-500" />
                      <span className="hidden sm:inline">Por Setor</span>
                    </>
                  ) : (
                    <>
                      <List className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="hidden sm:inline">Lista Contínua</span>
                    </>
                  )}
                </button>
              )}

              {/* Alternador Tabela vs Cartões */}
              <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-100">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-zinc-950 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Modo Tabela"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-zinc-950 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Modo Cartões"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Linha 2: Exclusiva da Lacuna de Auditoria Presencial */}
          {mainSectionMode === 'AUDITORIA' && (
            <div className="px-3.5 py-2.5 bg-red-50/40 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-zinc-800 mr-1">
                  <ClipboardCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="font-bold uppercase tracking-wide text-[11px]">
                    Filtro da Auditoria ({auditStats.percent}% concluído):
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAuditFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      auditFilter === 'ALL'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200/70'
                    }`}
                  >
                    Todos ({auditStats.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditFilter(auditFilter === 'OK' ? 'ALL' : 'OK')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      auditFilter === 'OK'
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-800 hover:bg-emerald-100/70'
                    }`}
                  >
                    <CheckCircle2 className={`w-3 h-3 ${auditFilter === 'OK' ? 'text-white' : 'text-emerald-600'}`} />
                    <span>Conferidos OK ({auditStats.ok})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditFilter(auditFilter === 'MISSING' ? 'ALL' : 'MISSING')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      auditFilter === 'MISSING'
                        ? 'bg-red-600 text-white'
                        : 'text-red-800 hover:bg-red-100/70'
                    }`}
                  >
                    <AlertCircle className={`w-3 h-3 ${auditFilter === 'MISSING' ? 'text-white' : 'text-red-600'}`} />
                    <span>Com Divergência ({auditStats.missing})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditFilter(auditFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      auditFilter === 'PENDING'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200/70'
                    }`}
                  >
                    Pendentes ({auditStats.pending})
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPdfReportInitialMode('AUDITORIA');
                  setIsPdfModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg shadow-2xs cursor-pointer self-start md:self-auto"
              >
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>Imprimir Relatório de Auditoria</span>
              </button>
            </div>
          )}
          {/* Linha 2B: Banner exclusivo da Aba de Celulares Disponíveis em Estoque */}
          {mainSectionMode === 'ESTOQUE' && (
            <div className="px-3.5 py-2.5 bg-emerald-50/70 border-t border-emerald-200/70 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-950">
                <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold uppercase tracking-wide text-[11px] text-emerald-900">
                    Aba de Celulares Disponíveis em Estoque ({availableInStockCount} {availableInStockCount === 1 ? 'aparelho pronto' : 'aparelhos prontos'}):
                  </span>{' '}
                  <span className="text-emerald-800">
                    Estes aparelhos estão livres no estoque. Clique no ícone de <strong>Trocar Usuário (⇄)</strong> na linha do aparelho para alocá-lo imediatamente a um colaborador cadastrado ou novo usuário.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingDevice(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer self-start md:self-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Aparelho no Estoque</span>
              </button>
            </div>
          )}

          {/* Painel de Análise Técnica da Fabricante: Qual o Modelo Mais Antigo e o Mais Novo */}
          {(showTechSpecBanner || modelGenFilter !== 'TODOS') && (
            <div className="p-3.5 bg-zinc-950 text-white border-t border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                    Ficha Técnica da Fabricante (Samsung Galaxy)
                  </span>
                  <h4 className="text-xs font-bold text-zinc-100">
                    Ranking Cronológico de Lançamento: Do Modelo Mais Antigo (2021) ao Mais Novo (2025/2026)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {modelGenFilter !== 'TODOS' && (
                    <button
                      type="button"
                      onClick={() => setModelGenFilter('TODOS')}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Mostrar todos os modelos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTechSpecBanner(false)}
                    className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    title="Fechar painel técnico"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards comparativos: O MAIS ANTIGO vs INTERMEDIÁRIOS vs O MAIS NOVO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px]">
                {/* 1. MAIS ANTIGOS (2021) */}
                <button
                  type="button"
                  onClick={() => setModelGenFilter(modelGenFilter === 'MAIS_ANTIGOS_2021' ? 'TODOS' : 'MAIS_ANTIGOS_2021')}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    modelGenFilter === 'MAIS_ANTIGOS_2021'
                      ? 'bg-amber-950/90 border-2 border-amber-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[9.5px] uppercase">
                      ⏳ 1º · MAIS ANTIGO (2021)
                    </span>
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {fleetGenSummary.counts.LEGADO_2021} un.
                    </span>
                  </div>
                  <strong className="block text-white font-bold text-xs">Galaxy A03s / A03</strong>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">
                    Lançado em <strong>Ago–Nov/2021</strong> · Helio P35 / Unisoc (12nm) · 4G · Tela HD+ 60Hz · <strong>Ciclo encerrado (EOL)</strong>.
                  </span>
                </button>

                {/* 2. GERAÇÃO 2022 */}
                <button
                  type="button"
                  onClick={() => setModelGenFilter(modelGenFilter === 'GERACAO_2022' ? 'TODOS' : 'GERACAO_2022')}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    modelGenFilter === 'GERACAO_2022'
                      ? 'bg-orange-950/80 border-2 border-orange-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-[9.5px] uppercase">
                      2º · LINHA 2022
                    </span>
                    <span className="font-mono font-bold text-zinc-300 text-xs">
                      {fleetGenSummary.counts.GERACAO_2022} un.
                    </span>
                  </div>
                  <strong className="block text-white font-bold text-xs">Galaxy A04s / A04e</strong>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">
                    Lançado em <strong>Set–Out/2022</strong> · Exynos 850 (8nm) / P35 · 4G · 64GB · Entrada operacional.
                  </span>
                </button>

                {/* 3. GERAÇÃO 2023 */}
                <button
                  type="button"
                  onClick={() => setModelGenFilter(modelGenFilter === 'GERACAO_2023' ? 'TODOS' : 'GERACAO_2023')}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    modelGenFilter === 'GERACAO_2023'
                      ? 'bg-blue-950/80 border-2 border-blue-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[9.5px] uppercase">
                      3º · LINHA 2023
                    </span>
                    <span className="font-mono font-bold text-blue-300 text-xs">
                      {fleetGenSummary.counts.GERACAO_2023} un.
                    </span>
                  </div>
                  <strong className="block text-white font-bold text-xs">Galaxy A14 / A54 5G</strong>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">
                    Lançado em <strong>Fev–Mar/2023</strong> · 128GB · Tela FHD+ (A54 com Exynos 1380 5G, Super AMOLED 120Hz e IP67).
                  </span>
                </button>

                {/* 4. GERAÇÃO 2024 */}
                <button
                  type="button"
                  onClick={() => setModelGenFilter(modelGenFilter === 'GERACAO_2024' ? 'TODOS' : 'GERACAO_2024')}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    modelGenFilter === 'GERACAO_2024'
                      ? 'bg-indigo-950/80 border-2 border-indigo-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[9.5px] uppercase">
                      4º · LINHA 2024 (5G)
                    </span>
                    <span className="font-mono font-bold text-indigo-300 text-xs">
                      {fleetGenSummary.counts.GERACAO_2024} un.
                    </span>
                  </div>
                  <strong className="block text-white font-bold text-xs">Galaxy A55 5G</strong>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">
                    Lançado em <strong>Mar/2024</strong> · Exynos 1480 (4nm) · 8GB RAM · Estrutura em metal, Gorilla Glass Victus+ e IP67.
                  </span>
                </button>

                {/* 5. MAIS NOVOS (2025 / 2026) */}
                <button
                  type="button"
                  onClick={() => setModelGenFilter(modelGenFilter === 'MAIS_NOVOS_5G' ? 'TODOS' : 'MAIS_NOVOS_5G')}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    modelGenFilter === 'MAIS_NOVOS_5G'
                      ? 'bg-emerald-950/90 border-2 border-emerald-400 shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-[9.5px] uppercase">
                      🚀 5º · MAIS NOVOS (5G)
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-xs">
                      {fleetGenSummary.counts.ULTIMA_GERACAO} un.
                    </span>
                  </div>
                  <strong className="block text-white font-bold text-xs">A16 5G / A56 5G / A57</strong>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 leading-snug">
                    Lançados em <strong>2025/2026</strong> · Arquitetura 4nm 5G · Super AMOLED 120Hz · <strong>6 anos de suporte oficial Samsung</strong>.
                  </span>
                </button>
              </div>
            </div>
          )}
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
            showAuditColumn={mainSectionMode === 'AUDITORIA'}
            preserveCustomOrder={modelGenFilter === 'ORDEM_MAIS_ANTIGO' || modelGenFilter === 'ORDEM_MAIS_NOVO'}
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
            onOpenAddOccurrence={(d) => setOccurrenceDevice(d)}
            showAuditColumn={mainSectionMode === 'AUDITORIA'}
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
        allDevices={devices}
        stores={stores}
        sectors={sectors}
      />

      {/* 2. Modal do Fichário Completo e Histórico */}
      <DeviceHistoryModal
        device={historyDevice}
        isOpen={Boolean(historyDevice)}
        onClose={() => setHistoryDevice(null)}
        onOpenAddOccurrence={(d) => setOccurrenceDevice(d)}
        onDeleteOccurrence={handleDeleteOccurrence}
      />

      {/* 3. Modal de Anexar Ocorrência (Manutenção / Troca / Perda) */}
      <OccurrenceModal
        device={occurrenceDevice}
        allDevices={devices}
        isOpen={Boolean(occurrenceDevice)}
        onClose={() => setOccurrenceDevice(null)}
        onSaveOccurrence={handleSaveOccurrence}
        sectors={sectors}
        currentTechnicianName={currentTechnician?.name}
      />

      {/* 4. Modal de Troca Rápida de Usuário */}
      <QuickTransferModal
        device={transferDevice}
        allDevices={devices}
        onClose={() => setTransferDevice(null)}
        onTransfer={handleQuickTransfer}
        sectors={sectors}
      />

      {/* 5. Modal de Termo de Responsabilidade (A4 para Impressão e Botão para Anexar Escaneado) */}
      <ResponsibilityTermModal
        device={termDevice}
        onClose={() => setTermDevice(null)}
        onOpenDirectoryForUpload={(dev) => {
          setTermDevice(null);
          setDirectoryInitialUploadDevice(dev);
          setIsSignedDirectoryOpen(true);
        }}
      />

      {/* 5.1. Diretório para Anexar Fotos ou Documentos Escaneados Pós-Assinatura */}
      <SignedTermsDirectoryModal
        isOpen={isSignedDirectoryOpen}
        onClose={() => {
          setIsSignedDirectoryOpen(false);
          setDirectoryInitialUploadDevice(null);
        }}
        devices={devices}
        initialUploadDevice={directoryInitialUploadDevice}
        onSaveUploadedTerm={handleSaveUploadedTerm}
        onDeleteSignedTerm={handleDeleteSignedTerm}
        onOpenPrintBlankTerm={(dev) => {
          setIsSignedDirectoryOpen(false);
          setTermDevice(dev);
        }}
        currentTechnicianName={currentTechnician?.name}
      />

      {/* 6. Modal de Filtro e Exportação de Relatório PDF */}
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        devices={devices}
        stores={stores}
        sectors={sectors}
        initialMode={pdfReportInitialMode}
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
        onOpenAddOccurrence={(d) => {
          setDetailDevice(null);
          setOccurrenceDevice(d);
        }}
        onDeleteOccurrence={handleDeleteOccurrence}
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
