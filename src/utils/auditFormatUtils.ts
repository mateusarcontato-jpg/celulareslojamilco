import { Device, DeviceOccurrence } from '../types/device';

/**
 * Remove frases automáticas redundantes das observações para não duplicar o que já aparece nos selos/resumo
 */
export function cleanExecutiveAuditNotes(rawNotes?: string): string {
  if (!rawNotes) return '';
  let cleaned = rawNotes
    .replace(/Película de proteção trincada\s*\(a tela (original )?do celular está íntegra\/intacta\)\.?/gi, '')
    .replace(/Tela do aparelho quebrada\/trincada\s*\(dano físico no display\/vidro\)\.?/gi, '')
    .replace(/Bateria inchada\/danificada\s*\(necessita avaliação\/substituição\)\.?/gi, '')
    .replace(/Capa protetora desgastada\/rasgada\s*\(necessita substituição\)\.?/gi, '')
    .replace(/^[.\s,;]+|[.\s]+$/g, '')
    .replace(/\.\s*\./g, '.')
    .trim();

  if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!')) {
    cleaned += '.';
  }
  return cleaned;
}

/**
 * Remove duplicidades na lista de acessórios danificados (ex: "Película de Vidro" + "Película de Proteção (Trincada)")
 */
export function dedupeDamagedAccessories(items: string[] = []): string[] {
  const result: string[] = [];
  let hasPelicula = false;
  let hasCapa = false;

  for (const raw of items) {
    const lower = raw.toLowerCase();
    if (lower.includes('película') || lower.includes('pelicula')) {
      if (!hasPelicula) {
        hasPelicula = true;
        result.push('Película de Vidro');
      }
    } else if (lower.includes('capa')) {
      if (!hasCapa) {
        hasCapa = true;
        result.push('Capa Protetora');
      }
    } else if (!result.includes(raw)) {
      result.push(raw);
    }
  }

  return result;
}

/**
 * Gera título e texto executivo, simples e direto para diretores (sem repetição)
 */
export function buildExecutiveAuditText(params: {
  isOk: boolean;
  screenOk: boolean;
  batteryOk: boolean;
  peliculaStatus: 'COM_PELICULA_OK' | 'PELICULA_TRINCADA' | 'SEM_PELICULA';
  isCapaDamaged: boolean;
  missingItems: string[];
  damagedAccessories: string[];
  auditNotes?: string;
}): { title: string; description: string } {
  const {
    isOk,
    screenOk,
    batteryOk,
    peliculaStatus,
    isCapaDamaged,
    missingItems,
    damagedAccessories,
    auditNotes,
  } = params;

  const cleanedNotes = cleanExecutiveAuditNotes(auditNotes);

  if (isOk) {
    return {
      title: 'AUDITORIA: APARELHO E ACESSÓRIOS 100% OK',
      description: cleanedNotes
        ? `Aparelho e todos os acessórios conferidos em perfeito estado. Observação: ${cleanedNotes}`
        : 'Aparelho com tela e bateria em perfeito estado e todos os acessórios entregues conferidos.',
    };
  }

  // Lista simples do que precisa de atenção para o título
  const titleParts: string[] = [];
  if (!screenOk) titleParts.push('TELA QUEBRADA');
  if (!batteryOk) titleParts.push('BATERIA INCHADA / DANIFICADA');
  if (peliculaStatus === 'PELICULA_TRINCADA') titleParts.push('PELÍCULA TRINCADA');
  if (isCapaDamaged) titleParts.push('CAPA DESGASTADA');
  if (missingItems.length > 0) titleParts.push(`FALTA: ${missingItems.join(', ').toUpperCase()}`);

  const otherDamaged = dedupeDamagedAccessories(damagedAccessories).filter(
    (a) =>
      !a.toLowerCase().includes('película') &&
      !a.toLowerCase().includes('pelicula') &&
      !a.toLowerCase().includes('capa')
  );
  if (otherDamaged.length > 0) {
    titleParts.push(`AVARIA: ${otherDamaged.join(', ').toUpperCase()}`);
  }

  const title =
    titleParts.length > 0
      ? `AUDITORIA: ${titleParts.join(' · ')}`
      : 'AUDITORIA: PENDÊNCIA CONSTATADA';

  // Texto simples e direto para leitura rápida da diretoria
  const sentences: string[] = [];

  // 1. Estado do aparelho (Tela e Bateria)
  if (screenOk && batteryOk) {
    sentences.push('Aparelho funcionando normalmente (tela original e bateria em bom estado).');
  } else if (!screenOk && !batteryOk) {
    sentences.push('Aparelho com tela quebrada e bateria danificada/inchada.');
  } else if (!screenOk) {
    sentences.push('Aparelho com a tela quebrada (necessita reparo no display), bateria normal.');
  } else if (!batteryOk) {
    sentences.push('Aparelho com tela intacta, porém com bateria inchada/danificada (necessita substituição).');
  }

  // 2. Acessórios com avaria ou faltando
  const actionItems: string[] = [];
  if (peliculaStatus === 'PELICULA_TRINCADA') {
    actionItems.push('Película de proteção trincada');
  } else if (peliculaStatus === 'SEM_PELICULA' && !missingItems.some((m) => m.toLowerCase().includes('pel'))) {
    actionItems.push('Sem película de proteção');
  }

  if (isCapaDamaged) {
    actionItems.push('Capa protetora desgastada/rasgada');
  }

  otherDamaged.forEach((item) => {
    actionItems.push(`${item} danificado(a)`);
  });

  if (actionItems.length > 0) {
    sentences.push(`Pendência de acessórios: ${actionItems.join(' e ')}.`);
  }

  if (missingItems.length > 0) {
    sentences.push(`Itens ausentes no momento da conferência: ${missingItems.join(', ')}.`);
  }

  if (cleanedNotes) {
    sentences.push(`Observação: ${cleanedNotes}`);
  }

  return {
    title,
    description: sentences.join(' '),
  };
}

/**
 * Remove registros de AUDITORIA duplicados na mesma data (mantém apenas o mais recente)
 * e simplifica textos antigos/repetitivos para leitura fácil da diretoria.
 */
export function getCleanOccurrencesForDisplay(device: Device): DeviceOccurrence[] {
  const rawList = device.occurrences || [];
  const seenAuditDates = new Set<string>();
  const filtered: DeviceOccurrence[] = [];

  for (const occ of rawList) {
    const isAudit =
      occ.type === 'AUDITORIA' ||
      occ.title.toUpperCase().startsWith('CHECKUP') ||
      occ.title.toUpperCase().startsWith('AUDITORIA');

    if (isAudit) {
      const dateKey = occ.date || 'latest';
      if (seenAuditDates.has(dateKey)) {
        // Ignora duplicata de auditoria feita no mesmo dia
        continue;
      }
      seenAuditDates.add(dateKey);

      // Se a descrição antiga tiver o formato técnico repetitivo ("Estado Geral: ... | Tela Original ..."),
      // converte automaticamente para o texto executivo limpo usando os dados atuais da auditoria!
      if (
        device.auditInfo &&
        (occ.description.includes('Estado Geral:') ||
          occ.description.includes('Película de Proteção (Trincada)') ||
          occ.description.includes('Auditoria presencial realizada por'))
      ) {
        const isCapaDamaged = Boolean(
          device.auditInfo.damagedAccessories?.some((a) => a.toLowerCase().includes('capa')) ||
            (device.auditInfo.auditNotes || '').toLowerCase().includes('capa desgastad') ||
            (device.auditInfo.auditNotes || '').toLowerCase().includes('capa rasgad') ||
            (device.auditInfo.auditNotes || '').toLowerCase().includes('capa já desgastad')
        );
        const exec = buildExecutiveAuditText({
          isOk: device.auditInfo.status === 'OK',
          screenOk: device.auditInfo.screenOk !== false,
          batteryOk: device.auditInfo.batteryOk !== false,
          peliculaStatus: device.auditInfo.peliculaStatus || 'COM_PELICULA_OK',
          isCapaDamaged,
          missingItems: device.auditInfo.missingAccessories || [],
          damagedAccessories: device.auditInfo.damagedAccessories || [],
          auditNotes: device.auditInfo.auditNotes,
        });

        filtered.push({
          ...occ,
          title: exec.title,
          description: exec.description,
        });
        continue;
      }
    }

    filtered.push(occ);
  }

  return filtered;
}
