import { describe, expect, it } from 'vitest';
import { DocsService } from '../../src/services/docsService.js';

describe('DocsService', () => {
  const service = new DocsService();

  it('finds curated JavaScript array documentation', async () => {
    const results = await service.searchDocs('array map', 'javascript');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('Array');
    expect(results[0].website).toBe('developer.mozilla.org');
  });

  it('filters results by technology correctly', async () => {
    const pythonResults = await service.searchDocs('asyncio', 'python');
    expect(pythonResults.length).toBeGreaterThan(0);
    expect(pythonResults[0].technology).toBe('python');
    expect(pythonResults[0].website).toContain('python.org');
  });

  it('finds Dockerfile and compose documentation', async () => {
    const dockerResults = await service.searchDocs('dockerfile', 'docker');
    expect(dockerResults.length).toBeGreaterThan(0);
    expect(dockerResults[0].url).toContain('docker.com');
  });

  it('generates a valid fallback search link for unknown queries', async () => {
    const fallbackResults = await service.searchDocs('super-rare-custom-query-xyz', 'rust');
    expect(fallbackResults.length).toBeGreaterThan(0);
    expect(fallbackResults[0].url).toBeDefined();
    expect(fallbackResults[0].title).toContain('Search for');
  });
});
