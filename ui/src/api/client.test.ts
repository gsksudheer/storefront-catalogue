import { afterEach, vi } from 'vitest';
import { ApiError, apiFetch } from './client';

afterEach(() => vi.restoreAllMocks());

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    await expect(apiFetch('/x')).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/x', expect.anything());
  });

  it('throws ApiError with the backend error code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'nope' } }), { status: 404 }),
    );
    await expect(apiFetch('/x')).rejects.toMatchObject(new ApiError(404, 'NOT_FOUND', 'nope'));
  });
});
