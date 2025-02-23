'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { Loader2Icon } from 'lucide-react';
import { useDateFormat } from '@/lib/hooks/useDateFormat';
import { Activity, ActivityListData } from '@/lib/admin/types';

interface AuditLogFilters {
  userId?: string;
  type?: string;
  action?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface AuditLogViewerProps {
  initialData: ActivityListData;
}

export default function AuditLogViewer({ initialData }: AuditLogViewerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with initial data
  useEffect(() => {
    if (initialData) {
      setActivities(initialData.activities);
      setTotal(initialData.pagination.total);
      setAvailableTypes(initialData.filters.types);
      setAvailableActions(initialData.filters.actions);
      setPage(initialData.pagination.current - 1); // Convert to 0-based index
      setRowsPerPage(initialData.pagination.limit);
    }
  }, [initialData]);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(), // Convert back to 1-based index
        limit: rowsPerPage.toString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      });

      const response = await fetch(`/api/admin/audit?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch audit data');
      }

      const { data } = await response.json();
      setActivities(data.activities);
      setTotal(data.pagination.total);
      if (data.filters.types?.length > 0) {
        setAvailableTypes(data.filters.types);
      }
      if (data.filters.actions?.length > 0) {
        setAvailableActions(data.filters.actions);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, filters, fetchData]);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: string) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(0);
  };

  const handleFilterChange = <K extends keyof AuditLogFilters>(
    name: K,
    value: AuditLogFilters[K] | ''
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '') {
        delete newFilters[name];
      } else {
        newFilters[name] = value as AuditLogFilters[K];
      }
      return newFilters;
    });
    setPage(0);
  };

  const { formatDateTime } = useDateFormat();

  const formatDate = (date: string) => {
    return formatDateTime(date);
  };

  const renderMetadata = (metadata: Record<string, any> | null | undefined) => {
    if (!metadata) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(metadata).map(([key, value]) => (
          <Badge key={key} variant="outline">
            {key}: {String(value)}
          </Badge>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2Icon className="h-6 w-6 animate-spin" />
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">Audit Log</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Select value={filters.type || '_all'} onValueChange={(value) => handleFilterChange('type', value === '_all' ? '' : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.action || '_all'} onValueChange={(value) => handleFilterChange('action', value === '_all' ? '' : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Actions</SelectItem>
            {availableActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePicker
          value={filters.startDate}
          onChange={(date) => handleFilterChange('startDate', date)}
          label="Start Date"
        />

        <DatePicker
          value={filters.endDate}
          onChange={(date) => handleFilterChange('endDate', date)}
          label="End Date"
        />
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{formatDate(activity.createdAt)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{renderMetadata(activity.metadata)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardContent className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Rows per page:
            </p>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={handleChangeRowsPerPage}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25, 50].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
              >
                Previous
              </button>
              <button
                className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
                onClick={() => handleChangePage(page + 1)}
                disabled={(page + 1) * rowsPerPage >= total}
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
