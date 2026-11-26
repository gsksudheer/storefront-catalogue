import { vi } from 'vitest';
import { ApiError, apiFetch } from './client';

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 })));
    await expect(apiFetch('/x')).resolves.toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/x', expect.anything());
  });

  it('throws ApiError with the backend error code and field details', async () => {
    const body = { error: { code: 'VALIDATION_ERROR', message: 'Bad', details: [{ field: 'email', message: 'x' }] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 400 })));
    const err = await apiFetch('/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', details: [{ field: 'email', message: 'x' }] });
  });

  it('turns network failures into a friendly NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('handles non-JSON error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 })));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 502, code: 'UNKNOWN' });
  });
});
