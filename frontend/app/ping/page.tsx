'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ApiResult } from '@shared/types';

export default function PingPage() {
  const [result, setResult] = useState<ApiResult<{ time: string }> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function checkPing() {
      setLoading(true);
      const res = await api.call('ping', {});
      if (mounted) {
        setResult(res);
        setLoading(false);
      }
    }
    checkPing();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          SchedNexa Wiring Smoke Test
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Testing RPC transport via <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">api.call(&apos;ping&apos;, &#123;&#125;)</code>
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Response Status
          </div>
          {loading ? (
            <div className="mt-2 text-sm text-muted-foreground animate-pulse">
              Calling ping endpoint...
            </div>
          ) : result?.ok ? (
            <div className="mt-2 space-y-2">
              <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                OK: {JSON.stringify(result.ok)}
              </div>
              <div className="font-mono text-xs text-foreground break-all">
                Server Time: {result.data.time}
              </div>
              <div className="mt-3 rounded bg-muted p-2 font-mono text-xs">
                {JSON.stringify(result.data, null, 2)}
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                Failed
              </div>
              <div className="text-xs text-red-600 font-mono">
                Error: {result?.error || 'Unknown failure'}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Mode: {process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'Mock (NEXT_PUBLIC_USE_MOCK=true)' : 'Real RPC'}</span>
          <button
            onClick={async () => {
              setLoading(true);
              const res = await api.call('ping', {});
              setResult(res);
              setLoading(false);
            }}
            className="rounded bg-primary px-3 py-1 font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Re-ping
          </button>
        </div>
      </div>
    </main>
  );
}
