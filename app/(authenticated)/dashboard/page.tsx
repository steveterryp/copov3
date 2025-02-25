'use client';

import React, { Suspense } from 'react';
import ActivePoVs from '@/components/dashboard/widgets/ActivePoVs';
import TeamStatus from '@/components/dashboard/widgets/TeamStatus';
import SuccessRate from '@/components/dashboard/widgets/SuccessRate';
import RiskOverview from '@/components/dashboard/widgets/RiskOverview';
import ResourceUsage from '@/components/dashboard/widgets/ResourceUsage';
import Milestones from '@/components/dashboard/widgets/Milestones';
import GeoDistribution from '@/components/dashboard/widgets/GeoDistribution';
import WidgetSkeleton from '@/components/dashboard/widgets/WidgetSkeleton';
import WidgetErrorBoundary from '@/components/dashboard/widgets/WidgetErrorBoundary';

// Widget wrapper with error boundary and suspense
const WidgetWrapper = ({ children }: { children: React.ReactNode }) => (
  <WidgetErrorBoundary>
    <Suspense fallback={<WidgetSkeleton />}>
      {children}
    </Suspense>
  </WidgetErrorBoundary>
);

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <WidgetWrapper>
            <ActivePoVs />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <SuccessRate />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <Milestones />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <ResourceUsage />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <RiskOverview />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <TeamStatus />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper>
            <GeoDistribution />
          </WidgetWrapper>
        </div>
      </div>
    </div>
  );
}
