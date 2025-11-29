import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            route_code, 
            contributor_name, 
            contributor_email, 
            coordinates_forward,
            status = 'pending'
        } = body;

        // Validate input
        if (!route_code || !contributor_name || !coordinates_forward || coordinates_forward.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields or insufficient coordinates' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Create GeoJSON LineString from coordinates
        const forward_geojson = {
            type: 'LineString',
            coordinates: coordinates_forward
        };

        // Store the contribution with pending status
        // You might want to create a separate 'route_contributions' table for this
        // For now, we'll add it to the routes table with a pending status field
        const { data, error } = await supabase
            .from('route_contributions')
            .insert({
                route_code,
                contributor_name,
                contributor_email,
                forward_geojson,
                status,
                created_at: new Date().toISOString(),
                // Terminal names are set as placeholders
                start_point_name: 'Terminal A',
                end_point_name: 'Terminal B'
            })
            .select()
            .single();

        if (error) {
            // If the contributions table doesn't exist, try the regular routes table
            // with a metadata field to track contributions
            const fallbackResult = await supabase
                .from('routes')
                .insert({
                    route_code: `CONTRIB_${route_code}_${Date.now()}`, // Prefix to identify contributions
                    forward_geojson,
                    start_point_name: 'Terminal A',
                    end_point_name: 'Terminal B',
                    metadata: {
                        is_contribution: true,
                        contributor_name,
                        contributor_email,
                        status: 'pending',
                        submitted_at: new Date().toISOString()
                    }
                })
                .select()
                .single();

            if (fallbackResult.error) {
                console.error('Error storing contribution:', fallbackResult.error);
                return NextResponse.json(
                    { success: false, error: 'Failed to store contribution' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Route contribution submitted successfully',
                contribution_id: fallbackResult.data.id
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Route contribution submitted successfully',
            contribution_id: data.id
        });

    } catch (error) {
        console.error('Error in contribute route:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve pending contributions (for admin review)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        
        const supabase = createClient();

        // Try to get from contributions table first
        let { data, error } = await supabase
            .from('route_contributions')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            // Fallback to routes table with metadata filter
            const fallbackResult = await supabase
                .from('routes')
                .select('*')
                .like('route_code', 'CONTRIB_%')
                .order('created_at', { ascending: false });

            if (fallbackResult.error) {
                console.error('Error fetching contributions:', fallbackResult.error);
                return NextResponse.json(
                    { success: false, error: 'Failed to fetch contributions' },
                    { status: 500 }
                );
            }

            // Filter by status from metadata
            data = fallbackResult.data?.filter(route => 
                route.metadata?.is_contribution && 
                route.metadata?.status === status
            );
        }

        return NextResponse.json({
            success: true,
            contributions: data || []
        });

    } catch (error) {
        console.error('Error fetching contributions:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}