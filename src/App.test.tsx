// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./api/recommendationService', () => ({
  recommendationService: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getSubprocess: vi.fn(),
  },
}));

describe('App routing', () => {
  it('exports routes used by the shell', () => {
    expect(App).toBeDefined();
  });
});
