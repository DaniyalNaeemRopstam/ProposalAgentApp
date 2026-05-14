# ProposalAgent Mobile App

React Native Expo app that matches the web app's design system and API integration.

## ✅ What's Completed

### 🎨 Design System
- **Dark Theme**: Exact color palette from `ProposalAgent_MVP.jsx`
- **Typography**: Space Grotesk font family (`@expo-google-fonts/space-grotesk`)
- **UI Components**: Button, TextInput with consistent styling
- **Theme Structure**: `src/theme/colors.ts` and `src/theme/fonts.ts`

### 🔐 Authentication
- **Login Screen**: Email/password with validation
- **Register Screen**: Full registration form with company name
- **Auth Hook**: `useAuth.ts` with login/register/logout functions
- **Token Storage**: AsyncStorage integration for persistent auth
- **Auto-redirect**: App automatically routes based on auth state

### 📱 Tab Navigation
- **Jobs**: Job listing with AI scores and "Generate Proposal" buttons
- **Proposals**: AI proposal generator with word count and metrics
- **Sequences**: Follow-up automation management
- **Pipeline**: CRM deal tracking with stage columns
- **Analytics**: Performance insights and platform statistics

### 🔌 API Integration
- **Shared Hooks**: Reuses web app API patterns via `packages/api-client`
- **Real Data**: JobsScreen connects to `GET /api/jobs` endpoint
- **Error Handling**: Loading states, error messages, pull-to-refresh
- **Type Safety**: Uses shared TypeScript interfaces from `@proposalagent/shared`

### 📁 Project Structure
```
src/
├── components/ui/        # Reusable UI components
├── hooks/               # API integration hooks
├── lib/                # Utilities (API client, helpers)
├── screens/            # Screen components
│   ├── auth/           # Login/Register
│   └── tabs/           # Main app screens
└── theme/              # Design tokens (colors, fonts)
```

## 🚀 How to Run

1. **Start Backend Server** (if not running):
   ```bash
   npm run dev:server
   ```

2. **Start Mobile App**:
   ```bash
   cd apps/mobile
   npx expo start
   ```

3. **Test on Device**:
   - Install Expo Go app on your phone
   - Scan QR code from terminal
   - Or use iOS Simulator / Android Emulator

## 🔄 API configuration

`EXPO_PUBLIC_API_URL` must point at your deployed API (no trailing slash). It is read at **bundle time** (local Metro and EAS cloud builds).

- **Local / Expo Go:** copy `.env.example` to `.env` in `apps/mobile` and adjust, or run:
  ```bash
  cd apps/mobile
  EXPO_PUBLIC_API_URL=https://your-api.up.railway.app npx expo start
  ```
- **EAS builds:** `eas.json` sets `EXPO_PUBLIC_API_URL` for `preview` and `production` profiles (edit there if your Railway URL changes). Alternatively, remove those `env` blocks and use [EAS Environment Variables](https://docs.expo.dev/build-reference/variables/) or `eas secret:create`.

Native apps usually **do not** send a browser `Origin` header, so Railway **`CORS_ORIGINS`** does not need to list the mobile app (only web origins).

## 📦 Client-ready builds (EAS)

Prerequisites: [Expo account](https://expo.dev), install/use EAS CLI (`npx eas-cli@latest`). From the monorepo root, install deps once: `npm install`.

1. **Link the app to EAS** (one time per machine/repo):
   ```bash
   cd apps/mobile
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   Follow prompts; this adds `extra.eas.projectId` to your Expo config on Expo’s servers.

2. **Android APK (easy to share)** — internal distribution, installable APK:
   ```bash
   cd apps/mobile
   npm run build:android:apk
   ```
   Or from repo root: `npm run build:mobile:apk`  
   When the build finishes, open the link in the terminal (or [expo.dev](https://expo.dev) → your project → Builds) and **download the APK** to send to your client. They must allow “Install from unknown sources” for that file.

3. **Android AAB (Google Play)** — Play Store upload:
   ```bash
   npm run build:android:aab
   ```

4. **iOS** — requires an **Apple Developer** account ($99/yr). Internal / TestFlight:
   ```bash
   npm run build:ios
   ```
   Distribute via TestFlight or Ad Hoc provisioning; Expo’s docs cover [iOS credentials](https://docs.expo.dev/app-signing/app-credentials/).

**Profiles** (see `eas.json`): `preview` = APK + internal; `production` = store-style builds with version auto-increment on Android.

## 🎯 Key Features Demonstrated

1. **Design Consistency**: Matches web app's exact dark theme
2. **API Reuse**: Same hooks and data structures as web app  
3. **Real Integration**: Fetches live data from backend
4. **Mobile UX**: Pull-to-refresh, loading states, native navigation
5. **Type Safety**: Full TypeScript with shared interfaces

The mobile app is now ready for development and testing with the same backend API that powers the web application!