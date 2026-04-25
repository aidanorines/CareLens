import type { PropsWithChildren } from "react";
import { ActivitySquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
              <ActivitySquare className="h-6 w-6" />
            </div>
            <div>
              <Link to="/" className="text-2xl font-semibold tracking-tight text-slate-950">
                CareLens
              </Link>
              <p className="text-sm text-slate-600">
                AI Patient Summary &amp; Risk Flagging Dashboard
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block">
            {location.pathname === "/" ? "Patient Overview" : "Patient Dashboard"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
