cat > /mnt/user-data/outputs/README.md << 'EOF'
# Workflow Manager - Pages d'Authentification

## 📁 Structure des fichiers

```
├── components/
│   ├── Navbar.tsx          # Barre de navigation avec logo et liens
│   └── Footer.tsx          # Footer avec liens et réseaux sociaux
│
└── app/
    ├── page.tsx            # Landing page complète
    └── auth/
        ├── register/
        │   └── page.tsx    # Page d'inscription avec sélection de plans
        ├── login/
        │   └── page.tsx    # Page de connexion
        └── forgot-password/
            └── page.tsx    # Page de récupération de mot de passe
```

## 🎯 Fonctionnalités implémentées

### Page d'inscription (/auth/register)

**Étape 1 : Sélection du plan**
- 3 plans disponibles : Free, Starter (populaire), Professional
- Design avec cards cliquables
- Badge "Populaire" sur le plan Starter
- Affichage des prix et fonctionnalités de chaque plan
- Récupération du plan depuis l'URL (?plan=starter)

**Étape 2 : Formulaire d'inscription**
- Résumé du plan sélectionné en haut
- Formulaire complet avec validation :
  - Prénom et Nom
  - Email professionnel
  - Mot de passe (min 8 caractères)
  - Confirmation du mot de passe
  - Entreprise (optionnel)
  - Taille de l'équipe (dropdown)
  - Checkbox CGU/Confidentialité
- Validation en temps réel
- Messages d'erreur clairs
- État de chargement pendant la soumission
- Badge "14 jours d'essai gratuit" pour plans payants
- Indicateur de sécurité (pas de CB requise)

### Page de connexion (/auth/login)

- Formulaire simple et épuré
- Email et mot de passe
- Checkbox "Se souvenir de moi"
- Lien "Mot de passe oublié"
- Boutons de connexion sociale (Google, GitHub)
- État de chargement
- Badge de sécurité SSL

### Page de récupération (/auth/forgot-password)

- Formulaire simple avec email uniquement
- Validation d'email
- Page de confirmation après envoi
- Instructions claires pour l'utilisateur
- Bouton pour renvoyer l'email
- Lien vers le support

## 🎨 Design Features

- **Responsive** : Adapté mobile, tablette et desktop
- **Validation** : Validation côté client en temps réel
- **UX** : Messages d'erreur clairs et positionnement stratégique
- **Loading states** : Spinners et états désactivés pendant les requêtes
- **Gradient backgrounds** : Dégradés bleu/indigo cohérents
- **Shadows & Hover** : Effets de profondeur et interactions
- **Accessibility** : Labels, autocomplete, focus states

## 🔧 Intégration

### 1. Installer Next.js (si pas déjà fait)
```bash
npx create-next-app@latest workflow-manager --typescript --tailwind --app
```

### 2. Copier les fichiers
- Placez `components/` à la racine du projet
- Placez les dossiers `app/` selon la structure indiquée

### 3. Configuration Next.js
Dans `next.config.js`, ajoutez si nécessaire :
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}
module.exports = nextConfig
```

### 4. Imports dans les composants
Assurez-vous que les paths sont corrects :
```typescript
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
```

### 5. Configuration Tailwind (déjà incluse)
Le projet utilise les classes Tailwind standard.

## 🚀 Prochaines étapes

### Backend à implémenter

1. **API d'authentification**
```typescript
// /app/api/auth/register/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // Créer l'utilisateur dans la base de données
  // Envoyer email de confirmation
  // Retourner JWT token
}
```

2. **API de connexion**
```typescript
// /app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  // Vérifier les credentials
  // Retourner JWT token
}
```

3. **API de reset password**
```typescript
// /app/api/auth/forgot-password/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  // Générer token de reset
  // Envoyer email avec lien
}
```

### Fonctionnalités additionnelles recommandées

- [ ] Authentification OAuth (Google, GitHub)
- [ ] Vérification d'email après inscription
- [ ] Système de sessions sécurisé
- [ ] Rate limiting sur les endpoints sensibles
- [ ] CAPTCHA sur le formulaire d'inscription
- [ ] Authentification à deux facteurs (2FA)
- [ ] Dashboard après connexion
- [ ] Gestion des abonnements Stripe
- [ ] Analytics des inscriptions

## 📊 Plans tarifaires

| Plan | Prix | Utilisateurs | Projets | Stockage |
|------|------|--------------|---------|----------|
| Free | 0€ | 3 | 3 | 500 MB |
| Starter | 12€/user/mois | Illimité | Illimité | 10 GB/user |
| Professional | 24€/user/mois | Illimité | Illimité | 50 GB/user |

## 🔐 Sécurité

- Validation côté client ET serveur (à implémenter côté serveur)
- Hashing des mots de passe (bcrypt recommandé)
- HTTPS obligatoire en production
- Protection CSRF
- Rate limiting
- Sanitization des inputs

## 💡 Notes importantes

1. Les appels API sont actuellement simulés avec `setTimeout`
2. Remplacez les `console.log` par de vrais appels API
3. Implémentez la gestion des erreurs serveur
4. Ajoutez la persistence des sessions
5. Configurez les redirections après authentification

## 🎨 Personnalisation

Pour modifier les couleurs, cherchez dans les fichiers :
- `blue-600` → Couleur principale
- `indigo-600` → Couleur secondaire
- `gray-900` → Texte principal

## 📞 Support

Pour toute question sur l'implémentation, consultez :
- Documentation Next.js : https://nextjs.org/docs
- Documentation Tailwind : https://tailwindcss.com/docs
- Documentation TypeScript : https://www.typescriptlang.org/docs
EOF