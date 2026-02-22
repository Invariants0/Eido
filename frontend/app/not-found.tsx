import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
      <h1 className="text-4xl font-bold font-mono text-primary">404</h1>
      <p className="text-muted-foreground">Signal Lost. Eido cannot find this sector.</p>
      <Link href="/" className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors text-sm">
        Return to Factory
      </Link>
    </div>
  );
}
