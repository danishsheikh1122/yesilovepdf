import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import type { PdfUsageLog, UsageStats } from '../../../utils/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get all PDF usage logs
    const { data: logs, error } = await supabase
      .from('pdf_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }

    const actions = logs || [];
    const totalActions = actions.length;
    
    // Calculate unique users (based on IP)
    const uniqueIps = new Set(actions.map((log: any) => log.ip_address));
    const uniqueUsers = uniqueIps.size;

    // Count actions by type
    const actionCounts: { [key: string]: number } = {};
    actions.forEach((log: any) => {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent activity (last 10 actions)
    const recentActivity = actions.slice(0, 10);

    const stats: UsageStats = {
      totalActions,
      uniqueUsers,
      topActions,
      recentActivity,
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

// Optional: Add a more detailed analytics endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateRange, actionType, limit = 100 } = body;

    let query = supabase
      .from('pdf_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add filters if provided
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (dateRange && dateRange.from) {
      query = query.gte('created_at', dateRange.from);
    }

    if (dateRange && dateRange.to) {
      query = query.lte('created_at', dateRange.to);
    }

    const { data: filteredActions, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch filtered usage data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      actions: filteredActions || [],
      count: filteredActions?.length || 0,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching filtered usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered usage data' },
      { status: 500 }
    );
  }
}