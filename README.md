# La Quête du Futur Seigneur

Mini-jeu web mobile-first pour EVG médiéval.

## Lancer en local

```bash
npm install
npm run dev
```

## Tester

```bash
npm test
npm run build
```

## Configurer le jeu

Tout est modifiable dans l’app depuis l’écran de configuration :
- nom du futur marié ;
- participants ;
- durée ;
- intensité.

Les contenus de base sont dans `src/gameData.js` : rôles, quêtes, événements, fins.

## Déploiement

Le projet est compatible GitHub Pages via le workflow `.github/workflows/deploy.yml`.
