import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type MailleAriane = { label: string; href?: string | undefined };

/** Fil d'Ariane visible ; le balisage BreadcrumbList est injecté par le head() de la route. */
export function FilAriane({ items }: { items: MailleAriane[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {item.href ? (
              <Link to={item.href} className="hover:text-foreground hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
