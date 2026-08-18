import { describe, expect, it } from 'vitest';
import { NpmService } from '../../src/services/npmService.js';

describe('NpmService', () => {
  const service = new NpmService();

  it('fetches package data for express', async () => {
    const pkg = await service.getPackage('express');
    expect(pkg.name).toBe('express');
    expect(pkg.version).toBeDefined();
    expect(pkg.npmUrl).toContain('npmjs.com/package/express');
    expect(pkg.weeklyDownloads).toBeGreaterThan(0);
    expect(pkg.dependenciesCount).toBeGreaterThan(0);
  });

  it('searches packages matching query', async () => {
    const results = await service.searchPackages('react', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.toLowerCase().includes('react'))).toBe(true);
  });
});
