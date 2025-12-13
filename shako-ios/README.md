# Shako iOS

A React Native/Expo iOS app for tracking vehicle restoration parts. This is a companion app to the Shako web application, sharing the same Supabase backend.

## Features

- **Vehicles**: Track your vehicles with photos, specifications, and maintenance info
- **Projects**: Organize restoration work into projects linked to vehicles
- **Parts**: Track parts with pricing, vendors, delivery status, and tracking numbers
- **Dark Mode**: Automatic dark/light mode based on system settings
- **Offline-Ready**: Uses Supabase with local caching (coming soon)

## Tech Stack

- **Framework**: Expo SDK 52 with Expo Router
- **Language**: JavaScript (React Native)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (shared with web app)
- **Authentication**: Supabase Auth with SecureStore

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Expo Go app on your device

### Installation

1. Clone this repository:
   ```bash
   cd shako-ios
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Press `i` to open in iOS Simulator or scan QR code with Expo Go

## Project Structure

```
shako-ios/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── vehicles.js    # Vehicles list
│   │   ├── projects.js    # Projects list
│   │   ├── parts.js       # Parts list
│   │   └── settings.js    # Settings & account
│   ├── _layout.js         # Root layout
│   ├── index.js           # Entry redirect
│   └── login.js           # Authentication screen
├── components/            # Reusable components
│   ├── AddVehicleModal.js
│   ├── AddProjectModal.js
│   ├── AddPartModal.js
│   └── VehicleDetailModal.js
├── contexts/              # React contexts
│   └── AuthContext.js     # Authentication state
├── lib/                   # Core libraries
│   └── supabase.js        # Supabase client config
├── services/              # API service layer
│   ├── partsService.js
│   ├── projectsService.js
│   ├── vehiclesService.js
│   └── vendorsService.js
└── utils/                 # Utility functions
    ├── colorUtils.js
    ├── dataUtils.js
    └── trackingUtils.js
```

## Shared Backend

This app connects to the same Supabase database as the web app. They share:

- **Database tables**: vehicles, projects, parts, vendors
- **Storage**: Vehicle images
- **Authentication**: Same user accounts work on both platforms
- **RLS policies**: Row-level security ensures data isolation

## Building for Production

### iOS

```bash
# Build for iOS
npx expo build:ios

# Or use EAS Build
npx eas build --platform ios
```

### TestFlight

1. Create an Apple Developer account
2. Configure `app.json` with your bundle identifier
3. Build with EAS: `npx eas build --platform ios --profile production`
4. Submit to TestFlight: `npx eas submit --platform ios`

## Differences from Web App

| Feature | Web | iOS |
|---------|-----|-----|
| Styling | Tailwind CSS | NativeWind |
| Navigation | Next.js Router | Expo Router |
| Image Upload | File input | expo-image-picker |
| Auth Storage | localStorage | SecureStore |
| Dark Mode | Manual toggle | System automatic |

## Contributing

This is a companion app to the main Shako web application. For feature requests or bugs, please refer to the main repository.

## License

MIT
