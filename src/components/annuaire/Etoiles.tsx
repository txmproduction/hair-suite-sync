import { Star } from "lucide-react";

export function Etoiles({ note, taille = 14 }: { note: number; taille?: number | undefined }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: taille, height: taille }}
          className={i <= Math.round(note) ? "fill-gold text-gold" : "text-border"}
        />
      ))}
    </span>
  );
}

export function NoteSalon({
  note,
  nbAvis,
  noteGoogle,
  nbAvisGoogle,
  className,
}: {
  note: number | null;
  nbAvis: number;
  noteGoogle?: number | null | undefined;
  nbAvisGoogle?: number | null | undefined;
  className?: string | undefined;
}) {
  if (note && nbAvis)
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm ${className ?? ""}`}>
        <Etoiles note={note} />
        <span className="font-medium">{note.toFixed(1)}</span>
        <span className="text-muted-foreground">({nbAvis} avis)</span>
      </span>
    );
  if (noteGoogle && nbAvisGoogle)
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm ${className ?? ""}`}>
        <Etoiles note={noteGoogle} />
        <span className="font-medium">{noteGoogle.toFixed(1)}</span>
        <span className="text-muted-foreground">({nbAvisGoogle} avis Google)</span>
      </span>
    );
  return <span className={`text-sm text-muted-foreground ${className ?? ""}`}>Nouveau</span>;
}
