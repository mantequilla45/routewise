import { query } from '../lib/db/db';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkDatabase() {
    console.log('========== CHECKING DATABASE CONNECTION ==========\n');
    
    try {
        // 1. Test basic connection
        console.log('1. Testing database connection...');
        const testResult = await query('SELECT NOW() as current_time');
        console.log('✓ Connected to database at:', testResult[0].current_time);
        console.log('');

        // 2. Check if table exists
        console.log('2. Checking for jeepney_routes table...');
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'jeepney_routes'
            );
        `);
        console.log('Table exists:', tableCheck[0].exists);
        console.log('');

        // 3. Get table structure
        console.log('3. Table structure:');
        const columns = await query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'jeepney_routes'
            ORDER BY ordinal_position;
        `);
        
        if (columns.length > 0) {
            console.table(columns);
        } else {
            console.log('No columns found - table might not exist');
        }
        console.log('');

        // 4. Get all routes (simple data)
        console.log('4. Routes in database:');
        const routes = await query(`
            SELECT 
                id,
                route_code,
                start_point_name,
                end_point_name,
                horizontal_or_vertical_road
            FROM jeepney_routes
            ORDER BY id;
        `);
        
        if (routes.length > 0) {
            console.table(routes);
            console.log(`Total routes: ${routes.length}`);
        } else {
            console.log('❌ No routes found in database');
        }
        console.log('');

        // 5. Check geometry data
        console.log('5. Checking geometry data for first route:');
        if (routes.length > 0) {
            const geoCheck = await query(`
                SELECT 
                    id,
                    route_code,
                    ST_GeometryType(geom_forward) as forward_type,
                    ST_GeometryType(geom_reverse) as reverse_type,
                    ST_NPoints(geom_forward) as forward_points,
                    ST_NPoints(geom_reverse) as reverse_points,
                    ST_AsText(ST_StartPoint(geom_forward)) as start_point,
                    ST_AsText(ST_EndPoint(geom_forward)) as end_point
                FROM jeepney_routes
                WHERE id = $1;
            `, [routes[0].id]);
            
            console.table(geoCheck);
        }
        console.log('');

        // 6. Test the exact query used by the API
        console.log('6. Testing API query for route ID 1:');
        const apiQuery = await query(`
            SELECT 
                id,
                route_code,
                start_point_name,
                end_point_name,
                horizontal_or_vertical_road,
                ST_AsGeoJSON(geom_forward)::json as forward_geojson,
                ST_AsGeoJSON(geom_reverse)::json as reverse_geojson
            FROM jeepney_routes
            WHERE id = 1;
        `);
        
        if (apiQuery.length > 0) {
            console.log('Route found:');
            console.log('- ID:', apiQuery[0].id);
            console.log('- Code:', apiQuery[0].route_code);
            console.log('- GeoJSON type:', apiQuery[0].forward_geojson?.type);
            console.log('- Coordinates count:', apiQuery[0].forward_geojson?.coordinates?.length);
        } else {
            console.log('No route with ID 1 found');
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    }

    process.exit(0);
}

// Run the check
checkDatabase();