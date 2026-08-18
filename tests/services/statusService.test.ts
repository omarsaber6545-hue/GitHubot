import { describe, expect, it } from 'vitest';
import { StatusService } from '../../src/services/statusService.js';

describe('StatusService', () => {
  const service = new StatusService();

  it('fetches status for GitHub', async () => {
    const status = await service.getServiceStatus('github');
    expect(status.name).toBe('GitHub');
    expect(status.url).toContain('githubstatus.com');
    expect(['none', 'minor', 'major', 'critical', 'maintenance', 'unknown']).toContain(status.indicator);
    expect(status.description).toBeDefined();
  });

  it('fetches status for Discord', async () => {
    const status = await service.getServiceStatus('discord');
    expect(status.name).toBe('Discord');
    expect(status.url).toContain('discordstatus.com');
    expect(status.indicator).toBeDefined();
  });

  it('fetches all supported services status concurrently', async () => {
    const all = await service.getAllServicesStatus();
    expect(all.length).toBe(5);
    const names = all.map((s) => s.serviceKey);
    expect(names).toContain('github');
    expect(names).toContain('npm');
    expect(names).toContain('discord');
    expect(names).toContain('cloudflare');
    expect(names).toContain('vercel');
  });
});
