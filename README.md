# RouteWise Mobile

A comprehensive jeepney navigation companion for commuters in Cebu Province. RouteWise helps users identify which jeepneys to ride, calculates total fares, and provides real-time notifications throughout their journey.

## Features

### 🚐 Smart Route Identification

- Identifies which jeepney routes serve your origin and destination
- Shows specific jeepney route codes and names
- Provides direct routes when available
- Suggests transfer routes with clear connection points
- Displays multiple route alternatives for flexibility

### 💰 Comprehensive Fare Calculator

- Calculates complete fare for entire journey
- Shows individual costs for each jeepney segment
- Real-time pricing based on current fare rates
- Distance-based accurate calculations
- Compares costs across different route options

### 🔔 Real-Time Notifications

- Alerts when approaching transfer stops
- Reminds which jeepney to board next
- Notifies when to get off at destinations
- Step-by-step guidance throughout journey
- GPS-triggered location-based alerts

### 🗺️ Journey Management

- Complete trip planning from origin to destination
- Real-time location tracking and progress monitoring
- Clear transfer point identification
- Guidance on where to wait for connecting jeepneys
- Trip history for frequently traveled routes

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development on Mac)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/routewise-mobile.git
cd routewise-mobile
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Install iOS dependencies (Mac only)

```bash
cd ios && pod install
cd ..
```

### Running the App

#### Android

```bash
npm run android
# or
yarn android
```

#### iOS

```bash
npm run ios
# or
yarn ios
```

#### Start Metro bundler

```bash
npm start
# or
yarn start
```

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation library
- **Redux Toolkit** - State management
- **React Native Maps** - Map integration
- **AsyncStorage** - Local data persistence

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── navigation/     # Navigation configuration
│   ├── services/       # API and external services
│   ├── store/         # Redux store and slices
│   ├── utils/         # Utility functions
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── constants/     # App constants
│   └── assets/        # Images, fonts, etc.
├── android/           # Android-specific code
├── ios/              # iOS-specific code
└── __tests__/        # Test files
```

## Development

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Write self-documenting code

### Testing

```bash
npm test
# or
yarn test
```

### Linting

```bash
npm run lint
# or
yarn lint
```

### Building for Production

#### Android

```bash
cd android
./gradlew assembleRelease
```

#### iOS

```bash
cd ios
xcodebuild -workspace RouteWise.xcworkspace -scheme RouteWise -configuration Release
```

## Contributing

We welcome contributions! Please see our contributing guidelines for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Team

- **Vince Kevin Añana** - Project Leader
- **Jeff Gabriel Leung** - Developer
- **Daniel Montesclaros** - Developer
- **Mark John Toroy** - Developer

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Cebu Institute of Technology University
- College of Engineering and Architecture
- Mr. Rex Seadino Jr. - Project Advisor

## Support

For support, email support@routewise.ph or open an issue in this repository.

## Roadmap

- [ ] Core route database implementation
- [ ] Fare calculation system
- [ ] GPS tracking and notifications
- [ ] Offline support
- [ ] Real-time jeepney tracking
- [ ] Digital payment integration
- [ ] Multi-province expansion

---

**RouteWise** - Making jeepney travel simple and stress-free 🚐
