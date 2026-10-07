import { Device } from '../types/device';

export type GenerationCategory =
  | 'LEGADO_2021'
  | 'GERACAO_2022'
  | 'GERACAO_2023'
  | 'GERACAO_2024'
  | 'ULTIMA_GERACAO';

export interface ManufacturerSpecInfo {
  familyName: string;
  releaseYear: number;
  releaseMonthLabel: string;
  chronologicalRank: number; // Menor = modelo mais antigo de fabricação; Maior = modelo mais novo de fabricação
  category: GenerationCategory;
  categoryLabel: string;
  shortBadgeLabel: string;
  processor: string;
  ramAndStorage: string;
  connectivity: '4G LTE' | '5G';
  screenSpec: string;
  osSupportSummary: string;
  lifecycleVerdict: string;
  isOldestTier: boolean;
  isNewestTier: boolean;
}

/**
 * Analisa o modelo e a marca do aparelho com base nas fichas técnicas oficiais da fabricante
 * (Samsung Galaxy linha A, Motorola, Apple, Xiaomi, etc.) para classificar do modelo mais antigo ao mais novo.
 */
export function getManufacturerModelSpec(modelRaw: string, brandRaw: string = 'SAMSUNG'): ManufacturerSpecInfo {
  const norm = `${brandRaw} ${modelRaw}`.toUpperCase().trim();

  // 1. Samsung Galaxy A03s (Lançamento: Agosto de 2021) — O MAIS ANTIGO DA FROTA (junto à família A03)
  if (norm.includes('A03S')) {
    return {
      familyName: 'Galaxy A03s',
      releaseYear: 2021,
      releaseMonthLabel: 'Agosto / 2021',
      chronologicalRank: 10,
      category: 'LEGADO_2021',
      categoryLabel: '1ª Geração · Linha 2021 (Mais Antigo)',
      shortBadgeLabel: '2021 · Mais Antigo',
      processor: 'MediaTek Helio P35 (12 nm · Octa-core 2.3 GHz)',
      ramAndStorage: '4 GB RAM · 64 GB (eMMC 5.1)',
      connectivity: '4G LTE',
      screenSpec: 'PLS LCD 6.5" HD+ (60 Hz)',
      osSupportSummary: 'Lançado com Android 11 · Fim do ciclo de atualizações (EOL)',
      lifecycleVerdict: 'Modelo mais antigo de fabricação da frota (2021). Hardware básico de entrada; recomendado priorizar substituição gradual em setores de alto uso.',
      isOldestTier: true,
      isNewestTier: false,
    };
  }

  // 2. Samsung Galaxy A03 Core / A03 (Lançamento: Novembro de 2021)
  if (norm.includes('A03')) {
    return {
      familyName: 'Galaxy A03',
      releaseYear: 2021,
      releaseMonthLabel: 'Novembro / 2021',
      chronologicalRank: 12,
      category: 'LEGADO_2021',
      categoryLabel: '1ª Geração · Linha 2021 (Mais Antigo)',
      shortBadgeLabel: '2021 · Mais Antigo',
      processor: 'Unisoc T606 (12 nm · Octa-core 1.6 GHz)',
      ramAndStorage: '4 GB RAM · 64 GB (eMMC 5.1)',
      connectivity: '4G LTE',
      screenSpec: 'PLS IPS 6.5" HD+ (60 Hz)',
      osSupportSummary: 'Lançado com Android 11 · Ciclo de suporte encerrado (EOL)',
      lifecycleVerdict: 'Aparelho de 1ª geração da frota (2021). Indicado apenas para tarefas leves ou fila de renovação.',
      isOldestTier: true,
      isNewestTier: false,
    };
  }

  // 3. Samsung Galaxy A04s (Lançamento: Agosto/Setembro de 2022)
  if (norm.includes('A04S')) {
    return {
      familyName: 'Galaxy A04s',
      releaseYear: 2022,
      releaseMonthLabel: 'Setembro / 2022',
      chronologicalRank: 20,
      category: 'GERACAO_2022',
      categoryLabel: '2ª Geração · Linha 2022 (Entrada)',
      shortBadgeLabel: '2022 · Entrada',
      processor: 'Samsung Exynos 850 (8 nm · Octa-core 2.0 GHz)',
      ramAndStorage: '4 GB RAM · 64 GB',
      connectivity: '4G LTE',
      screenSpec: 'PLS LCD 6.5" HD+ (90 Hz)',
      osSupportSummary: 'Lançado com Android 12 · Suporte básico de segurança',
      lifecycleVerdict: 'Geração 2022 de entrada com tela 90 Hz e processador econômico de 8 nm.',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 4. Samsung Galaxy A04e / A04 (Lançamento: Outubro de 2022)
  if (norm.includes('A04E') || norm.includes('A04')) {
    return {
      familyName: 'Galaxy A04e',
      releaseYear: 2022,
      releaseMonthLabel: 'Outubro / 2022',
      chronologicalRank: 22,
      category: 'GERACAO_2022',
      categoryLabel: '2ª Geração · Linha 2022 (Entrada)',
      shortBadgeLabel: '2022 · Entrada',
      processor: 'MediaTek Helio P35 (12 nm · Octa-core 2.3 GHz)',
      ramAndStorage: '3/4 GB RAM · 64 GB',
      connectivity: '4G LTE',
      screenSpec: 'PLS LCD 6.5" HD+ (60 Hz)',
      osSupportSummary: 'Lançado com Android 12 (Go/One UI Core)',
      lifecycleVerdict: 'Geração 2022 de entrada voltada para uso operacional leve.',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 5. Samsung Galaxy A14 (Lançamento: Janeiro/Fevereiro de 2023)
  if (norm.includes('A14')) {
    const is5G = norm.includes('5G');
    return {
      familyName: is5G ? 'Galaxy A14 5G' : 'Galaxy A14',
      releaseYear: 2023,
      releaseMonthLabel: 'Fevereiro / 2023',
      chronologicalRank: 30,
      category: 'GERACAO_2023',
      categoryLabel: '3ª Geração · Linha 2023 (Intermediário)',
      shortBadgeLabel: '2023 · Interm.',
      processor: is5G ? 'Exynos 1330 (5 nm)' : 'MediaTek Helio G80 / Exynos 850',
      ramAndStorage: '4 GB RAM · 128 GB',
      connectivity: is5G ? '5G' : '4G LTE',
      screenSpec: 'PLS LCD 6.6" Full HD+ (1080p)',
      osSupportSummary: 'Lançado com Android 13 · Atualizável até Android 15',
      lifecycleVerdict: 'Geração 2023 equilibrada com 128 GB de armazenamento e resolução Full HD+.',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 6. Samsung Galaxy A54 5G (Lançamento: Março de 2023)
  if (norm.includes('A54')) {
    return {
      familyName: 'Galaxy A54 5G',
      releaseYear: 2023,
      releaseMonthLabel: 'Março / 2023',
      chronologicalRank: 35,
      category: 'GERACAO_2023',
      categoryLabel: '3ª Geração · Linha 2023 (Premium 5G)',
      shortBadgeLabel: '2023 · 5G',
      processor: 'Samsung Exynos 1380 (5 nm · Octa-core 2.4 GHz)',
      ramAndStorage: '8 GB RAM · 128 GB',
      connectivity: '5G',
      screenSpec: 'Super AMOLED 6.4" FHD+ (120 Hz · IP67)',
      osSupportSummary: 'Lançado com Android 13 · 4 anos de atualizações de sistema',
      lifecycleVerdict: 'Intermediário superior 5G de 2023 com proteção IP67 e alto desempenho para VPN e vendas.',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 7. Samsung Galaxy A15 (Caso cadastrado futuramente - Dez 2023 / Jan 2024)
  if (norm.includes('A15')) {
    return {
      familyName: 'Galaxy A15',
      releaseYear: 2024,
      releaseMonthLabel: 'Janeiro / 2024',
      chronologicalRank: 42,
      category: 'GERACAO_2024',
      categoryLabel: '4ª Geração · Linha 2024',
      shortBadgeLabel: '2024 · Atual',
      processor: 'MediaTek Helio G99 / Dimensity 6100+ (6 nm)',
      ramAndStorage: '4/8 GB RAM · 128 GB',
      connectivity: norm.includes('5G') ? '5G' : '4G LTE',
      screenSpec: 'Super AMOLED 6.5" FHD+ (90 Hz)',
      osSupportSummary: 'Lançado com Android 14 · 4 gerações de Android',
      lifecycleVerdict: 'Aparelho moderno da geração 2024 com tela Super AMOLED.',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 8. Samsung Galaxy A55 5G (Lançamento: Março de 2024)
  if (norm.includes('A55')) {
    return {
      familyName: 'Galaxy A55 5G',
      releaseYear: 2024,
      releaseMonthLabel: 'Março / 2024',
      chronologicalRank: 45,
      category: 'GERACAO_2024',
      categoryLabel: '4ª Geração · Linha 2024 (Premium 5G)',
      shortBadgeLabel: '2024 · 5G',
      processor: 'Samsung Exynos 1480 (4 nm · GPU Xclipse 530)',
      ramAndStorage: '8 GB RAM · 128 GB / 64 GB',
      connectivity: '5G',
      screenSpec: 'Super AMOLED 6.6" FHD+ (120 Hz · Gorilla Glass Victus+ · IP67)',
      osSupportSummary: 'Lançado com Android 14 · Suporte longo até 2029',
      lifecycleVerdict: 'Geração 2024 de alta durabilidade (estrutura em alumínio, IP67 e processador de 4 nm).',
      isOldestTier: false,
      isNewestTier: false,
    };
  }

  // 9. Samsung Galaxy A16 5G (Lançamento: Outubro/Novembro de 2024 — Linha 2025)
  if (norm.includes('A16')) {
    return {
      familyName: 'Galaxy A16 5G',
      releaseYear: 2025,
      releaseMonthLabel: 'Nov 2024 / Linha 2025',
      chronologicalRank: 52,
      category: 'ULTIMA_GERACAO',
      categoryLabel: '5ª Geração · Nova Geração 5G',
      shortBadgeLabel: '2025 · Novo 5G',
      processor: 'Samsung Exynos 1330 / Dimensity 6300 (5/6 nm · 5G)',
      ramAndStorage: '4/8 GB RAM · 128 GB',
      connectivity: '5G',
      screenSpec: 'Super AMOLED 6.7" FHD+ (90 Hz · IP54)',
      osSupportSummary: '6 anos de atualizações de Android e segurança garantidos pela Samsung',
      lifecycleVerdict: 'Nova geração 5G com suporte estendido de 6 anos de atualizações pela fabricante.',
      isOldestTier: false,
      isNewestTier: true,
    };
  }

  // 10. Samsung Galaxy A56 / A56G 5G (Lançamento: Março de 2025)
  if (norm.includes('A56')) {
    return {
      familyName: 'Galaxy A56 5G',
      releaseYear: 2025,
      releaseMonthLabel: 'Março / 2025',
      chronologicalRank: 56,
      category: 'ULTIMA_GERACAO',
      categoryLabel: '5ª Geração · Linha 2025 (Mais Novo)',
      shortBadgeLabel: '2025 · Mais Novo',
      processor: 'Samsung Exynos 1580 (4 nm · Octa-core 2.9 GHz)',
      ramAndStorage: '8 GB RAM · 128 GB (UFS 3.1)',
      connectivity: '5G',
      screenSpec: 'Super AMOLED 6.7" FHD+ (120 Hz · IP67 · Carregamento 45W)',
      osSupportSummary: 'Android 15 (One UI 7) · 6 anos de atualizações oficiais',
      lifecycleVerdict: 'Linha 2025 de alto desempenho corporativo, conectividade 5G e suporte de longo prazo.',
      isOldestTier: false,
      isNewestTier: true,
    };
  }

  // 11. Samsung Galaxy A57 5G (Lançamento: Linha 2026 — O MAIS NOVO DA FROTA)
  if (norm.includes('A57')) {
    return {
      familyName: 'Galaxy A57 5G',
      releaseYear: 2026,
      releaseMonthLabel: 'Linha 2026 (Última Geração)',
      chronologicalRank: 60,
      category: 'ULTIMA_GERACAO',
      categoryLabel: 'Última Geração · Linha 2026 (Mais Novo)',
      shortBadgeLabel: '2026 · Mais Novo',
      processor: 'Arquitetura Exynos Série 1600 (4 nm · 5G)',
      ramAndStorage: '8 GB RAM · 128 GB',
      connectivity: '5G',
      screenSpec: 'Super AMOLED 6.7" FHD+ (120 Hz · IP67)',
      osSupportSummary: 'Android 16 · 6 anos de atualizações garantidas',
      lifecycleVerdict: 'Modelo mais recente de fabricação da frota (Última Geração). Máxima vida útil e desempenho.',
      isOldestTier: false,
      isNewestTier: true,
    };
  }

  // Fallback inteligente para outros modelos Samsung ou outras marcas cadastradas
  const numMatch = norm.match(/A(\d)(\d)/);
  if (numMatch) {
    const genDigit = parseInt(numMatch[2], 10);
    const estYear = 2019 + genDigit;
    return {
      familyName: modelRaw,
      releaseYear: estYear,
      releaseMonthLabel: `Linha ${estYear}`,
      chronologicalRank: genDigit * 10,
      category: estYear <= 2021 ? 'LEGADO_2021' : estYear === 2022 ? 'GERACAO_2022' : estYear === 2023 ? 'GERACAO_2023' : estYear === 2024 ? 'GERACAO_2024' : 'ULTIMA_GERACAO',
      categoryLabel: `Linha ${estYear}`,
      shortBadgeLabel: `Fab. ${estYear}`,
      processor: 'Octa-core Corporativo',
      ramAndStorage: modelRaw.includes('128') ? '128 GB' : '64 GB',
      connectivity: norm.includes('5G') ? '5G' : '4G LTE',
      screenSpec: 'Display Touch HD+/FHD+',
      osSupportSummary: `Geração ${estYear}`,
      lifecycleVerdict: `Aparelho de geração estimada ${estYear} conforme nomenclatura da fabricante.`,
      isOldestTier: estYear <= 2021,
      isNewestTier: estYear >= 2025,
    };
  }

  return {
    familyName: `${brandRaw} ${modelRaw}`.trim(),
    releaseYear: 2024,
    releaseMonthLabel: 'Geração Padrão',
    chronologicalRank: 40,
    category: 'GERACAO_2024',
    categoryLabel: 'Geração Intermediária',
    shortBadgeLabel: 'Intermediário',
    processor: 'Processador Octa-Core',
    ramAndStorage: modelRaw.includes('128') ? '128 GB' : '64 GB',
    connectivity: norm.includes('5G') ? '5G' : '4G LTE',
    screenSpec: 'Display Padrão',
    osSupportSummary: 'Suporte Ativo',
    lifecycleVerdict: 'Ficha técnica padrão registrada no inventário.',
    isOldestTier: false,
    isNewestTier: false,
  };
}

/**
 * Retorna um resumo estatístico da frota por geração técnica da fabricante
 */
export function getFleetGenerationSummary(devices: Device[]) {
  const counts = {
    LEGADO_2021: 0,
    GERACAO_2022: 0,
    GERACAO_2023: 0,
    GERACAO_2024: 0,
    ULTIMA_GERACAO: 0,
  };

  let oldestDevice: { device: Device; spec: ManufacturerSpecInfo } | null = null;
  let newestDevice: { device: Device; spec: ManufacturerSpecInfo } | null = null;

  for (const d of devices) {
    const spec = getManufacturerModelSpec(d.model, d.brand);
    counts[spec.category] = (counts[spec.category] || 0) + 1;

    if (!oldestDevice || spec.chronologicalRank < oldestDevice.spec.chronologicalRank) {
      oldestDevice = { device: d, spec };
    }
    if (!newestDevice || spec.chronologicalRank > newestDevice.spec.chronologicalRank) {
      newestDevice = { device: d, spec };
    }
  }

  return {
    counts,
    oldestDevice,
    newestDevice,
  };
}
