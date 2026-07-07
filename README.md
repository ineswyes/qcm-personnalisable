# QCM Personnalisable

Application web pour poser une question à choix multiples avec des cases
entièrement personnalisables, et un mode **défilement case par case** piloté
par un contacteur (accessibilité / CAA).

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (par défaut http://localhost:5173).

## Fonctionnement

### Mode Jeu

- Affiche la question et les cases de réponse.
- Cliquer directement sur une case la sélectionne.
- Le bouton **Démarrer le défilement** lance un balayage automatique : les
  cases s'illuminent l'une après l'autre.
- Pendant le défilement, appuyer sur **Espace**, **Entrée**, ou cliquer sur le
  bouton **Contacteur** valide la case actuellement en surbrillance et arrête
  le défilement (comportement compatible avec la plupart des contacteurs
  externes/Bluetooth, qui émulent une touche clavier ou un clic).
- Le réglage « Déclencheur du contacteur » (dans Réglages) permet de passer
  en mode « n'importe quelle touche » si votre contacteur envoie une autre
  touche que Espace/Entrée.

### Réglages

- Modifier le texte de la question.
- Régler la vitesse de défilement (ms par case) et le déclencheur.
- Pour chaque case : texte, couleur de fond, couleur du texte, taille du
  texte.
- Ajouter ou supprimer des cases (minimum 2).
- La configuration est sauvegardée automatiquement dans le navigateur
  (localStorage).
- **Exporter** télécharge la configuration actuelle en fichier `.json`,
  réutilisable via **Importer un fichier**.
- **Réinitialiser** revient à la configuration par défaut (4 cases).

## Stack

React + TypeScript + Vite.
