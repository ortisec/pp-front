export interface PollingTableLite {
  id: number
  number: number
  code: string | null
  school_id: number
  electores_habilitados: number
}

export interface Province {
  id: number
  process_id: number
  name: string
  ubigeo: string
}

export interface District {
  id: number
  process_id: number
  province_id: number
  name: string
  ubigeo: string
}

export interface School {
  id: number
  process_id: number
  district_id: number
  local_id: string
  name: string
  address: string | null
}

export interface PollingTable {
  id: number
  process_id: number
  school_id: number
  number: number
  code: string | null
  electores_habilitados: number
}

export interface Party {
  id: number
  process_id: number
  name: string
  code: string | null
  color: string | null
}

export interface ProcessItem {
  id: number
  name: string
  year: number
  process_type: string
  is_active: boolean
}

export type UserRole = 'ADMIN' | 'PERSONERO_MESA' | 'PERSONERO_LOCAL'

export interface UserAssignmentInfo {
  id: number
  table_id: number | null
  school_id: number | null
  table_number: number | null
  table_code: string | null
  school_name: string | null
}

export interface UserAccount {
  id: number
  dni: string | null
  username: string | null
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  assignments: UserAssignmentInfo[]
}

export interface DniLookupResult {
  dni: string
  full_name: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
}
