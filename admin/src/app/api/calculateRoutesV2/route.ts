import { NextRequest, NextResponse } from 'next/server';
import { NormalForwardHandler } from '@/services/geo/routeCases/singleRoute/NormalForwardHandler';
import { Case2LoopAroundHandler } from '@/services/geo/routeCases/singleRoute/Case2LoopAroundHandler';

export async function POST(req: NextRequest) {
    try {
        const { from, to } = await req.json();
        
        if (!from || !to) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        console.log('🎯 Route Calculation V2 - Starting');
        console.log('📍 From:', from);
        console.log('📍 To:', to);

        // Try handlers in order
        const handlers = [
            new NormalForwardHandler(),    // Case 1: Both correct, forward
            new Case2LoopAroundHandler(),   // Case 2: Both correct, loop required
        ];

        for (const handler of handlers) {
            const canHandle = await handler.canHandle(from, to);
            
            if (canHandle) {
                const result = await handler.calculate(from, to);
                
                if (result) {
                    console.log(`✅ Route calculated successfully using ${handler.getCaseName()}`);
                    console.log(`  Found ${result.segments.length} route(s)`);
                    console.log(`  First route has ${result.segments[0].coordinates.length} coordinates`);
                    
                    // Format response for all segments
                    const formattedResponses = result.segments.map(segment => ({
                        routeId: segment.routeCode,
                        routeName: segment.routeName,
                        coordinates: segment.coordinates,
                        distance: segment.distance,
                        fare: segment.fare,
                        caseName: result.caseName,
                        requiresLoop: segment.requiresLoop || false,
                        debugInfo: {
                            ...result.debugInfo,
                            coordinateCount: segment.coordinates.length
                        }
                    }));
                    
                    return NextResponse.json(formattedResponses);
                }
            }
        }
        
        console.log('❌ No handler can process this route');
        return NextResponse.json({ 
            error: 'No handler available for this route',
            debugInfo: {
                triedHandlers: handlers.map(h => h.getCaseName())
            }
        }, { status: 404 });

    } catch (error) {
        console.error('🔴 Route Calculation V2 Error:', error);
        return NextResponse.json({ 
            error: 'Failed to calculate route',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}