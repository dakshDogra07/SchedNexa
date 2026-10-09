import type {
  ApiFunctionName,
  ApiInput,
  ApiOutput,
  ApiResult,
} from '@shared/types';
import { mockHandlers } from '@/mock';

/**
 * Typed client API caller matching ApiContract.
 * If NEXT_PUBLIC_USE_MOCK is true, answers directly from frontend/mock.
 * Otherwise, sends a POST to /api/rpc/[fn].
 * Never throws; always returns ApiResult<T>.
 */
export const api = {
  call: async <K extends ApiFunctionName>(
    fn: K,
    input: ApiInput<K>
  ): Promise<ApiResult<ApiOutput<K>>> => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

    if (useMock) {
      try {
        const handler = mockHandlers[fn];
        if (!handler) {
          return { ok: false, error: `Mock handler not implemented for '${fn}'` };
        }
        return (await handler(input)) as ApiResult<ApiOutput<K>>;
      } catch (err: unknown) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown mock execution error',
        };
      }
    }

    try {
      const response = await fetch(`/api/rpc/${fn}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false,
          error: `RPC transport error (${response.status}): ${errorText}`,
        };
      }

      const data = (await response.json()) as ApiResult<ApiOutput<K>>;
      return data;
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network request failed',
      };
    }
  },
};
