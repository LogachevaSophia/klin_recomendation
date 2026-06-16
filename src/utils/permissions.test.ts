import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Permission } from '../api/authTypes';

const mockPermissions: Permission[] = [];

vi.mock('../stores/authStore', () => ({
  authStore: {
    get permissions() {
      return mockPermissions;
    },
  },
}));

import { hasPermission, hasAnyPermission } from './permissions';

describe('permissions', () => {
  beforeEach(() => {
    mockPermissions.length = 0;
  });

  it('allows wildcard */* permission', () => {
    mockPermissions.push({ action: '*', resource: '*' });
    expect(hasPermission('delete', 'guideline')).toBe(true);
  });

  it('matches exact action and resource', () => {
    mockPermissions.push({ action: 'read', resource: 'guideline' });
    expect(hasPermission('read', 'guideline')).toBe(true);
    expect(hasPermission('write', 'guideline')).toBe(false);
  });

  it('hasAnyPermission returns true if one matches', () => {
    mockPermissions.push({ action: 'read', resource: 'guideline' });
    expect(
      hasAnyPermission([
        { action: 'write', resource: 'guideline' },
        { action: 'read', resource: 'guideline' },
      ]),
    ).toBe(true);
  });

  it('denies when permission list is empty', () => {
    expect(hasPermission('read', 'guideline')).toBe(false);
  });
});
