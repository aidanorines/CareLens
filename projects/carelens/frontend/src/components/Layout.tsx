import type { PropsWithChildren } from "react";
import { ActivitySquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/20">
              <ActivitySquare className="h-5 w-5" />
            </div>
            <div>
              <Link to="/" className="text-xl font-semibold tracking-tight text-slate-950">
                CareLens
              </Link>
              <p className="text-xs text-slate-600 sm:text-sm">
                AI Patient Summary &amp; Risk Flagging Dashboard
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 md:block">
            {location.pathname === "/" ? "Patient Overview" : "Patient Dashboard"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
