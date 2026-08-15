# SEO technique HairTrack — plan d'implémentation

## Point le plus critique : le rendu (section 2)

Bonne nouvelle : c'est déjà réglé. HairTrack tourne sur TanStack Start avec **rendu serveur (SSR) à la volée** — le HTML renvoyé au premier octet contient déjà title, meta, h1, texte et liste des salons, lus en base côté serveur. C'est l'option 2 de ta liste, et c'est le bon choix ici :

- Le SSG au build est inadapté : l'annuaire bouge en continu (nouvelles fiches, avis, prix) et un pré-rendu de milliers de pages ferait dépasser les limites de publication.
- Le prerendering ciblé bots est à éviter (risque de cloaking, contenu divergent).

À ajouter côté rendu : cache HTTP (`Cache-Control: public, s-maxage=..., stale-while-revalidate`) sur les pages d'annuaire, pour tenir le TTFB sous 600 ms.

## Ce qui existe déjà

- `/{metier}/{ville}` avec meta, canonical, og:* dynamiques.
- `/salon/{slug}`, `/recherche`, sitemap dynamique en base, robots.txt.
- Footer avec liens métier × ville réels (balises `a` via Link).

## Ce que je vais construire

### 1. URLs et redirections
- Nouvelles routes : `/{metier}` (catégorie nationale), `/{metier}/{departement}`, `/villes`, `/metiers`, pagination `/{metier}/{ville}/page-2`.
- Normalisation des slugs (accents, apostrophes, majuscules) et redirection 301 vers la forme canonique (minuscules, sans slash final, sans doubles tirets).
- Table `redirections` en base (ancien chemin → nouveau, 301) consultée avant le 404.
- Distinction ville / département sur le 2e segment via une table de référence des départements (métropole + Martinique) rattachée aux codes postaux des fiches.

### 2. Meta par page
- Titres/descriptions selon tes gabarits, avec le nombre réel de pros injecté.
- `noindex, follow` automatique sous 3 professionnels.
- og:image dédiée 1200×630, og:locale, og:site_name, twitter:card, geo.region / geo.placename sur les pages localisées, `lang="fr"`.

### 3. Contenu unique (anti-duplicate)
Bloc éditorial de 250-400 mots généré à partir des données réelles de la ville : nombre de pros, fourchette de prix, note moyenne et nombre d'avis, prestations les plus fréquentes, ouverture le samedi/dimanche, communes limitrophes. 5 variantes de tournure par paragraphe, tirage déterministe par hash du slug (stable dans le temps).
Plus : bloc « Villes à proximité » (6-10 villes calculées par distance sur les coordonnées en base) et « Autres prestations à {Ville} ».

### 4. Données structurées JSON-LD (rendues côté serveur)
- Fiche pro : `HairSalon` / `BeautySalon` / `DaySpa` / `HealthAndBeautyBusiness` selon le métier, avec adresse, geo, téléphone, priceRange, horaires, `hasOfferCatalog` des prestations, et `aggregateRating` / `review` **uniquement si des avis réels existent**.
- Page métier × ville : `CollectionPage` + `ItemList` des pros + `BreadcrumbList`.
- Sitewide : `Organization` (logo, sameAs Instagram) + `WebSite` avec `SearchAction` vers `/recherche?q=`.

### 5. Maillage interne
Fil d'Ariane visible et balisé partout, liens croisés fiche → ville → métier → département, index `/villes` (groupé par département, paginé) et `/metiers` (20 plus grandes villes par métier), footer enrichi (métiers + 30 plus grandes villes). Tous en liens réels dans le HTML, sans nofollow interne.

### 6. Sitemaps et robots.txt
`/sitemap.xml` en index, plus `sitemap-pages.xml`, `sitemap-metiers.xml`, `sitemap-villes-{n}.xml`, `sitemap-salons-{n}.xml` (lots de 50 000), avec priority/changefreq cohérents, et exclusion stricte des pages `noindex` ou trop pauvres. robots.txt mis à jour selon ton bloc (en conservant les règles utiles déjà présentes).

### 7. Pagination
Au-delà de 20 pros par page ville : URLs `/page-2`, canonical auto-référent, pages suivantes en `index, follow`, liens prev/next.

## Deux points où je m'écarte de ta demande

1. **`/salon/{slug}-{ville}`** : les fiches sont aujourd'hui en `/salon/{slug}` et déjà dans le sitemap. Je garde `/salon/{slug}` comme URL canonique et je m'assure que les nouveaux slugs intègrent la ville quand il y a homonymie — changer toutes les URLs existantes ne rapporte rien et fait perdre l'historique d'indexation. Si tu préfères la migration complète, je le fais avec 301 depuis les anciennes URLs.
2. **`FAQPage` en JSON-LD** : Google a retiré ce rich result pour les sites non institutionnels ; le baliser n'apporte plus de gain et ajoute du risque. Je garde le **bloc FAQ visible** (utile pour le contenu et les requêtes longue traîne) mais sans balisage `FAQPage`.

Le `lastmod` des sitemaps ne sera renseigné que là où la base fournit une vraie date de mise à jour de la page ; ailleurs il est omis plutôt qu'inventé (une date de génération fait perdre la confiance de Google).

## Ordre de livraison

1. Fondations : slugs/redirections 301, départements, cache HTTP, robots.txt, sitemaps découpés.
2. Pages : `/{metier}`, `/{metier}/{departement}`, `/villes`, `/metiers`, pagination.
3. Contenu unique + FAQ + blocs de maillage sur les pages ville.
4. JSON-LD complet + fil d'Ariane + meta/noindex conditionnel.
