import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/categories";
import {
  articlesAdminFn,
  enregistrerArticleFn,
  supprimerArticleFn,
} from "@/lib/superadmin.functions";
import type { ArticleBlog } from "@/lib/blog-types";

type Formulaire = {
  id: string | null;
  slug: string;
  titre: string;
  extrait: string;
  contenu: string;
  categorie_metier: string;
  image_couverture_url: string;
  statut: "brouillon" | "publie";
};

const VIDE: Formulaire = {
  id: null,
  slug: "",
  titre: "",
  extrait: "",
  contenu: "",
  categorie_metier: "",
  image_couverture_url: "",
  statut: "brouillon",
};

export function BlocBlog({ autorise }: { autorise: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Formulaire>(VIDE);

  const { data: articles } = useQuery({
    queryKey: ["articles-blog-admin"],
    enabled: autorise,
    queryFn: () => articlesAdminFn(),
  });

  const enregistrer = useMutation({
    mutationFn: () =>
      enregistrerArticleFn({
        data: {
          id: form.id,
          slug: form.slug || form.titre,
          titre: form.titre,
          extrait: form.extrait,
          contenu: form.contenu,
          categorie_metier: form.categorie_metier || null,
          image_couverture_url: form.image_couverture_url || null,
          statut: form.statut,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Article mis à jour." : "Article créé.");
      setForm(VIDE);
      queryClient.invalidateQueries({ queryKey: ["articles-blog-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supprimer = useMutation({
    mutationFn: (id: string) => supprimerArticleFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Article supprimé.");
      queryClient.invalidateQueries({ queryKey: ["articles-blog-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editer = (a: ArticleBlog) =>
    setForm({
      id: a.id,
      slug: a.slug,
      titre: a.titre,
      extrait: a.extrait,
      contenu: a.contenu,
      categorie_metier: a.categorie_metier ?? "",
      image_couverture_url: a.image_couverture_url ?? "",
      statut: a.statut,
    });

  return (
    <section className="card-soft mt-5 p-5">
      <h2 className="text-lg font-semibold">Blog</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rédaction en markdown (titres ##, listes -, tableaux |, gras **). Un article passe en ligne
        dès qu'il est enregistré avec le statut « Publié ».
      </p>

      <div className="mt-4 grid gap-3 lg:max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="article-titre">Titre</Label>
            <Input
              id="article-titre"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="article-slug">Adresse (slug)</Label>
            <Input
              id="article-slug"
              placeholder="mon-article"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="article-extrait">Extrait (utilisé comme description)</Label>
          <Textarea
            id="article-extrait"
            rows={3}
            value={form.extrait}
            onChange={(e) => setForm({ ...form, extrait: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="article-contenu">Contenu (markdown)</Label>
          <Textarea
            id="article-contenu"
            rows={14}
            className="font-mono text-xs"
            value={form.contenu}
            onChange={(e) => setForm({ ...form, contenu: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="article-metier">Métier lié</Label>
            <select
              id="article-metier"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={form.categorie_metier}
              onChange={(e) => setForm({ ...form, categorie_metier: e.target.value })}
            >
              <option value="">Aucun</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="article-image">Image de couverture (URL)</Label>
            <Input
              id="article-image"
              value={form.image_couverture_url}
              onChange={(e) => setForm({ ...form, image_couverture_url: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="article-statut">Statut</Label>
            <select
              id="article-statut"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={form.statut}
              onChange={(e) =>
                setForm({ ...form, statut: e.target.value as "brouillon" | "publie" })
              }
            >
              <option value="brouillon">Brouillon</option>
              <option value="publie">Publié</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button disabled={enregistrer.isPending} onClick={() => enregistrer.mutate()}>
            {form.id ? "Enregistrer les modifications" : "Créer l'article"}
          </Button>
          {form.id && (
            <Button variant="ghost" onClick={() => setForm(VIDE)}>
              Nouvel article
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2">Titre</th>
              <th className="py-2">Métier</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Publié le</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(articles ?? []).map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="py-2">
                  <a href={`/blog/${a.slug}`} className="hover:underline">
                    {a.titre}
                  </a>
                </td>
                <td className="py-2 text-muted-foreground">{a.categorie_metier ?? "—"}</td>
                <td className="py-2">{a.statut === "publie" ? "Publié" : "Brouillon"}</td>
                <td className="py-2 text-muted-foreground">
                  {new Date(a.date_publication).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editer(a)}>
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={supprimer.isPending}
                      onClick={() => supprimer.mutate(a.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!articles?.length && (
              <tr>
                <td colSpan={5} className="py-4 text-muted-foreground">
                  Aucun article pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
