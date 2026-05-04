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

## 🔄 API Configuration

The app connects to `http://localhost:5000` by default. To change:

1. Set environment variable:
   ```bash
   export EXPO_PUBLIC_API_URL=http://your-api-url
   ```

2. Or edit `app.config.js`:
   ```js
   extra: {
     apiUrl: "http://your-api-url",
   }
   ```

## 🎯 Key Features Demonstrated

1. **Design Consistency**: Matches web app's exact dark theme
2. **API Reuse**: Same hooks and data structures as web app  
3. **Real Integration**: Fetches live data from backend
4. **Mobile UX**: Pull-to-refresh, loading states, native navigation
5. **Type Safety**: Full TypeScript with shared interfaces

The mobile app is now ready for development and testing with the same backend API that powers the web application!