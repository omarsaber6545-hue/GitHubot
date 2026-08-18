import { CACHE_TTLS } from '../config/constants.js';
import { NpmPackageData, NpmRegistryResponse, NpmSearchResult } from '../types/npm.js';
import { RestClient } from '../utils/restClient.js';
import { cacheService } from './cacheService.js';

export class NpmService {
  private registryClient: RestClient;
  private downloadsClient: RestClient;

  constructor() {
    this.registryClient = new RestClient('https://registry.npmjs.org');
    this.downloadsClient = new RestClient('https://api.npmjs.org');
  }

  /**
   * Fetch complete package metadata and weekly download stats
   */
  public async getPackage(packageName: string): Promise<NpmPackageData> {
    const sanitizedName = packageName.trim().toLowerCase();
    const cacheKey = `npm:pkg:${sanitizedName}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Fetch registry metadata and download count concurrently
        const [pkgData, weeklyDownloads] = await Promise.all([
          this.registryClient.get<NpmRegistryResponse>(`/${encodeURIComponent(sanitizedName)}`),
          this.getWeeklyDownloads(sanitizedName).catch(() => 0),
        ]);

        const latestVersion = pkgData['dist-tags']?.latest || Object.keys(pkgData.versions || {}).pop() || '1.0.0';
        const versionData = pkgData.versions?.[latestVersion];

        const dependenciesCount = versionData?.dependencies
          ? Object.keys(versionData.dependencies).length
          : 0;

        // Clean repository URL
        let repoUrl: string | null = null;
        if (typeof pkgData.repository === 'string') {
          repoUrl = pkgData.repository;
        } else if (pkgData.repository?.url) {
          repoUrl = pkgData.repository.url
            .replace(/^git\+/, '')
            .replace(/\.git$/, '')
            .replace(/^git:\/\//, 'https://');
        }

        const lastPublishDate =
          (pkgData.time && (pkgData.time[latestVersion] || pkgData.time.modified)) ||
          new Date().toISOString();

        // Maintainer formatting
        const maintainerRaw =
          (pkgData.maintainers && pkgData.maintainers[0]) ||
          (typeof pkgData.author === 'object' ? pkgData.author : null) || { name: 'Unknown' };

        const maintainer = {
          name: maintainerRaw.name || (typeof pkgData.author === 'string' ? pkgData.author : 'Unknown'),
          email: maintainerRaw.email,
          avatarUrl: maintainerRaw.email
            ? `https://www.gravatar.com/avatar/${Buffer.from(maintainerRaw.email.trim().toLowerCase()).toString('hex')}?d=retro`
            : undefined,
        };

        const result: NpmPackageData = {
          name: pkgData.name,
          version: latestVersion,
          description: pkgData.description || versionData?.description || 'No description provided.',
          weeklyDownloads,
          dependenciesCount,
          maintainer,
          lastPublishDate,
          npmUrl: `https://www.npmjs.com/package/${encodeURIComponent(sanitizedName)}`,
          repositoryUrl: repoUrl,
          homepageUrl: pkgData.homepage || null,
          license: pkgData.license || versionData?.license || 'Unspecified',
          keywords: pkgData.keywords || [],
          types: !!(versionData?.types || versionData?.typings),
        };

        return result;
      },
      CACHE_TTLS.NPM_PACKAGE
    );
  }

  /**
   * Fetch weekly downloads for a package
   */
  public async getWeeklyDownloads(packageName: string): Promise<number> {
    try {
      const sanitizedName = packageName.trim().toLowerCase();
      const data = await this.downloadsClient.get<{ downloads: number }>(
        `/downloads/point/last-week/${encodeURIComponent(sanitizedName)}`
      );
      return data?.downloads || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Search NPM registry for packages
   */
  public async searchPackages(query: string, limit = 5): Promise<NpmSearchResult[]> {
    const sanitizedQuery = query.trim().toLowerCase();
    const cacheKey = `npm:search:${sanitizedQuery}:${limit}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        interface SearchApiResponse {
          objects: Array<{
            package: {
              name: string;
              version: string;
              description?: string;
              keywords?: string[];
              publisher?: {
                username: string;
                email: string;
              };
              links: {
                npm: string;
              };
            };
            score: {
              final: number;
              detail: {
                quality: number;
                popularity: number;
                maintenance: number;
              };
            };
            searchScore: number;
          }>;
        }

        const data = await this.registryClient.get<SearchApiResponse>(
          `/-/v1/search?text=${encodeURIComponent(sanitizedQuery)}&size=${limit}`
        );

        if (!data || !data.objects) return [];

        // Concurrently fetch download counts for top packages
        const results = await Promise.all(
          data.objects.map(async (obj) => {
            const downloads = await this.getWeeklyDownloads(obj.package.name).catch(() => 0);
            return {
              name: obj.package.name,
              version: obj.package.version,
              description: obj.package.description || 'No description provided.',
              weeklyDownloads: downloads,
              keywords: obj.package.keywords || [],
              publisher: {
                username: obj.package.publisher?.username || 'anonymous',
                email: obj.package.publisher?.email || '',
              },
              npmUrl: obj.package.links.npm || `https://www.npmjs.com/package/${encodeURIComponent(obj.package.name)}`,
              score: obj.score,
            };
          })
        );

        return results;
      },
      CACHE_TTLS.NPM_SEARCH
    );
  }
}

// Export singleton instance
export const npmService = new NpmService();
