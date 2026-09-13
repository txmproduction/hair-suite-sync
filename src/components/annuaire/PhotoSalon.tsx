import { useState } from "react";
import { Scissors } from "lucide-react";
import { imageOptimisee } from "@/lib/categories";

/**
 * Photo de salon avec repli élégant : si l'image est absente ou ne charge pas,
 * on affiche un visuel maison (fond clair, ciseaux dorés) — jamais le texte alt brut.
 */
export function PhotoSalon({
  url,
  alt,
  largeur = 640,
  className = "",
  priorite = false,
  onClick,
}: {
  url: string | null | undefined;
  alt: string;
  largeur?: number;
  className?: string;
  priorite?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
}) {
  const [erreur, setErreur] = useState(false);

  if (!url || erreur)
    return (
      <div
        className={`flex items-center justify-center bg-secondary ${className}`}
        aria-label={alt}
        role="img"
        onClick={onClick}
      >
        <Scissors className="h-1/4 max-h-12 w-auto text-gold/40" strokeWidth={1.5} />
      </div>
    );

  const petite = Math.round(largeur / 2);
  const src = imageOptimisee(url, largeur);
  const srcPetite = imageOptimisee(url, petite);
  const adaptatif = srcPetite !== src;

  return (
    <img
      src={src}
      {...(adaptatif
        ? {
            srcSet: `${srcPetite} ${petite}w, ${src} ${largeur}w`,
            sizes: `(max-width: 640px) 100vw, ${largeur}px`,
          }
        : {})}
      alt={alt}
      loading={priorite ? "eager" : "lazy"}
      decoding="async"
      onError={() => setErreur(true)}
      onClick={onClick}
      className={className}
    />
  );
}
