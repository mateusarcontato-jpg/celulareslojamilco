import { Device, AdvancedFilterCriteria } from '../types/device';

/**
 * Filtra dispositivos com base nos critérios avançados de Acessórios, Estado da Tela e Avarias
 */
export function matchAdvancedCriteria(device: Device, criteria: AdvancedFilterCriteria): boolean {
  // 1. Filtro por Acessórios
  if (criteria.accessories.length > 0) {
    const devAccessories = (device.accessories || []).map((a) => a.toLowerCase());

    if (criteria.accessoryMode === 'has') {
      // O aparelho deve ter os acessórios selecionados
      const hasAllSelected = criteria.accessories.every((targetAcc) => {
        const target = targetAcc.toLowerCase();
        return devAccessories.some((devAcc) => devAcc.includes(target) || target.includes(devAcc));
      });
      if (!hasAllSelected) return false;
    } else {
      // Modo 'missing': O aparelho NÃO possui (está faltando) os acessórios selecionados
      const isMissingAny = criteria.accessories.some((targetAcc) => {
        const target = targetAcc.toLowerCase();
        return !devAccessories.some((devAcc) => devAcc.includes(target) || target.includes(devAcc));
      });
      if (!isMissingAny) return false;
    }
  }

  // 2. Filtro por Categorias de Condição Física & Tela
  if (criteria.conditionCategories.length > 0) {
    const condStr = (device.condition || '').toUpperCase();
    const notesStr = (device.notes || '').toLowerCase();
    const occurrencesText = (device.occurrences || [])
      .map((o) => `${o.title} ${o.description}`)
      .join(' ')
      .toLowerCase();

    const matchesAnyCategory = criteria.conditionCategories.some((cat) => {
      switch (cat) {
        case 'TELA_QUEBRADA': {
          // Apenas dano real na tela/display do aparelho (NÃO apenas película trincada)
          if (device.auditInfo) {
            return device.auditInfo.screenOk === false;
          }
          const condUpper = (device.condition || '').toUpperCase();
          const notesLower = (device.notes || '').toLowerCase();
          const occLower = occurrencesText;

          // Se a menção for apenas de película trincada e NÃO tiver dano na tela/display
          const isPeliculaMention = notesLower.includes('pelicula trincad') || notesLower.includes('película trincad') ||
            occLower.includes('película trincad') || occLower.includes('pelicula trincad');
          const hasExplicitScreenDamage = notesLower.includes('tela quebrada') || notesLower.includes('tela trincada') || notesLower.includes('display quebrado') ||
            occLower.includes('tela quebrada') || occLower.includes('tela trincada') || occLower.includes('display quebrado');

          if (isPeliculaMention && !hasExplicitScreenDamage && condUpper !== 'TELA TRINCADA') {
            return false;
          }

          const isTelaTrincada = condUpper === 'TELA TRINCADA';
          return isTelaTrincada || hasExplicitScreenDamage;
        }
        case 'PELICULA_TRINCADA': {
          // Apenas película de proteção trincada (com tela boa ou necessitando reposição de película)
          if (device.auditInfo) {
            return device.auditInfo.peliculaStatus === 'PELICULA_TRINCADA' ||
              Boolean(device.auditInfo.damagedAccessories?.some(a => a.toLowerCase().includes('película') || a.toLowerCase().includes('pelicula')));
          }
          const notesLower = (device.notes || '').toLowerCase();
          const occLower = occurrencesText;
          return notesLower.includes('pelicula trincad') || notesLower.includes('película trincad') ||
                 occLower.includes('pelicula trincad') || occLower.includes('película trincad');
        }
        case 'COM_AVARIAS': {
          return condStr.includes('AVARIA') || notesStr.includes('avaria') || notesStr.includes('defeito') || notesStr.includes('quebrad');
        }
        case 'BATERIA_DEFEITO': {
          return notesStr.includes('bateria') || notesStr.includes('conector') || occurrencesText.includes('bateria') || occurrencesText.includes('conector');
        }
        case 'EM_REPARO': {
          return condStr.includes('REPARO') || device.status === 'MANUTENÇÃO';
        }
        case 'BOM': {
          return condStr === 'BOM';
        }
        case 'NOVO': {
          return condStr === 'NOVO';
        }
        default:
          return false;
      }
    });

    if (!matchesAnyCategory) return false;
  }

  // 3. Busca Livre em Texto de Condição / Avarias / Ocorrências
  if (criteria.conditionCustomText.trim()) {
    const q = criteria.conditionCustomText.toLowerCase().trim();
    const condMatch = (device.condition || '').toLowerCase().includes(q);
    const notesMatch = (device.notes || '').toLowerCase().includes(q);
    const occMatch = (device.occurrences || []).some((o) =>
      o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
    );
    if (!condMatch && !notesMatch && !occMatch) return false;
  }

  // 4. VPN
  if (criteria.vpnFilter === 'WITH_VPN' && !device.hasVpn) return false;
  if (criteria.vpnFilter === 'WITHOUT_VPN' && device.hasVpn) return false;

  // 5. Plaqueta de Patrimônio
  if (criteria.tagFilter === 'WITH_TAG' && (!device.hasAssetTag || device.assetNumber === 'SEM PT' || device.isPersonalDevice)) return false;
  if (criteria.tagFilter === 'SEM_PT' && (device.hasAssetTag && device.assetNumber !== 'SEM PT' || device.isPersonalDevice)) return false;
  if (criteria.tagFilter === 'PESSOAL' && !device.isPersonalDevice) return false;

  // 6. Linha Telefônica
  const hasLine = Boolean(device.phoneNumber && device.phoneNumber.trim().length > 3);
  if (criteria.hasPhoneLine === 'WITH_LINE' && !hasLine) return false;
  if (criteria.hasPhoneLine === 'WITHOUT_LINE' && hasLine) return false;

  // 7. Ocorrências no Histórico
  if (criteria.hasOccurrencesOnly && (!device.occurrences || device.occurrences.length === 0)) return false;

  return true;
}

/**
 * Conta quantos filtros avançados estão ativos
 */
export function countActiveAdvancedFilters(criteria: AdvancedFilterCriteria): number {
  let count = 0;
  if (criteria.accessories.length > 0) count += criteria.accessories.length;
  if (criteria.conditionCategories.length > 0) count += criteria.conditionCategories.length;
  if (criteria.conditionCustomText.trim()) count += 1;
  if (criteria.vpnFilter !== 'ALL') count += 1;
  if (criteria.tagFilter !== 'ALL') count += 1;
  if (criteria.hasPhoneLine !== 'ALL') count += 1;
  if (criteria.hasOccurrencesOnly) count += 1;
  return count;
}
