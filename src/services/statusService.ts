import { CACHE_TTLS, STATUS_SERVICES, SupportedStatusService } from '../config/constants.js';
import { ServiceStatusSummary, StatusPageApiResponse } from '../types/status.js';
import { RestClient } from '../utils/restClient.js';
import { cacheService } from './cacheService.js';

export class StatusService {
  private restClient: RestClient;

  constructor() {
    this.restClient = new RestClient();
  }

  /**
   * Fetch live status for a specific service
   */
  public async getServiceStatus(serviceKey: SupportedStatusService): Promise<ServiceStatusSummary> {
    const serviceConfig = STATUS_SERVICES[serviceKey];
    if (!serviceConfig) {
      throw new Error(`Unsupported service: ${serviceKey}`);
    }

    const cacheKey = `status:service:${serviceKey}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await this.restClient.get<StatusPageApiResponse>(serviceConfig.apiUrl);

          const components = (data.components || [])
            .filter((c) => c.status !== 'operational' || data.status.indicator !== 'none')
            .slice(0, 8)
            .map((c) => ({
              name: c.name,
              status: c.status,
              description: c.description || undefined,
            }));

          const activeIncidents = (data.incidents || [])
            .filter((i) => i.status !== 'resolved' && i.status !== 'completed')
            .slice(0, 3)
            .map((i) => ({
              name: i.name,
              status: i.status,
              impact: i.impact,
              updatedAt: i.updated_at,
              shortlink: i.shortlink,
            }));

          return {
            serviceKey,
            name: serviceConfig.name,
            url: serviceConfig.url,
            icon: serviceConfig.icon,
            indicator: data.status?.indicator || 'unknown',
            description: data.status?.description || 'Operational',
            updatedAt: data.page?.updated_at || new Date().toISOString(),
            components,
            activeIncidents,
          };
        } catch (error) {
          // If statuspage API is unreachable, return degraded/unknown state gracefully
          return {
            serviceKey,
            name: serviceConfig.name,
            url: serviceConfig.url,
            icon: serviceConfig.icon,
            indicator: 'unknown',
            description: 'Unable to reach status provider.',
            updatedAt: new Date().toISOString(),
            components: [],
            activeIncidents: [],
          };
        }
      },
      CACHE_TTLS.STATUS_PAGE
    );
  }

  /**
   * Fetch live statuses for all supported services concurrently
   */
  public async getAllServicesStatus(): Promise<ServiceStatusSummary[]> {
    const serviceKeys = Object.keys(STATUS_SERVICES) as SupportedStatusService[];
    return Promise.all(serviceKeys.map((key) => this.getServiceStatus(key)));
  }
}

// Export singleton instance
export const statusService = new StatusService();
