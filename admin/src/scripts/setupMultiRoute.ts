import { query } from '../lib/db/db';
import fs from 'fs';
import path from 'path';

async function setupMultiRouteFunctions() {
    console.log('🔄 Setting up multi-route functions...');
    
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'createMultiRouteFunctionsFixed.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        // Execute the SQL
        console.log('🔄 Creating database functions...');
        await query(sql, []);
        
        console.log('✅ Multi-route functions created successfully!');
        
        // Test the functions
        console.log('🔄 Testing find_routes_containing_point function...');
        const testResult = await query(`
            SELECT * FROM find_routes_containing_point(10.3, 123.9, 200) LIMIT 5;
        `, []);
        
        console.log(`✅ Found ${testResult.length} routes near test point`);
        
    } catch (error) {
        console.error('❌ Error setting up multi-route functions:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

setupMultiRouteFunctions();