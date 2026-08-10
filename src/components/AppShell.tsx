import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { contexteQuery } from "@/lib/hairtrack";
import logo from "@/assets/logo-light.png";
import { LogOut } from "lucide-react";
import { estSuperAdminFn } from "@/lib/superadmin.functions";

export function useContexte() {
  return useQuery(contexteQuery);
}

const LIENS = [
  { to: "/agenda", label: "Agenda", gerant: false },
  { to: "/caisse", label: "Caisse", gerant: false },
  { to: "/clients", label: "Clients", gerant: false },
  { to: "/statistiques", label: "Statistiques", gerant: false },
  { to: "/admin", label: "Admin", gerant: true },
] as const;

export function AppShell({
  children,
  titre,
  action,
}: {
  children: ReactNode;
  titre?: string;
  action?: ReactNode;
}) {
  const { data, isLoading } = useContexte();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const gerant = data?.employe?.role === "gerant";
  const { data: acces } = useQuery({
    queryKey: ["super-admin"],
    queryFn: () => estSuperAdminFn(),
    enabled: !!data,
  });

  if (
    !isLoading &&
    data &&
    !data.employe &&
    pathname !== "/bienvenue" &&
    pathname !== "/super-admin"
  ) {
    navigate({ to: "/bienvenue", replace: true });
  }

  async function deconnexion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src={logo} alt="HairTrack" className="h-7 w-auto" />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {data?.salon?.nom}
            </span>
            <button
              onClick={deconnexion}
              aria-label="Se déconnecter"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {[
            ...LIENS.filter((l) => !l.gerant || gerant),
            ...(acces?.superAdmin
              ? [{ to: "/super-admin", label: "Super-admin", gerant: false } as const]
              : []),
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary data-[status=active]:bg-gold-soft data-[status=active]:text-gold-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        {(titre || action) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {titre && <h1 className="text-2xl font-semibold">{titre}</h1>}
            {action}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
