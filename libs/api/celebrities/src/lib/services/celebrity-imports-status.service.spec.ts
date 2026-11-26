import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { DATABASE } from '@birthday/api-database';
import { MODULE_OPTIONS_TOKEN } from '../celebrities.module-definition';
import { CelebritiesModuleOptions } from '../types';
import { CelebrityImportsStatusService } from './celebrity-imports-status.service';

// The Drizzle queries are not unit-testable without a database, so minimal stubs answer `select().from()` and
// `execute()` with no data; the spec checks what the status takes from the module options.
describe('CelebrityImportsStatusService', () => {
  const selectQuery: { from: Mock } = { from: vi.fn() };
  const db: { select: Mock; execute: Mock } = { select: vi.fn(), execute: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    db.select.mockReturnValue(selectQuery);
    selectQuery.from.mockResolvedValue([{ people: 0, withDetails: 0, withPageviews: 0, withPhotosChecked: 0, withPhotos: 0 }]);
    db.execute.mockResolvedValue({ rows: [] });
  });

  async function createService(importEnabled: boolean): Promise<CelebrityImportsStatusService> {
    const options: CelebritiesModuleOptions = { importEnabled };
    const moduleRef = await Test.createTestingModule({
      providers: [CelebrityImportsStatusService, { provide: DATABASE, useValue: db }, { provide: MODULE_OPTIONS_TOKEN, useValue: options }],
    }).compile();

    return moduleRef.get(CelebrityImportsStatusService);
  }

  it.each([true, false])('reports whether the import is turned on (%s)', async (importEnabled: boolean) => {
    const service: CelebrityImportsStatusService = await createService(importEnabled);

    const status = await service.getStatus();

    expect(status.importEnabled).toBe(importEnabled);
  });
});
