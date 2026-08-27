import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen p-container-margin bg-background">
      <div className="text-center flex flex-col items-center gap-4 max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[40px]">
            search_off
          </span>
        </div>

        <p className="font-display-lg text-display-lg text-on-surface leading-none">
          404
        </p>

        <h1 className="font-title-lg text-title-lg text-on-surface">
          Page not found
        </h1>

        <p className="font-body-sm text-body-sm text-secondary">
          The page you&apos;re looking for doesn&apos;t exist, may have been moved,
          or the record you followed a link to has been deleted.
        </p>

        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Dashboard
          </Link>
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            View Clients
          </Link>
        </div>
      </div>
    </main>
  );
}
