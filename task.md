# Transfert — Tâches réalisées et planifiées

## Fait
- Audit du flux "Afficher la Question" côté front et back.
- Fichiers examinés: `src/hooks/useGame.ts`, `server.js`, `src/components/HostInterface.tsx`, `src/App.tsx`, `src/components/PlayerInterface.tsx`, `src/contexts/SocketContext.tsx`.
- Vérification du câblage des callbacks (`onShowQuestionToAll`, etc.) et rendu conditionnel par `gameState.role`/`gameState.gameStatus`.
- Analyse de la création/initialisation de salle côté serveur (`gameState = 'waiting'`, `currentQuestion = 0`).
- Observation des logs: aucun événement `show-question-to-all` reçu après clic; confirmation via tunnel qu’aucun trafic Socket n’arrive.
- Hypothèse clé: le `socket.id` de l’hôte change après un rafraîchissement d’onglet, rendant l’action non autorisée par la vérification `room.host.id === socket.id`.
- Vérification des assets audio: présents dans `public/sounds` (`buzzer.mp3`, `correct.mp3`, `incorrect.mp3`).
- Correction Vercel: conversion de `rewrites` → `routes` avec `{ handle: 'filesystem' }` avant fallback SPA, pour éviter les 404 d’assets.
  - Ancien: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - Nouveau: `{ "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/index.html" }] }`
- Création du document `project.dm` (démarrage local, déploiement Vercel, `VITE_SOCKET_URL`, flux des événements, arborescence utile).
- Rédaction d’instructions courtes pour le redéploiement (Git, Dashboard Vercel, CLI).

## À faire (priorités)
- Redéployer le frontend sur Vercel et vérifier `https://<domaine>/sounds/buzzer.mp3` (pas de 404).
- Définir `VITE_SOCKET_URL` sur Vercel vers l’URL publique du backend Socket (tunnel ou hébergeur), puis redeploy.
- Créer une nouvelle salle en tant qu’hôte (ne pas rafraîchir l’onglet), cliquer "Afficher la Question" et confirmer:
  - Présence des logs backend correspondant à `show-question-to-all`/`question-displayed`.
  - Affichage de la question côté joueur.
- Valider le flux complet: activer le buzzer, buzzer côté joueur, soumission de réponse, résultats, question suivante.
- Optionnel: Héberger le backend sur Render/Railway pour une URL stable; mettre à jour `VITE_SOCKET_URL` et supprimer le tunnel.
- Optionnel: Améliorer la robustesse serveur pour reconnexion hôte (ex: token/session d’hôte) afin d’éviter l’invalidation après refresh.
- Optionnel: Ajouter des logs explicites "non autorisé" pour `show-question-to-all` quand `socket.id` ≠ `room.host.id` (diagnostic plus rapide).

## Critères de validation
- Les assets audio se chargent en production.
- L’événement "Afficher la Question" est reçu et journalisé côté backend.
- La question s’affiche chez les joueurs sans erreur.
- Le flux complet (buzzer → réponse → résultats → question suivante) fonctionne.

## Références
- Config déploiement: `vercel.json` (routes filesystem + fallback SPA).
- URL Socket côté frontend: `src/contexts/SocketContext.tsx` (utilise `import.meta.env.VITE_SOCKET_URL`).
- Logique client: `src/hooks/useGame.ts`.
- UI hôte/joueur: `src/components/HostInterface.tsx`, `src/components/PlayerInterface.tsx`.
- Logique serveur et salles: `server.js`.
- Assets: `public/sounds/`.