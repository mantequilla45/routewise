## RouteWise Context Summary

1. System Overview and Scope
* Product Name: RouteWise
* Purpose: Public transport navigation and crowdsourcing system for jeepney/bus routes
* Pilot City: Cebu City, Philippines
* Project Timeline: Academic project, September to December 2025
* Interfaces: Mobile Application (Commuters) and Web-based Admin Panel (System Owners)
* Out-of-Scope (Initial Version): Payment processing, non-jeepney transport, multi-language support

2. Core Features
* Route Discovery: Search routes by origin/destination and view details (stops, fare, duration)
* Real-Time Tracking: Tracks user location during active trips (updates every 3 seconds)
* Notifications: GPS-triggered alerts for boarding, transfer, and alighting (using geofencing)
* Fare Calculation: Distance-based, with Cebu City base rate P13 for first 4km, plus P1.80 per additional 100 meters
* Crowdsourcing: Users record and submit GPS traces of routes
* Validation/Merging: Auto-merges if Similarity > 85% AND User Reputation > 50. Uses Hausdorff distance for similarity
* Admin Features: Review contributions, manage users (ban/unban), and monitor analytics (DAU, total trips, approval rate)
* Security: Implements Role-Based Access Control (RBAC)

3. Technology Stack & Constraints
* Architecture: Microservices, three-tier, layered design
* Mobile App: React Native 0.72+
* Backend: Node.js 18+ with NestJS
* Database: PostgreSQL 15+ with PostGIS 3.3+ (for geospatial data)
* Mapping: Must use Google Maps API
* Hosting: Render.com
* Authentication & Notifications: Supabase
* Security/Compliance: Must comply with the Data Privacy Act of 2012 (RA 10173)
* Performance: Route search queries must return results within 3 seconds

## RouteWise Task List (Plain Text, No Citations or Formatting)

I. Backend & Database
* Set up PostgreSQL/PostGIS database (Version 15+ / 3.3+)
* Develop Node.js/NestJS microservices
* Implement JWT-based authentication via Supabase
* Develop Route Discovery API using PostGIS spatial queries
* Implement distance-based Fare Calculation logic (Cebu City Matrix)
* Implement Route Merging Algorithm and Quality Validation logic

II. Mobile Application (React Native)
* Implement Commuter Registration/Login screens
* Develop Route Search and Trip Planning interface (Max 3 taps to core feature)
* Integrate Google Maps API for map display
* Develop GPS-based Real-Time Tracking and Geofencing for notifications
* Build Route Recording Module for capturing GPS traces
* Ensure offline functionality for saved routes

III. Admin Web Panel (React)
* Develop Admin Login and Role-Based Access Control (RBAC)
* Build Contribution Review screen with map view and quality metrics
* Develop User Management features (Ban/Unban)
* Create Analytics Dashboard to display DAU, approval rates, and system health
* Implement Audit Logging for all admin actions

IV. Deployment & Testing
* Deploy backend services to Render.com
* Conduct Alpha Testing (Internal, Nov 1-15, 2025)
* Conduct Beta Testing (Classmates, Nov 16-30, 2025)
* Complete Performance Testing (Route queries < 3 seconds goal)
* Finalize Technical Documentation and City Replication Guide