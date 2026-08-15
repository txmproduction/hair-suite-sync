import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Lien interne construit dynamiquement (métier, ville, département).
 * Rend un vrai <a href> dans le HTML servi, tout en gardant la navigation
 * client du routeur. Le chemin est calculé à l'exécution, d'où le cast.
 */
export function LienSeo({
  href,
  className,
  children,
}: {
  href: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Link to={href as never} className={className}>
      {children}
    </Link>
  );
}
