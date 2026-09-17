// Rendu markdown minimal et sûr (aucun HTML brut injecté) : titres, paragraphes,
// listes à puces, tableaux et gras. Suffisant pour les articles du blog.
import type { ReactNode } from "react";

function enrichir(texte: string): ReactNode[] {
  const morceaux = texte.split(/(\*\*[^*]+\*\*)/g).filter((m) => m !== "");
  return morceaux.map((m, i) =>
    m.startsWith("**") && m.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {m.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{m}</span>
    ),
  );
}

const cellules = (ligne: string) =>
  ligne
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const estSeparateur = (ligne: string) => /^\|?[\s:-]+\|[\s:|-]*$/.test(ligne.trim());

export function Markdown({ contenu }: { contenu: string }) {
  const lignes = contenu.replace(/\r\n/g, "\n").split("\n");
  const blocs: ReactNode[] = [];
  let i = 0;
  let cle = 0;

  while (i < lignes.length) {
    const ligne = (lignes[i] ?? "").trim();

    if (!ligne) {
      i += 1;
      continue;
    }

    // Titres
    const titre = /^(#{2,4})\s+(.*)$/.exec(ligne);
    if (titre) {
      const niveau = (titre[1] as string).length;
      const texte = titre[2] as string;
      if (niveau === 2)
        blocs.push(
          <h2 key={cle++} className="mt-10 text-xl font-semibold sm:text-2xl">
            {texte}
          </h2>,
        );
      else if (niveau === 3)
        blocs.push(
          <h3 key={cle++} className="mt-8 text-lg font-semibold">
            {texte}
          </h3>,
        );
      else
        blocs.push(
          <h4 key={cle++} className="mt-6 font-semibold">
            {texte}
          </h4>,
        );
      i += 1;
      continue;
    }

    // Tableau
    if (ligne.startsWith("|")) {
      const brut: string[] = [];
      while (i < lignes.length && (lignes[i] ?? "").trim().startsWith("|")) {
        brut.push((lignes[i] as string).trim());
        i += 1;
      }
      const entete = cellules(brut[0] as string);
      const corps = brut.slice(1).filter((l) => !estSeparateur(l)).map(cellules);
      blocs.push(
        <div key={cle++} className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                {entete.map((c, n) => (
                  <th key={n} className="px-3 py-2 text-left font-semibold">
                    {enrichir(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corps.map((r, n) => (
                <tr key={n} className="border-t border-border align-top">
                  {r.map((c, m) => (
                    <td
                      key={m}
                      className={m === 0 ? "px-3 py-2 font-medium" : "px-3 py-2 text-muted-foreground"}
                    >
                      {enrichir(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Liste à puces
    if (/^[-*]\s+/.test(ligne)) {
      const items: string[] = [];
      while (i < lignes.length && /^[-*]\s+/.test((lignes[i] ?? "").trim())) {
        items.push((lignes[i] as string).trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocs.push(
        <ul key={cle++} className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          {items.map((t, n) => (
            <li key={n}>{enrichir(t)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraphe (les lignes consécutives sont regroupées)
    const paragraphe: string[] = [];
    while (i < lignes.length) {
      const l = (lignes[i] ?? "").trim();
      if (!l || l.startsWith("|") || /^#{2,4}\s/.test(l) || /^[-*]\s+/.test(l)) break;
      paragraphe.push(l);
      i += 1;
    }
    blocs.push(
      <p key={cle++} className="mt-4 leading-relaxed text-muted-foreground">
        {enrichir(paragraphe.join(" "))}
      </p>,
    );
  }

  return <div className="max-w-3xl">{blocs}</div>;
}
