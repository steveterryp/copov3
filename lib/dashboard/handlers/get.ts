import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardData,
  DashboardData
} from '../services/dashboard';

type WidgetType = 'activePoVs' | 'teamStatus' | 'milestones' | 'resourceUsage' | 'riskOverview' | 'successRate';
type DashboardDataKey = keyof DashboardData;

export async function handleGetDashboard(req: NextRequest) {
  try {
    // Get widget type from query parameter
    const url = new URL(req.url);
    const widget = url.searchParams.get('widget') as WidgetType | null;

    console.log('[Dashboard Handler] Processing request:', {
      widget,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    try {
      // Always use the optimized batch fetch
      const allData = await getDashboardData();

      // If a specific widget is requested, return only that widget's data
      if (widget) {
        const widgetKey = widget === 'activePoVs' ? 'activePoVStats' : widget;
        if (!(widgetKey in allData)) {
          console.warn('[Dashboard Handler] Invalid widget type:', widget);
          return NextResponse.json(
            { error: 'Invalid widget type' },
            { status: 400 }
          );
        }
        return NextResponse.json({ data: { [widgetKey]: allData[widgetKey as DashboardDataKey] } });
      }

      // Return all data if no specific widget requested
      return NextResponse.json({ data: allData });
    } catch (error) {
      console.error('[Dashboard Handler] Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Dashboard Handler] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
