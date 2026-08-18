export type ServiceStatusIndicator = 'none' | 'minor' | 'major' | 'critical' | 'maintenance' | 'unknown';

export interface ServiceStatusSummary {
  serviceKey: string;
  name: string;
  url: string;
  icon: string;
  indicator: ServiceStatusIndicator;
  description: string;
  updatedAt: string;
  components: Array<{
    name: string;
    status: string;
    description?: string;
  }>;
  activeIncidents: Array<{
    name: string;
    status: string;
    impact: string;
    updatedAt: string;
    shortlink: string;
  }>;
}

export interface StatusPageApiResponse {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    indicator: ServiceStatusIndicator;
    description: string;
  };
  components?: Array<{
    id: string;
    name: string;
    status: string;
    description: string | null;
  }>;
  incidents?: Array<{
    id: string;
    name: string;
    status: string;
    impact: string;
    shortlink: string;
    updated_at: string;
  }>;
}
