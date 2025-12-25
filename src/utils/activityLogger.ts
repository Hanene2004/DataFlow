import { supabase } from '../lib/supabase';

export type ActivityType = 'upload' | 'clean' | 'analysis' | 'comparison' | 'export_pdf' | 'share_email' | 'login' | 'logout';

interface LogActivityParams {
    type: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
    datasetId?: string;
}

/**
 * Log an activity to Supabase
 */
export async function logActivity({ type, description, metadata = {}, datasetId }: LogActivityParams): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('Cannot log activity: No authenticated user');
            return false;
        }

        // Don't log for guest users
        if (user.id === 'guest-user') {
            return false;
        }

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                user_id: user.id,
                activity_type: type,
                description,
                metadata,
                dataset_id: datasetId
            });

        if (error) {
            console.error('Failed to log activity:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error logging activity:', error);
        return false;
    }
}

/**
 * Get user activities from Supabase
 */
export async function getUserActivities(limit: number = 50) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id === 'guest-user') {
            return [];
        }

        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to fetch activities:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

/**
 * Get activities for a specific dataset
 */
export async function getDatasetActivities(datasetId: string) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id === 'guest-user') {
            return [];
        }

        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('dataset_id', datasetId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch dataset activities:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching dataset activities:', error);
        return [];
    }
}

/**
 * Get activity statistics
 */
export async function getActivityStats() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id === 'guest-user') {
            return null;
        }

        const { data, error } = await supabase
            .from('activity_logs')
            .select('activity_type')
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to fetch activity stats:', error);
            return null;
        }

        // Count activities by type
        const stats = data.reduce((acc: Record<string, number>, activity: { activity_type: string }) => {
            acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: data.length,
            byType: stats
        };
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        return null;
    }
}
