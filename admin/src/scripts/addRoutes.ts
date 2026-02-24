import { query } from '../lib/db/db';

interface RouteData {
    route_code: string;
    start_point_name: string;
    end_point_name: string;
    coordinates_forward: [number, number][]; // Array of [longitude, latitude]
    coordinates_reverse?: [number, number][]; // Optional reverse route
    horizontal_or_vertical_road: boolean;
}

/**
 * Add a new jeepney route to the database
 * @param route Route data to insert
 */
export async function addRoute(route: RouteData) {
    // Create LineString from coordinates
    const forwardLineString = `LINESTRING(${route.coordinates_forward
        .map(coord => `${coord[0]} ${coord[1]}`)
        .join(', ')})`;
    
    const reverseLineString = route.coordinates_reverse
        ? `LINESTRING(${route.coordinates_reverse
            .map(coord => `${coord[0]} ${coord[1]}`)
            .join(', ')})`
        : forwardLineString; // Use forward as reverse if not provided

    const sql = `
        INSERT INTO jeepney_routes (
            route_code,
            start_point_name,
            end_point_name,
            geom_forward,
            geom_reverse,
            horizontal_or_vertical_road
        ) VALUES (
            $1,
            $2,
            $3,
            ST_GeomFromText($4, 4326),
            ST_GeomFromText($5, 4326),
            $6
        ) RETURNING id, route_code;
    `;

    try {
        const result = await query(sql, [
            route.route_code,
            route.start_point_name,
            route.end_point_name,
            forwardLineString,
            reverseLineString,
            route.horizontal_or_vertical_road
        ]);
        
        console.log('Route added successfully:', result[0]);
        return result[0];
    } catch (error) {
        console.error('Error adding route:', error);
        throw error;
    }
}

/**
 * Add multiple routes at once
 */
export async function addMultipleRoutes(routes: RouteData[]) {
    const results = [];
    
    for (const route of routes) {
        try {
            const result = await addRoute(route);
            results.push(result);
        } catch (error) {
            console.error(`Failed to add route ${route.route_code}:`, error);
        }
    }
    
    return results;
}

/**
 * Example usage - Add sample routes
 */
export async function addSampleRoutes() {
    const sampleRoutes: RouteData[] = [
        {
            route_code: '03A',
            start_point_name: 'IT Park',
            end_point_name: 'Ayala Center',
            coordinates_forward: [
                [123.8854, 10.3157], // IT Park
                [123.8900, 10.3200], // Intermediate point
                [123.9050, 10.3180], // Another point
                [123.9094, 10.3177], // Ayala Center
            ],
            horizontal_or_vertical_road: true, // Mostly horizontal route
        },
        {
            route_code: '04B',
            start_point_name: 'Lahug',
            end_point_name: 'Talamban',
            coordinates_forward: [
                [123.8965, 10.3330], // Lahug
                [123.8970, 10.3400],
                [123.8980, 10.3500],
                [123.8990, 10.3600], // Talamban
            ],
            coordinates_reverse: [
                [123.8990, 10.3600], // Talamban (reverse starts from end)
                [123.8985, 10.3500],
                [123.8975, 10.3400],
                [123.8965, 10.3330], // Lahug
            ],
            horizontal_or_vertical_road: false, // Mostly vertical route
        },
        // Add more routes here...
    ];

    const results = await addMultipleRoutes(sampleRoutes);
    console.log(`Added ${results.length} routes successfully`);
    return results;
}

// Run this if executed directly
if (require.main === module) {
    addSampleRoutes()
        .then(() => {
            console.log('Sample routes added successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error adding sample routes:', error);
            process.exit(1);
        });
}