# Projet Quiz – Moniteur, Joueurs, Hôte

## Présentation
Application de quiz en temps réel avec buzzer, affichage des questions, classement dynamique et gestion des égalités (tie-break). Trois interfaces principales : Moniteur (affichage public), Joueur (participation), Hôte (pilotage).

## Objectifs
- Expérience fluide et lisible sur grand écran (Moniteur).
- Interaction rapide et fiable via buzzer côté Joueur.
- Contrôle complet du déroulé côté Hôte (questions, manche, démarrage/arrêt, tie-break).
- Gestion des égalités et qualification par manche.

## Périmètre actuel
- Affichage des questions et valeurs (+5 / +10) sur le Moniteur.
- Classement des joueurs avec état (en attente, bloqué, etc.).
- Détection d’égalité et lancement de tie-break avec affichage dédié.
- Écrans de fin de manche côté Joueur (qualifié/éliminé, messages dynamiques).

## Stack technique
- Frontend: React + Vite + TypeScript + TailwindCSS
- Icônes: `lucide-react`
- Backend: Node.js (server WebSocket/Socket.io)
- Outils: ESLint, PostCSS, Tailwind

## Structure des dossiers (simplifiée)
```
/ (racine)
├── server.js            # Serveur temps réel (WS)
├── src/                 # Frontend React
│   ├── components/
│   │   ├── MonitorInterface.tsx
│   │   ├── PlayerInterface.tsx
│   │   └── HostInterface.tsx
│   ├── hooks/useGame.ts
│   ├── contexts/SocketContext.tsx
│   ├── types/game.ts
│   └── index.css
├── public/sounds/       # SFX (buzzer/correct/incorrect)
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Démarrage rapide
Prérequis: Node.js ≥ 18, npm.

1. Installer les dépendances:
   ```bash
   npm install
   ```
2. Lancer le frontend (Vite):
   ```bash
   npm run dev
   # URL: http://localhost:5173/
   ```
3. Lancer le serveur temps réel:
   ```bash
   node server.js
   ```

Conseil: Ouvrir deux terminaux (frontend + backend) pour le développement.

## Interfaces
- Moniteur
  - En-tête: statut, manche, code de salle.
  - Question: texte + valeur, indication du joueur qui a buzzé.
  - Classement: points et état des joueurs.
  - Tie-break: badge « Ex aequo » dans l’en-tête + liste des candidats.
- Joueur
  - Buzzer, réponse, feedback (correct/incorrect), écran de fin de manche.
- Hôte
  - Démarrage/arrêt, sélection de questions, gestion des manches et tie-break.

## Fonctionnalités clés
- États de jeu (exemples) : `waiting`, `started`, `buzzer_active`, `answering`, `finished`.
- Tie-break : déclenché quand plusieurs joueurs sont à égalité pour des places à pourvoir.
- Classement : dynamique par manche, avec affichage du score et état.

## Changements récents (UI)
- Moniteur: affichage « Ex aequo » déplacé dans l’en-tête, suppression du panneau latéral pour éviter le scroll.
- Joueur: correction de structure JSX en fin de manche, messages dynamiques (qualifié/éliminé, final).

## Scripts utiles
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Qualité & conventions
- TypeScript strict sur les types partagés (`src/types/game.ts`).
- UI : Tailwind, composants accessibles et responsifs.
- Lint : respecter les règles ESLint configurées.

## Roadmap (suggestions)
- Accessibilité renforcée (focus management, ARIA).
- Amélioration tie-break: badge responsif, ellipsis sur noms longs.
- Paramétrage des valeurs de questions par manche.
- Écrans de fin: variantes thématiques et animations légères.
- Persistance des scores et historique (optionnel).

## Déploiement
- Vercel (frontend) ou tout hébergeur statique + serveur Node pour WS.
- Variables d’environnement à définir si nécessaire (non critique pour le mode local).

## Licence
À définir selon les besoins du projet.