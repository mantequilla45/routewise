#!/usr/bin/env tsx

/**
 * Test script for route calculation cases
 * Run with: npm run tsx src/scripts/testRouteCases.ts
 */

import { NormalForwardHandler } from '../services/geo/routeCases/singleRoute/NormalForwardHandler';
import { Case2LoopAroundHandler } from '../services/geo/routeCases/singleRoute/Case2LoopAroundHandler';
import { Case3OppositeStartHandler } from '../services/geo/routeCases/singleRoute/Case3OppositeStartHandler';
import { LatLng } from '../types/GeoTypes';

async function testCases() {
    console.log('🧪 Testing Route Calculation Cases\n');
    
    // Test scenarios
    const testScenarios = [
        {
            name: 'Short Loop (Case 2 should handle)',
            from: { latitude: 14.5609, longitude: 121.0195 } as LatLng,  // 80% position
            to: { latitude: 14.5595, longitude: 121.0175 } as LatLng,    // 20% position
            expectedCase: 'CASE_2_LOOP_AROUND'
        },
        {
            name: 'Long Loop (Case 3 should handle - crossing better)',
            from: { latitude: 14.5609, longitude: 121.0195 } as LatLng,  // 95% position on wrong side
            to: { latitude: 14.5595, longitude: 121.0175 } as LatLng,    // 10% position
            expectedCase: 'CASE_3_OPPOSITE_START'
        },
        {
            name: 'Normal Forward (Case 1 should handle)',
            from: { latitude: 14.5595, longitude: 121.0175 } as LatLng,  // 20% position
            to: { latitude: 14.5609, longitude: 121.0195 } as LatLng,    // 80% position
            expectedCase: 'CASE_1_NORMAL_FORWARD'
        }
    ];
    
    const handlers = [
        new NormalForwardHandler(),
        new Case2LoopAroundHandler(),
        new Case3OppositeStartHandler(),
    ];
    
    for (const scenario of testScenarios) {
        console.log(`📍 Testing: ${scenario.name}`);
        console.log(`   From: ${scenario.from.latitude}, ${scenario.from.longitude}`);
        console.log(`   To: ${scenario.to.latitude}, ${scenario.to.longitude}`);
        console.log(`   Expected: ${scenario.expectedCase}\n`);
        
        for (const handler of handlers) {
            const canHandle = await handler.canHandle(scenario.from, scenario.to);
            
            if (canHandle) {
                const result = handler.getCaseName();
                const isCorrect = result === scenario.expectedCase;
                console.log(`   ${isCorrect ? '✅' : '❌'} ${result} ${isCorrect ? 'correctly' : 'incorrectly'} handled this`);
                
                if (!isCorrect) {
                    console.log(`      ⚠️ Expected ${scenario.expectedCase} but got ${result}`);
                }
                break; // Stop after first handler that can handle
            }
        }
        console.log('');
    }
}

// Run the tests
testCases().catch(console.error);