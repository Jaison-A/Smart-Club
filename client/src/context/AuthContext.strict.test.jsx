import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const refresh = vi.fn();
vi.mock('../api/auth.api', () => ({ authApi: { refresh: (...a) => refresh(...a), getMe: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() } }));
vi.mock('../api/axiosInstance', () => ({ setAccessToken: vi.fn(), default: {} }));

import { AuthProvider, useAuth } from './AuthContext';

function Probe() {
  const { user, isLoading } = useAuth();
  return <div id="out">{isLoading ? 'loading' : user ? `user:${user.name}` : 'anonymous'}</div>;
}

describe('AuthProvider session restore under StrictMode', () => {
  beforeEach(() => { refresh.mockReset(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

  it('fires exactly ONE refresh-token call (StrictMode double-effect must not double-rotate)', async () => {
    refresh.mockResolvedValue({ data: { data: { accessToken: 't', user: { name: 'Jaison' } } } });
    const el = document.createElement('div'); document.body.appendChild(el);
    await act(async () => { createRoot(el).render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>); });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(el.textContent).toBe('user:Jaison');
  });

  it('shows anonymous (not stuck loading) when there is no valid session', async () => {
    refresh.mockRejectedValue(new Error('401'));
    const el = document.createElement('div'); document.body.appendChild(el);
    await act(async () => { createRoot(el).render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>); });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(el.textContent).toBe('anonymous');
  });
});
