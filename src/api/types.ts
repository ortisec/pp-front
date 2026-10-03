export type Role = 'ADMIN' | 'PERSONERO_MESA' | 'PERSONERO_LOCAL'

export type Category = 'GOBERNADOR' | 'CONSEJERO' | 'PROVINCIA' | 'DISTRITO'

export type VoteType = 'VALIDO' | 'NULO' | 'BLANCO'

export type RecordStatus = 'BORRADOR' | 'CONFIRMADO'

export const CATEGORIES: Category[] = ['GOBERNADOR', 'CONSEJERO', 'PROVINCIA', 'DISTRITO']

export const CATEGORY_LABELS: Record<Category, string> = {
  GOBERNADOR: 'Gobernador y Vicegobernador Regional',
  CONSEJERO: 'Consejero Regional',
  PROVINCIA: 'Provincia',
  DISTRITO: 'Distrito',
}

export interface ScopeInfo {
  table_id: number | null
  school_id: number | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  role: Role
  full_name: string
  scopes: ScopeInfo[]
}

export interface MeResponse {
  id: number
  dni: string | null
  username: string | null
  full_name: string
  role: Role
  scopes: ScopeInfo[]
}

export interface Party {
  id: number
  name: string
  code: string | null
  color: string | null
}

export interface TableInfo {
  id: number
  number: number
  code: string | null
  electores_habilitados: number
  school_id: number
  school_name: string
  school_address: string | null
  district: string
  province: string
  process_id: number
}

export interface VoteEntry {
  id?: number
  category: Category
  vote_type: VoteType
  party_id: number | null
  quantity: number
}

export interface VoteRecord {
  id: number
  table_id: number
  process_id: number
  electores_habilitados: number
  total_asistentes: number
  status: RecordStatus
  comment: string | null
  created_by_id: number | null
  updated_by_id: number | null
  created_at: string
  updated_at: string
  entries: VoteEntry[]
}

export interface TableContext {
  table: TableInfo
  parties: Party[]
  table_parties: Record<Category, number[]>
  record: VoteRecord | null
}

export interface ValidationResult {
  category: Category
  validos: number
  nulos: number
  blancos: number
  total_categoria: number
  total_asistentes: number
  ok: boolean
}

export interface VoteRecordResponse {
  record: VoteRecord
  validation: ValidationResult[]
}

export interface PartyResult {
  party_id: number
  party_name: string
  color: string | null
  votes: number
  percentage: number
}

export interface CategoryResult {
  category: Category
  validos: number
  nulos: number
  blancos: number
  total: number
  parties: PartyResult[]
}

export interface TableResult {
  table_id: number
  table_number: number
  school_name: string
  electores_habilitados: number
  total_asistentes: number
  ausentismo: number
  participation: number
  status: RecordStatus | null
  comment: string | null
  categories: CategoryResult[]
}

export interface Summary {
  total_tables: number
  tables_reportadas: number
  tables_pendientes: number
  total_electores: number
  total_asistentes: number
  ausentismo: number
  participation: number
  comment_count: number
}

export interface RankingEntry {
  party_id: number
  party_name: string
  color: string | null
  votes: number
  percentage: number
  position: number
}

export interface CategoryRanking {
  category: Category
  total_validos: number
  ranking: RankingEntry[]
}

export interface SchoolRankingEntry {
  school_id: number
  school_name: string
  district_name: string
  total_asistentes: number
  validos: number
  nulos: number
  blancos: number
  participation: number
}

export interface DistrictParticipation {
  district_id: number
  district_name: string
  province_name: string
  electores: number
  asistentes: number
  participation: number
}

export interface Analytics {
  process_id: number
  rankings: CategoryRanking[]
  school_ranking: SchoolRankingEntry[]
  district_participation: DistrictParticipation[]
}

export interface FilterProvince {
  id: number
  name: string
  ubigeo: string
}

export interface FilterDistrict {
  id: number
  name: string
  ubigeo: string
  province_id: number
}

export interface FilterSchool {
  id: number
  name: string
  district_id: number
  local_id: string
}

export interface FiltersCatalog {
  provinces: FilterProvince[]
  districts: FilterDistrict[]
  schools: FilterSchool[]
}
