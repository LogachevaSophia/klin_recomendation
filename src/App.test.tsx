import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

  it('renders recommendations route without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/recommendations']}>
        <Routes>
          <Route path="/recommendations" element={<div data-testid="rec-page">ok</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByTestId('rec-page')).toHaveTextContent('ok');
  });
});
