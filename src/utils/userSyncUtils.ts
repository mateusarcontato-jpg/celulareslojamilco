import { Device } from '../types/device';

export interface SynchronizedEmployeeInfo {
  name: string;
  sector: string;
  store: string;
  currentDevices: Device[]; // Aparelhos atualmente alocados para este usuário
  isPreviousOnly: boolean; // true se ele só consta no histórico como ex-usuário (sem celular atual)
}

const IGNORED_NAMES = [
  '',
  '—',
  '-',
  'A DEFINIR',
  'NENHUM',
  'ESTOQUE',
  'RESERVA',
  'RESERVA TÉCNICA',
  '— (RESERVA TÉCNICA)',
  'SEM USUÁRIO',
  'DISPONÍVEL',
];

export function isStockOrPlaceholderName(name?: string): boolean {
  if (!name) return true;
  const clean = name.trim().toUpperCase();
  if (!clean) return true;
  if (IGNORED_NAMES.includes(clean)) return true;
  if (clean.includes('RESERVA TÉCNICA') || clean.includes('EM ESTOQUE')) return true;
  return false;
}

/**
 * Extrai e sincroniza em tempo real todos os usuários/colaboradores cadastrados na base de aparelhos
 * (tanto titulares atuais quanto usuários anteriores de trocas/histórico).
 */
export function getSynchronizedEmployees(devices: Device[]): SynchronizedEmployeeInfo[] {
  const map = new Map<string, SynchronizedEmployeeInfo>();

  // 1. Primeiro processamos todos os titulares atuais
  for (const dev of devices) {
    const rawName = (dev.employeeName || '').trim().toUpperCase();
    if (isStockOrPlaceholderName(rawName)) continue;

    const existing = map.get(rawName);
    if (existing) {
      existing.currentDevices.push(dev);
      existing.isPreviousOnly = false;
      if (dev.sector && dev.sector !== 'ESTOQUE') {
        existing.sector = dev.sector;
      }
      if (dev.store) {
        existing.store = dev.store;
      }
    } else {
      map.set(rawName, {
        name: rawName,
        sector: dev.sector || 'VENDAS',
        store: dev.store || 'LOJA ACARAÚ',
        currentDevices: [dev],
        isPreviousOnly: false,
      });
    }
  }

  // 2. Depois verificamos ex-usuários (previousEmployeeName e ocorrências) que não possuem aparelho ativo no momento
  for (const dev of devices) {
    const prevName = (dev.previousEmployeeName || '').trim().toUpperCase();
    if (!isStockOrPlaceholderName(prevName) && !map.has(prevName)) {
      map.set(prevName, {
        name: prevName,
        sector: dev.sector || 'VENDAS',
        store: dev.store || 'LOJA ACARAÚ',
        currentDevices: [],
        isPreviousOnly: true,
      });
    }

    if (Array.isArray(dev.occurrences)) {
      for (const occ of dev.occurrences) {
        for (const candidate of [occ.previousUser, occ.newUser]) {
          const cName = (candidate || '').trim().toUpperCase();
          if (!isStockOrPlaceholderName(cName) && !map.has(cName)) {
            map.set(cName, {
              name: cName,
              sector: dev.sector || 'VENDAS',
              store: dev.store || 'LOJA ACARAÚ',
              currentDevices: [],
              isPreviousOnly: true,
            });
          }
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
