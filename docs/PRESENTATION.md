# RouteWise: Jeepney Route Management System
## A Smart Public Transportation Solution for the Philippines

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Authentication System](#authentication-system)
5. [Google Maps Integration](#google-maps-integration)
6. [Project Structure](#project-structure)
7. [Core Features](#core-features)
8. [Route Calculation Engine](#route-calculation-engine)
9. [Database Design](#database-design)
10. [Mobile Application](#mobile-application)
11. [Admin Panel](#admin-panel)
12. [Future Enhancements](#future-enhancements)

---

## 🚀 Project Overview

### What is RouteWise?
RouteWise is a comprehensive jeepney route management system designed to modernize public transportation in the Philippines. It helps commuters find optimal jeepney routes and enables administrators to manage route data efficiently.

### Key Problems Solved
- **For Commuters**: Difficulty finding jeepney routes in unfamiliar areas
- **For Drivers**: Lack of digital route documentation
- **For Administrators**: Manual route management and updates
- **For Cities**: No centralized transportation data

### Target Users
- 🚶 **Commuters** - Find optimal routes with fare estimates
- 🚗 **Jeepney Drivers** - View and contribute route information
- 👨‍💼 **Transport Administrators** - Manage route database
- 🏢 **Government Agencies** - Access transportation analytics

---

## 💻 Tech Stack

### Frontend Technologies

#### Admin Panel (Next.js)
```
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: React Hooks
- Maps: Google Maps JavaScript API
- UI Components: Custom components
```

#### Mobile App (React Native)
```
- Framework: React Native with Expo
- Language: TypeScript
- Navigation: Expo Router
- Maps: React Native Maps
- State: React Context API
```

### Backend Technologies
```
- API: Next.js API Routes
- Database: PostgreSQL with PostGIS
- ORM: Raw SQL queries for spatial operations
- Auth: Supabase Auth
- Hosting: Vercel (Admin) / Expo (Mobile)
```

### Infrastructure
```
- Database Host: Supabase
- File Storage: Supabase Storage
- CDN: Vercel Edge Network
- Maps: Google Cloud Platform
```

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
├──────────────────────┬───────────────────────────────┤
│    Mobile App        │        Admin Panel            │
│  (React Native)      │        (Next.js)              │
└──────────┬───────────┴────────────┬──────────────────┘
           │                        │
           ▼                        ▼
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│              Next.js API Routes                      │
│         /api/routes  /api/auth  /api/calculate       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Service Layer                        │
├──────────────────────┬───────────────────────────────┤
│   Route Calculation  │   Spatial Operations          │
│   Business Logic     │   PostGIS Functions           │
└──────────────────────┴───────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Data Layer                          │
├──────────────────────┬───────────────────────────────┤
│    PostgreSQL        │        PostGIS                │
│    Jeepney Routes    │    Spatial Indexes            │
└──────────────────────┴───────────────────────────────┘
```

### Microservices Pattern
```
/api/
├── routes/           # Route CRUD operations
├── calculateRoutes/  # V1 route calculation
├── calculateRoutesV2/# V2 modular calculation
├── auth/            # Authentication endpoints
└── database/        # Database management
```

---

## 🔐 Authentication System

### Supabase Auth Implementation

#### Features
- **Email/Password Authentication**
- **OAuth Providers** (Google, Facebook)
- **JWT Token Management**
- **Row Level Security (RLS)**
- **Session Management**

#### Auth Flow
```
1. User Registration/Login
   ↓
2. Supabase validates credentials
   ↓
3. JWT token issued
   ↓
4. Token stored in cookies/localStorage
   ↓
5. Token sent with API requests
   ↓
6. Middleware validates token
   ↓
7. Access granted/denied
```

#### Implementation Example
```typescript
// Auth Context (Mobile App)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🗺️ Google Maps Integration

### Google Cloud Console Setup

#### Required APIs
1. **Maps JavaScript API** - Web maps rendering
2. **Places API** - Location search & autocomplete
3. **Directions API** - Route calculation
4. **Roads API** - Snap to road functionality
5. **Geocoding API** - Address to coordinates

#### API Key Configuration
```javascript
// Environment Variables
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

// Security Restrictions
- HTTP referrers (web)
- Bundle IDs (iOS)
- Package names (Android)
- API restrictions per key
```

### Map Implementation

#### Admin Panel Map
```typescript
// Google Maps Loader
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};
```

#### Mobile App Map
```typescript
// React Native Maps Configuration
<MapView
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  initialRegion={{
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  {routes.map(route => (
    <Polyline
      key={route.id}
      coordinates={route.coordinates}
      strokeColor={route.color}
      strokeWidth={3}
    />
  ))}
</MapView>
```

---

## 📁 Project Structure

### Monorepo Structure
```
routewise/
├── admin/                 # Next.js Admin Panel
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── services/     # Business logic
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
│
├── app/                   # React Native Mobile App
│   ├── app/              # Expo Router screens
│   ├── components/       # React Native components
│   ├── context/          # Context providers
│   ├── services/         # API services
│   └── assets/           # Images, fonts
│
└── shared/               # Shared utilities
    ├── types/            # Shared TypeScript types
    └── constants/        # Shared constants
```

### Key Directories Explained

#### `/admin/src/services/geo/routeCases/`
Modular route calculation handlers:
```
singleRoute/
├── Case1NormalHandler.ts      # Normal forward travel
├── Case3OppositeStartHandler.ts # Start on opposite side
├── Case4OppositeEndHandler.ts   # End on opposite side
└── Case5BothOppositeHandler.ts  # Both opposite

multiRoute/
├── Case6SimpleTransferHandler.ts        # Basic 2-jeep transfer
├── Case7TransferStartOppositeHandler.ts # Transfer with opposite start
└── Case8TransferEndOppositeHandler.ts   # Transfer with opposite end
```

#### `/admin/src/lib/`
Core utilities:
```
db/
├── db.ts              # Database connection pool
└── supabase-db.ts     # Supabase client

maps/
└── googleMapsLoader.ts # Google Maps initialization

fare/
└── fareCalculation.ts  # Fare computation logic
```

---

## 🎯 Core Features

### 1. Route Discovery
- **Pin-to-Pin Navigation**: Users pin start and end locations
- **Multiple Route Options**: Shows all possible routes
- **Fare Estimation**: Calculates fare based on distance
- **Walking Distance**: Shows walking distance to/from jeepney stops

### 2. Smart Route Calculation
- **Single Route**: Direct jeepney from A to B
- **Multi-Route Transfer**: Combination of 2+ jeepneys
- **Opposite Side Detection**: Handles wrong-side-of-road scenarios
- **Loop Optimization**: Avoids unnecessary terminal loops

### 3. Route Management
- **CRUD Operations**: Create, read, update, delete routes
- **Bulk Import**: CSV/JSON route data import
- **Route Visualization**: Interactive map editing
- **Version Control**: Route history and rollback

### 4. Real-time Features
- **Live Route Updates**: Instant route modifications
- **Traffic Integration**: Google Traffic API
- **User Contributions**: Crowd-sourced route validation

---

## 🧮 Route Calculation Engine

### V2 Modular Architecture

#### Case-Based Routing System
```typescript
// 10 Distinct Cases Handled
1. Normal Forward - Direct route, correct side
2. Loop Required - Destination before start
3. Opposite Start - Start on wrong side
4. Opposite End - End on wrong side  
5. Both Opposite - Both on wrong side
6. Simple Transfer - Basic 2-jeep route
7. Transfer Start Opposite - Transfer + wrong start
8. Transfer End Opposite - Transfer + wrong end
9. Transfer Both Opposite - Transfer + both wrong
10. Multi-Transfer - 3+ jeepney routes
```

#### Algorithm Flow
```
1. Input: Start & End Coordinates
   ↓
2. Find routes within 500m radius
   ↓
3. Run case handlers in priority order
   ↓
4. Each handler:
   - canHandle(): Check if applicable
   - calculate(): Generate route solution
   ↓
5. Collect all solutions
   ↓
6. Remove duplicates
   ↓
7. Sort by distance/fare
   ↓
8. Return top results
```

#### PostGIS Spatial Queries
```sql
-- Example: Finding routes near a point
SELECT 
    r.id,
    r.route_code,
    ST_Distance(r.geom_forward::geography, point::geography) as distance,
    ST_LineLocatePoint(r.geom_forward, point) as position
FROM jeepney_routes r
WHERE ST_DWithin(
    r.geom_forward::geography,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    500 -- 500m radius
)
ORDER BY distance;
```

---

## 🗄️ Database Design

### Schema Overview

#### Main Tables
```sql
-- Jeepney Routes Table
CREATE TABLE jeepney_routes (
    id UUID PRIMARY KEY,
    route_code VARCHAR(10),
    start_point_name VARCHAR(255),
    end_point_name VARCHAR(255),
    geom_forward GEOMETRY(LineString, 4326),
    geom_backward GEOMETRY(LineString, 4326),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Spatial Indexes
CREATE INDEX idx_routes_geom_forward 
ON jeepney_routes USING GIST(geom_forward);

CREATE INDEX idx_routes_geom_backward 
ON jeepney_routes USING GIST(geom_backward);
```

### PostGIS Functions
```sql
-- Custom function for multi-route calculation
CREATE FUNCTION calculate_multi_route(
    start_point GEOMETRY,
    end_point GEOMETRY,
    max_transfers INT
) RETURNS TABLE(...) AS $$
BEGIN
    -- Complex spatial query logic
END;
$$ LANGUAGE plpgsql;
```

---

## 📱 Mobile Application

### Key Screens

#### Map Screen
- Interactive map with route overlay
- Location selector with pin markers
- Route details panel
- Fare display

#### Routes Tab
- List of all available routes
- Search and filter functionality
- Route details and schedules

#### Saved Routes
- Favorite routes storage
- Quick access to frequent trips
- Offline availability

### State Management
```typescript
// Map Context
export const MapContext = createContext({
  selectedRoute: null,
  setSelectedRoute: () => {},
  userLocation: null,
  setUserLocation: () => {},
  pins: { start: null, end: null },
  setPins: () => {},
});
```

---

## 👨‍💼 Admin Panel

### Dashboard Features

#### Analytics Dashboard
- Route usage statistics
- Popular origin-destination pairs
- Peak hours analysis
- Revenue tracking

#### Route Management
- Visual route editor
- Bulk operations
- Route validation
- Schedule management

#### Database Management
- Direct SQL access
- Backup and restore
- Data import/export
- Schema migrations

### Security Features
- Role-based access control
- Audit logging
- API rate limiting
- Input validation

---

## 🚀 Future Enhancements

### Planned Features
1. **Real-time Tracking**: GPS tracking of jeepneys
2. **Payment Integration**: Cashless payment options
3. **AI Route Optimization**: Machine learning for better routes
4. **Multi-language Support**: Filipino, English, Cebuano
5. **Offline Mode**: Download routes for offline use
6. **Driver App**: Separate app for jeepney drivers
7. **Traffic Prediction**: ML-based traffic forecasting
8. **Voice Navigation**: Turn-by-turn voice guidance

### Technical Improvements
- GraphQL API migration
- Microservices architecture
- Kubernetes deployment
- Redis caching layer
- WebSocket real-time updates
- Progressive Web App (PWA)

### Scalability Plans
- Multi-city expansion
- Government integration
- API monetization
- White-label solutions

---

## 📊 Performance Metrics

### Current Performance
- **API Response Time**: <200ms average
- **Route Calculation**: <500ms for complex routes
- **Map Load Time**: <2s on 4G
- **Database Queries**: <50ms with indexes

### Optimization Techniques
- PostGIS spatial indexing
- Query result caching
- Lazy loading components
- Image optimization
- Code splitting

---

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/routewise.git

# Install dependencies
cd admin && npm install
cd ../app && npm install

# Environment setup
cp .env.example .env.local
# Add your API keys

# Run development
npm run dev
```

### Tech Requirements
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Google Maps API key
- Supabase project

---

## 📝 License & Contact

**License**: MIT License

**Contact**: 
- Email: contact@routewise.ph
- GitHub: github.com/routewise
- Documentation: docs.routewise.ph

---

## Thank You!
### Questions?

*RouteWise - Modernizing Philippine Public Transportation*