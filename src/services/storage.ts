import { Device } from '../types/device';
import { INITIAL_DEVICES, DEFAULT_STORES, DEFAULT_SECTORS } from '../data/initialData';

const STORAGE_KEY = 'amilco_phones_inventory_v2';
const STORES_KEY = 'amilco_stores_v2';
const SECTORS_KEY = 'amilco_sectors_v2';

export function getStoredDevices(): Device[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredDevices(INITIAL_DEVICES);
      return INITIAL_DEVICES;
    }
    const parsed = JSON.parse(raw);
    // Ensure all items have occurrences array and boolean flags
    return parsed.map((d: any) => ({
      ...d,
      isPersonalDevice: Boolean(d.isPersonalDevice),
      hasVpn: Boolean(d.hasVpn),
      hasAssetTag: d.hasAssetTag !== false && d.assetNumber !== 'SEM PT',
      occurrences: d.occurrences || d.history?.map((h: any) => ({
        id: h.id,
        date: h.date,
        type: h.action === 'MANUTENCAO' ? 'MANUTENÇÃO' : h.action === 'TRANSFERENCIA' ? 'TROCA' : 'ENTREGA',
        title: h.action,
        description: h.details,
        recordedBy: h.author || 'Sistema'
      })) || []
    }));
  } catch (error) {
    console.error('Erro ao ler dispositivos do localStorage:', error);
    return INITIAL_DEVICES;
  }
}

export function saveStoredDevices(devices: Device[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  } catch (error) {
    console.error('Erro ao salvar dispositivos no localStorage:', error);
  }
}

export function getStoredStores(): string[] {
  try {
    const raw = localStorage.getItem(STORES_KEY);
    if (!raw) {
      localStorage.setItem(STORES_KEY, JSON.stringify(DEFAULT_STORES));
      return DEFAULT_STORES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STORES;
  }
}

export function saveStoredStores(stores: string[]): void {
  try {
    localStorage.setItem(STORES_KEY, JSON.stringify(stores));
  } catch (error) {
    console.error('Erro ao salvar lojas:', error);
  }
}

export function getStoredSectors(): string[] {
  try {
    const raw = localStorage.getItem(SECTORS_KEY);
    if (!raw) {
      localStorage.setItem(SECTORS_KEY, JSON.stringify(DEFAULT_SECTORS));
      return DEFAULT_SECTORS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SECTORS;
  }
}

export function saveStoredSectors(sectors: string[]): void {
  try {
    localStorage.setItem(SECTORS_KEY, JSON.stringify(sectors));
  } catch (error) {
    console.error('Erro ao salvar setores:', error);
  }
}

export function resetToInitialData(): Device[] {
  saveStoredDevices(INITIAL_DEVICES);
  saveStoredStores(DEFAULT_STORES);
  saveStoredSectors(DEFAULT_SECTORS);
  return INITIAL_DEVICES;
}

/**
 * Exporta planilha PADRÃO de Inventário dos Celulares (apenas dados cadastrais, sem auditoria)
 */
export function exportToCsv(devices: Device[]): void {
  const headers = [
    'LOJA',
    'N° PATRIMÔNIO',
    'NOME DO COLABORADOR',
    'VPN',
    'MARCA',
    'MODELO',
    'SETOR',
    'DATA AQUISIÇÃO',
    'STATUS',
    'NÚMERO TELEFONE',
    'OPERADORA',
    'IMEI',
    'ACESSÓRIOS PADRÃO',
    'OBSERVAÇÕES CADASTRAIS'
  ];

  const rows = devices.map(d => [
    `"${d.store.replace(/"/g, '""')}"`,
    `"${(d.isPersonalDevice ? 'PESSOAL' : d.hasAssetTag ? d.assetNumber : 'SEM PT').replace(/"/g, '""')}"`,
    `"${d.employeeName.replace(/"/g, '""')}"`,
    `"${d.hasVpn ? 'SIM' : 'NÃO'}"`,
    `"${d.brand.replace(/"/g, '""')}"`,
    `"${d.model.replace(/"/g, '""')}"`,
    `"${d.sector.replace(/"/g, '""')}"`,
    `"${d.acquisitionDate.replace(/"/g, '""')}"`,
    `"${d.status.replace(/"/g, '""')}"`,
    `"${(d.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(d.carrier || '').replace(/"/g, '""')}"`,
    `"${(d.imei1 || '').replace(/"/g, '""')}"`,
    `"${(d.accessories && d.accessories.length > 0 ? d.accessories.join(', ') : 'Carregador Original, Cabo USB-C, Capa Protetora, Película de Vidro').replace(/"/g, '""')}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Planilha_Padrao_Celulares_Amilco_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta planilha EXCLUSIVA DE AUDITORIA no formato CSV para Microsoft Excel
 */
export function exportAuditToCsv(devices: Device[]): void {
  const headers = [
    'LOJA',
    'N° PATRIMÔNIO',
    'COLABORADOR',
    'SETOR',
    'APARELHO',
    'DIAGNÓSTICO AUDITORIA',
    'TELA DO APARELHO',
    'PELÍCULA DE PROTEÇÃO',
    'BATERIA',
    'ITENS PRESENTES',
    'ITENS FALTANDO',
    'ITENS DANIFICADOS',
    'AUDITOR RESPONSÁVEL',
    'DATA CONFERÊNCIA',
    'PARECER / OBSERVAÇÕES AUDITORIA'
  ];

  const rows = devices.map(d => {
    const audit = d.auditInfo;
    const isScreenBroken = audit ? audit.screenOk === false : false;
    const isBatteryBroken = audit ? audit.batteryOk === false : false;
    const isPeliculaBroken = audit
      ? audit.peliculaStatus === 'PELICULA_TRINCADA' ||
        Boolean(audit.damagedAccessories?.some(a => a.toLowerCase().includes('película') || a.toLowerCase().includes('pelicula')))
      : false;
    const isPeliculaMissing = audit ? audit.peliculaStatus === 'SEM_PELICULA' : false;

    const diag = !audit
      ? 'NÃO AUDITADO'
      : audit.status === 'OK'
        ? '100% CONFORME'
        : isScreenBroken
          ? 'TELA QUEBRADA'
          : isBatteryBroken
            ? 'BATERIA INCHADA / DANIFICADA'
            : isPeliculaBroken
              ? 'PELÍCULA TRINCADA'
              : 'COM DIVERGÊNCIA';

    return [
      `"${d.store.replace(/"/g, '""')}"`,
      `"${(d.isPersonalDevice ? 'PESSOAL' : d.hasAssetTag ? d.assetNumber : 'SEM PT').replace(/"/g, '""')}"`,
      `"${d.employeeName.replace(/"/g, '""')}"`,
      `"${d.sector.replace(/"/g, '""')}"`,
      `"${`${d.brand} ${d.model}`.replace(/"/g, '""')}"`,
      `"${diag}"`,
      `"${!audit ? '—' : isScreenBroken ? 'QUEBRADA' : 'ÍNTEGRA'}"`,
      `"${!audit ? '—' : isPeliculaBroken ? 'TRINCADA' : isPeliculaMissing ? 'SEM PELÍCULA' : 'ÍNTEGRA'}"`,
      `"${!audit ? '—' : isBatteryBroken ? 'INCHADA / DANIFICADA' : 'NORMAL'}"`,
      `"${(audit?.verifiedAccessories?.join(', ') || '').replace(/"/g, '""')}"`,
      `"${(audit?.missingAccessories?.join(', ') || '').replace(/"/g, '""')}"`,
      `"${(audit?.damagedAccessories?.join(', ') || '').replace(/"/g, '""')}"`,
      `"${(audit?.auditedBy || 'Pendente').replace(/"/g, '""')}"`,
      `"${(audit?.lastAuditedAt || 'Pendente').replace(/"/g, '""')}"`,
      `"${(audit?.auditNotes || d.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Planilha_Auditoria_Celulares_Amilco_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Lê e importa um arquivo CSV gerado ou da planilha Excel
 */
export function parseCsvText(csvText: string): Device[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const importedDevices: Device[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const regex = new RegExp(`(?:^|${separator})(?:"([^"]*(?:""[^"]*)*)"|([^"${separator}]*))`, 'g');
    const cols: string[] = [];
    let match;
    while ((match = regex.exec(rawLine)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      cols.push(val?.trim() || '');
    }

    if (cols.length >= 4) {
      const store = cols[0] || 'LOJA ACARAÚ';
      const rawAsset = cols[1] || 'SEM PT';
      const isSemPt = rawAsset.toUpperCase().includes('SEM') || rawAsset.trim() === '?' || !rawAsset.trim();
      const rawName = cols[2] || 'A Definir';
      const vpnInName = Boolean(rawName.toLowerCase().includes('(vpn)') || (cols[3] && cols[3].toUpperCase().includes('SIM')));
      const cleanName = rawName.replace(/\(vpn\)/gi, '').trim();
      const brand = cols[4] || 'SAMSUNG';
      const model = cols[5] || 'Smartphone';
      const sector = cols[6] || 'VENDAS';
      const acquisitionDate = cols[7] || '?';
      const statusRaw = cols[8] || 'EM USO';

      let status: Device['status'] = 'EM USO';
      if (statusRaw.toUpperCase().includes('DISP') || statusRaw.toUpperCase().includes('ESTOQUE')) {
        status = 'DISPONÍVEL';
      } else if (statusRaw.toUpperCase().includes('MANUT')) {
        status = 'MANUTENÇÃO';
      } else if (statusRaw.toUpperCase().includes('PERD')) {
        status = 'PERDA / EXTRAVIO';
      } else if (isSemPt) {
        status = 'SEM PATRIMÔNIO';
      }

      importedDevices.push({
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        store: store.toUpperCase(),
        assetNumber: isSemPt ? 'SEM PT' : rawAsset,
        hasAssetTag: !isSemPt,
        employeeName: cleanName || 'Sem Responsável',
        hasVpn: vpnInName,
        brand: brand.toUpperCase(),
        model: model,
        sector: sector.toUpperCase(),
        acquisitionDate: acquisitionDate,
        status: status,
        phoneNumber: cols[9] || '',
        carrier: cols[10] || '',
        imei1: cols[11] || '',
        condition: 'BOM',
        accessories: ['Carregador Original', 'Capa Protetora'],
        notes: cols[13] || 'Importado via planilha',
        occurrences: [
          {
            id: `occ-imp-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            type: 'ENTREGA',
            title: 'Importação de Dados',
            description: 'Aparelho importado via arquivo de planilha.',
            recordedBy: 'Sistema'
          }
        ],
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return importedDevices;
}
