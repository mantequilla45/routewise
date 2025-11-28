import { query } from '../lib/db/db';

async function viewAllRoutes() {
    try {
        const sql = `
            SELECT 
                id,
                route_code,
                start_point_name,
                end_point_name,
                horizontal_or_vertical_road,
                ST_AsText(geom_forward) as forward_path,
                ST_AsText(geom_reverse) as reverse_path
            FROM new_jeepney_routes
            ORDER BY route_code;
        `;

        const routes = await query(sql);
        
        console.log('\n========== EXISTING ROUTES ==========\n');
        console.log(`Total routes in database: ${routes.length}\n`);
        
        routes.forEach(route => {
            console.log(`Route Code: ${route.route_code}`);
            console.log(`  From: ${route.start_point_name}`);
            console.log(`  To: ${route.end_point_name}`);
            console.log(`  Type: ${route.horizontal_or_vertical_road ? 'Horizontal (E-W)' : 'Vertical (N-S)'}`);
            console.log(`  ID: ${route.id}`);
            console.log('---');
        });

        // Show summary
        console.log('\n========== SUMMARY ==========');
        console.log(`Horizontal routes: ${routes.filter(r => r.horizontal_or_vertical_road).length}`);
        console.log(`Vertical routes: ${routes.filter(r => !r.horizontal_or_vertical_road).length}`);
        
        // Show route codes only
        console.log('\nAll route codes:', routes.map(r => r.route_code).join(', '));
        
    } catch (error) {
        console.error('Error fetching routes:', error);
    }
    
    process.exit(0);
}

// Run the script
viewAllRoutes();