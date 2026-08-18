export interface NpmPackageData {
  name: string;
  version: string;
  description: string;
  weeklyDownloads: number;
  dependenciesCount: number;
  maintainer: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  lastPublishDate: string;
  npmUrl: string;
  repositoryUrl: string | null;
  homepageUrl: string | null;
  license: string;
  keywords: string[];
  types?: boolean;
}

export interface NpmSearchResult {
  name: string;
  version: string;
  description: string;
  weeklyDownloads: number;
  keywords: string[];
  publisher: {
    username: string;
    email: string;
  };
  npmUrl: string;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export interface NpmRegistryResponse {
  _id: string;
  name: string;
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  description?: string;
  time?: {
    modified?: string;
    created?: string;
    [version: string]: string | undefined;
  };
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  author?: {
    name: string;
    email?: string;
    url?: string;
  } | string;
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  } | string;
  homepage?: string;
  license?: string;
  keywords?: string[];
  versions?: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      license?: string;
      types?: string;
      typings?: string;
    };
  };
}
