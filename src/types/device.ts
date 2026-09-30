export type DeviceStatus = 
  | 'EM USO'
  | 'DISPONÍVEL'
  | 'MANUTENÇÃO'
  | 'SEM PATRIMÔNIO'
  | 'PERDA / EXTRAVIO'
  | 'DESCARTADO';

export type DeviceCondition = 
  | 'NOVO'
  | 'BOM'
  | 'COM AVARIAS'
  | 'TELA TRINCADA'
  | 'EM REPARO'
  | 'EXTRAVIADO';

export type OccurrenceType = 
  | 'MANUTENÇÃO'
  | 'TROCA'
  | 'PERDA'
  | 'ENTREGA'
  | 'DEVOLUCAO';

export interface DeviceOccurrence {
  id: string;
  date: string;
  type: OccurrenceType;
  title: string;
  description: string;
  previousUser?: string;
  newUser?: string;
  serviceOrderOrBo?: string; // Número de O.S. ou Boletim de Ocorrência (B.O.)
  cost?: string; // Custo estimado ou real do reparo / reposição
  technicianOrProvider?: string; // Assistência técnica ou fornecedor
  recordedBy: string;
  attachmentName?: string; // Nome de comprovante ou laudo anexado
  attachmentData?: string; // Base64 ou URL de prévia
}

export interface Device {
  id: string;
  store: 'LOJA ACARAÚ' | 'LOJA PRÉA' | string;
  assetNumber: string; // Ex: "00271" ou "SEM PT"
  hasAssetTag: boolean; // false se for SEM PT
  employeeName: string; // Ex: "VINICIUS"
  previousEmployeeName?: string; // Se houve troca recente
  hasVpn: boolean;
  brand: string; // "SAMSUNG"
  model: string; // Ex: "A54 - 128GB"
  sector: string; // Ex: "VENDAS", "CAIXA", "ESTOQUE", "MOTORISTA", etc.
  acquisitionDate: string; // Ex: "20/05/2026" ou "?"
  status: DeviceStatus;
  
  // Informações Técnicas e Complementares
  phoneNumber?: string;
  carrier?: string;
  imei1?: string;
  imei2?: string;
  condition: DeviceCondition;
  accessories: string[];
  notes?: string;
  
  // Fichário de Histórico e Ocorrências (Manutenção, Troca, Perda, Entrega)
  occurrences: DeviceOccurrence[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilterOptions {
  store: string;
  sector: string;
  status: string;
  groupBySector: boolean;
  includeOccurrences: boolean;
}

export interface AdvancedFilterCriteria {
  // Acessórios
  accessoryMode: 'has' | 'missing'; // 'has' = possui o acessório; 'missing' = NÃO possui (faltando)
  accessories: string[]; // ex: ['Carregador Original', 'Capa Protetora', 'Película de Vidro']
  
  // Condição física & Tela & Defeitos
  conditionCategories: string[]; // ['TELA_QUEBRADA', 'COM_AVARIAS', 'BOM', 'NOVO', 'EM_REPARO', 'BATERIA_DEFEITO']
  conditionCustomText: string; // busca livre em condição, notas ou histórico de ocorrências
  
  // Outros parâmetros
  vpnFilter: 'ALL' | 'WITH_VPN' | 'WITHOUT_VPN';
  tagFilter: 'ALL' | 'WITH_TAG' | 'SEM_PT';
  hasPhoneLine: 'ALL' | 'WITH_LINE' | 'WITHOUT_LINE';
  hasOccurrencesOnly: boolean;
}

export const INITIAL_ADVANCED_FILTERS: AdvancedFilterCriteria = {
  accessoryMode: 'has',
  accessories: [],
  conditionCategories: [],
  conditionCustomText: '',
  vpnFilter: 'ALL',
  tagFilter: 'ALL',
  hasPhoneLine: 'ALL',
  hasOccurrencesOnly: false,
};

