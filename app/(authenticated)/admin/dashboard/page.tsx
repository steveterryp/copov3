'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GeoDistributionWidget } from '@/components/dashboard/GeoDistributionWidget';
import { useGeographicalDistribution } from '@/lib/hooks/useGeographicalDistribution';

export default function AdminDashboardPage() {
  const { data: geoData, isLoading: geoLoading } = useGeographicalDistribution();
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">POV Analytics</h1>
          <p className="text-muted-foreground">
            Overview of POV distribution and metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographical Distribution</CardTitle>
              <CardDescription>
                POV distribution across regions and countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {geoLoading ? (
                <div className="flex justify-center items-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : geoData ? (
                <GeoDistributionWidget data={geoData} />
              ) : (
                <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                  No geographical data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground mb-6">
            Manage your company users and roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Add, edit, and manage user accounts. Control access and permissions for your team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users" className="no-underline">
              <Button>Manage</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>
              Configure system-level permissions and access controls for different user roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/permissions" className="no-underline">
              <Button>Manage</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Titles</CardTitle>
            <CardDescription>
              Manage organizational roles and job titles for team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/roles" className="no-underline">
              <Button>Manage</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRM Integration</CardTitle>
            <CardDescription>
              Configure CRM field mappings, sync settings, and global templates for PoV integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/crm" className="no-underline">
              <Button>Manage</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase Templates</CardTitle>
            <CardDescription>
              Create and manage phase templates for PoVs. Configure workflows and approval processes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/phases" className="no-underline">
              <Button>Manage</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              View detailed activity logs and audit trails. Track user actions and system changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/audit" className="no-underline">
              <Button>View</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
