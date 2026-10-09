import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          SchedNexa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Do not let a cancelled lecture become a wasted academic hour.
        </p>
        <div className="mt-6">
          <Link
            href="/ping"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            Go to Ping Verification Page
          </Link>
        </div>
      </div>
    </main>
  );
}
