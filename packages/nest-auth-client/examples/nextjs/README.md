# Exemples Next.js pour nest-auth-client

Ce dossier contient des exemples de composants React/Next.js pour intégrer `@devlab-io/nest-auth-client` dans votre application.

## Fichiers disponibles

### Configuration

- **`AuthProvider.tsx`** - Provider React pour initialiser le client et gérer l'état d'authentification
- **`Navigation.tsx`** - Composant de navigation avec menu profil utilisateur

### Pages d'authentification

- **`SignInPage.tsx`** - Page de connexion
- **`SignUpPage.tsx`** - Page d'inscription

### Pages d'actions (tokens)

Ces pages doivent correspondre aux routes configurées dans votre backend (`AUTH_ACTION_*_ROUTE`).

- **`ResetPasswordPage.tsx`** - Page de réinitialisation de mot de passe
  - Route configurée : `AUTH_ACTION_RESET_PASSWORD_ROUTE=auth/reset-password`
  - Endpoint API : `POST /auth/accept-reset-password`

- **`AcceptInvitationPage.tsx`** - Page d'acceptation d'invitation
  - Route configurée : `AUTH_ACTION_INVITE_ROUTE=auth/accept-invitation`
  - Endpoint API : `POST /auth/accept-invitation`

- **`ValidateEmailPage.tsx`** - Page de validation d'email
  - Route configurée : `AUTH_ACTION_VALIDATE_EMAIL_ROUTE=auth/validate-email`
  - Endpoint API : `POST /auth/accept-email-validation`

- **`AcceptTermsPage.tsx`** - Page d'acceptation des conditions d'utilisation
  - Route configurée : `AUTH_ACTION_ACCEPT_TERMS_ROUTE=auth/accept-terms`
  - Endpoint API : `POST /auth/accept-terms`

- **`AcceptPrivacyPolicyPage.tsx`** - Page d'acceptation de la politique de confidentialité
  - Route configurée : `AUTH_ACTION_ACCEPT_PRIVACY_POLICY_ROUTE=auth/accept-privacy-policy`
  - Endpoint API : `POST /auth/accept-privacy-policy`

- **`ChangePasswordPage.tsx`** - Page de changement de mot de passe
  - Route configurée : `AUTH_ACTION_CHANGE_PASSWORD_ROUTE=auth/change-password`
  - Endpoint API : `POST /auth/accept-change-password`

## Utilisation

### 1. Configuration initiale

Intégrez le `AuthProvider` dans votre layout :

```typescript
// app/layout.tsx
import { AuthProvider } from './providers/auth-provider';
import { Navigation } from './components/navigation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Créer les routes

Créez les pages correspondantes dans votre application Next.js :

```
app/
├── auth/
│   ├── sign-in/
│   │   └── page.tsx          # Utilise SignInPage.tsx
│   ├── sign-up/
│   │   └── page.tsx          # Utilise SignUpPage.tsx
│   ├── reset-password/
│   │   └── page.tsx          # Utilise ResetPasswordPage.tsx
│   ├── accept-invitation/
│   │   └── page.tsx          # Utilise AcceptInvitationPage.tsx
│   ├── validate-email/
│   │   └── page.tsx          # Utilise ValidateEmailPage.tsx
│   ├── accept-terms/
│   │   └── page.tsx          # Utilise AcceptTermsPage.tsx
│   ├── accept-privacy-policy/
│   │   └── page.tsx          # Utilise AcceptPrivacyPolicyPage.tsx
│   └── change-password/
│       └── page.tsx          # Utilise ChangePasswordPage.tsx
```

### 3. Exemple d'utilisation d'une page

```typescript
// app/auth/reset-password/page.tsx
import { ResetPasswordPage } from '@/examples/nextjs/ResetPasswordPage';

export default function Page() {
  return <ResetPasswordPage />;
}
```

## Paramètres d'URL

Toutes les pages d'actions reçoivent deux paramètres d'URL :
- `token` : Le token d'action à utiliser
- `email` : L'adresse email de l'utilisateur (pour validation)

Exemple : `/auth/reset-password?token=abc123...&email=user@example.com`

## Variables d'environnement

Assurez-vous d'avoir configuré :

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Notes importantes

1. **Routes backend** : Les routes configurées dans votre backend (`AUTH_ACTION_*_ROUTE`) doivent correspondre aux chemins de vos pages Next.js.

2. **Validation** : Toutes les pages d'actions valident que le `token` et l'`email` sont présents dans l'URL.

3. **Gestion d'erreurs** : Toutes les pages gèrent les erreurs et affichent des messages appropriés.

4. **Redirections** : Après succès, les pages redirigent généralement vers le dashboard ou la page de connexion.

5. **Styles** : Les exemples utilisent des classes CSS génériques. Vous devrez ajouter vos propres styles.

