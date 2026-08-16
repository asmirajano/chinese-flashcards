# Chinese Flashcards

Two static Chinese-learning applications are published from this repository:

- `/` — 100 sentence flashcards (`index.html`)
- `/rules.html` — grammar rules (`rules.html`)

GitHub Pages continues to serve the root files. Firebase Hosting is built into
`public/`, which is generated and never committed.

## Local validation

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:dist
```

## Deployment

The production workflow deploys the verified `public/` directory to Firebase
Hosting project `chinese-flashcards-6e922`. It requires the GitHub Actions
secret `FIREBASE_SERVICE_ACCOUNT`.

Firestore rules are versioned in this repository but are deliberately not
deployed by the Hosting workflow. Hosting and persistent data authorization
remain separate release scopes.
