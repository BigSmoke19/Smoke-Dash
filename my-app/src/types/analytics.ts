export interface DashboardStats {
  users: {
    total: number
    active: number
  }
  applications: {
    total: number
    pending: number
    approved: number
    rejected: number
    conversionRate: string
  }
  revenue: {
    total: number
    monthly: number
  }
  agents: {
    total: number
    active: number
  }
}

export interface MonthlyDataPoint {
  month: string
  count?: number
  amount?: number
}

export interface FunnelDataPoint {
  status: string
  count: number
}

export interface GeographicDataPoint {
  state: string | null
  count: number
}

export interface AcquisitionDataPoint {
  date: string
  count: number
}

export interface RecentActivity {
  id: string
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  note?: string
  createdAt: string
  user?: {
    email: string
    firstName: string
    lastName: string
  }
}