export interface DocSearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  website: string;
  technology: string;
  icon?: string;
  category?: string;
}

export interface DevDocsIndexEntry {
  name: string;
  path: string;
  type: string;
}

export interface DevDocsDocInfo {
  name: string;
  slug: string;
  type: string;
  links?: {
    home?: string;
    code?: string;
  };
  version?: string;
  release?: string;
}
