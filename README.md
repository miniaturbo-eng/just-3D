# JUST3D

Site web minimal pour **JUST3D**, entreprise de vente d'impression 3D :

- Catalogue de produits (ajout via le bouton « + Ajouter un produit »)
- Assistant chat propulsé par l'API Mistral (`mistral-small-latest`) via le SDK TypeScript officiel
- La clé `MISTRAL_API_KEY` reste uniquement sur le serveur (jamais exposée au navigateur)
- Impression 3D personnalisée : contact par email (lien `mailto:` dans le pied de page)

## Configuration (optionnelle)

Le site fonctionne **sans aucune clé API**. Dans ce cas :

- le catalogue de produits et le contact par email sont pleinement opérationnels,
- l'assistant chat affiche un message de repli invitant à contacter par email.

Pour activer l'assistant intelligent, renseignez la clé dans `.env` :

```
MISTRAL_API_KEY=votre_cle_api_mistral
CONTACT_EMAIL=contact@just3d.fr
PORT=3000
```

## Lancement local

```bash
npm start
```

Puis ouvrez http://localhost:3000

Mode développement (rechargement automatique du serveur) :

```bash
npm run dev
```

## Structure

- `server.js` — serveur Express : API chat (`/api/chat`), produits (`/api/products`), fichiers statiques
- `public/` — interface (chat, catalogue, formulaire d'ajout de produit, contact email)
- `data/products.json` — produits enregistrés (créé automatiquement, ignoré par git)
