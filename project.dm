Projet: Génie en Herbe — Documentation rapide

Résumé
- Application de quiz en temps réel (React + Vite) avec Socket.io et backend Node.js.
- Cible: jeu multi-joueurs, contrôles hôte, buzzer, affichage des questions.

Stack
- Frontend: React 18, Vite 5, TailwindCSS.
- Backend: Node.js, Socket.io (fichier `server.js`).
- Déploiement: Vercel (frontend). Backend public via LocalTunnel/Render/Railway.

Démarrage local
- Prérequis: Node 18+ et npm.
- Installer les dépendances: `npm install`
- Lancer le frontend: `npm run dev`
- Lancer le backend Socket: `node server.js`
- Accès local: `http://localhost:5173`

Variables d’environnement
- `VITE_SOCKET_URL`: URL publique du serveur Socket.io utilisée par le frontend en production.
  - Exemple: `https://votre-tunnel.loca.lt` ou votre domaine Render/Railway.

Déploiement Vercel (frontend)
- Fichier `vercel.json` configure les routes: d’abord `handle: filesystem` pour servir les assets, puis fallback SPA vers `index.html`.
- Méthodes:
  - Push Git (branche `main`) pour un déploiement automatique.
  - Dashboard Vercel > Deployments > Redeploy.
  - CLI: `vercel --prod`.
- Vérification post-déploiement: `https://<domaine>/sounds/buzzer.mp3` doit se charger sans 404.
- Définir `VITE_SOCKET_URL` dans Vercel > Project > Settings > Environment Variables (Production + Preview).

Flux “Afficher la Question” (résumé)
- Émission: le frontend envoie `show-question-to-all` (via `useGame.ts`).
- Autorisation: le serveur vérifie que `room.host.id === socket.id`.
- Diffusion: le serveur émet `question-displayed` aux joueurs.
- Attention: rafraîchir l’onglet hôte change le `socket.id` → recréer la salle si nécessaire.

Arborescence utile
- `src/components/HostInterface.tsx` et `PlayerInterface.tsx`: UI hôte et joueur.
- `src/hooks/useGame.ts`: actions et gestion Socket côté client.
- `src/contexts/SocketContext.tsx`: connexion Socket.io (utilise `VITE_SOCKET_URL`).
- `server.js`: logique des salles et événements Socket côté serveur.
- `public/sounds/`: assets audio (`buzzer.mp3`, `correct.mp3`, `incorrect.mp3`).

Checks rapides
- Créer une salle, rejoindre, démarrer, cliquer “Afficher la Question”; vérifier affichage côté joueur.
- Activer le buzzer, buzzer côté joueur, répondre, voir les résultats, passer à la suivante.

Notes
- Si assets 404 en prod: vérifier `vercel.json` et redeployer.
- En prod: toujours définir `VITE_SOCKET_URL` vers un backend public accessible.