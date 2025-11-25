import { getUserStatistics, supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
    try {
        // You might want to add authentication check here
        // For example, verify JWT token or check if user is admin
        
        // Get user statistics
        const { data: stats, error: statsError } = await getUserStatistics();
        
        if (statsError) {
            console.error("Failed to fetch statistics:", statsError);
            return Response.json({ error: "Failed to fetch statistics" }, { status: 500 });
        }

        // Get recent users (last 10 signups)
        let recentUsers = [];
        if (supabaseAdmin) {
            const { data: users, error: usersError } = await supabaseAdmin
                .from('users')
                .select(`
                    id, 
                    email, 
                    full_name, 
                    created_at, 
                    last_login, 
                    login_count,
                    auth_provider,
                    commuter_type,
                    is_admin
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (usersError) {
                console.error("Failed to fetch recent users:", usersError);
            } else {
                recentUsers = users || [];
            }
        }

        // Get today's signups
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let todaysSignups = 0;
        if (supabaseAdmin) {
            const { count } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());
            
            todaysSignups = count || 0;
        }

        return Response.json({
            statistics: {
                ...stats,
                todays_signups: todaysSignups,
            },
            recentUsers,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}