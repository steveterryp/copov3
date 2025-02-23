import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Separator } from '@/components/ui/Separator';
import { PoVFormData } from '../PoVCreationForm';

interface ReviewProps {
  data: PoVFormData;
  errors?: Record<string, string[]>;
}

const Review: React.FC<ReviewProps> = ({ data, errors = {} }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review</h2>
        <p className="text-muted-foreground">
          Review all the information before creating the PoV.
        </p>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="mb-2">Please fix the following errors before submitting:</p>
            <ul className="list-disc pl-4 space-y-1">
              {Object.entries(errors).map(([field, messages]) => (
                <li key={field}>
                  <span className="font-medium">{field.split('.').join(' › ')}</span>
                  <p className="text-sm">{messages.join('. ')}</p>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">PoV Name</p>
              <p className="mt-1">{data.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="mt-1">{data.customer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="mt-1">{formatDate(data.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="mt-1">{formatDate(data.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-1 capitalize">{data.status}</Badge>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Objective</p>
              <p className="mt-1">{data.objective}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Solution</p>
              <p className="mt-1">{data.solution}</p>
            </div>
          </div>
        </Card>

        {/* Team */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Team</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Project Manager</p>
              <p className="mt-1">{data.projectManager}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Engineers</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.salesEngineers.map((engineer) => (
                  <Badge key={engineer} variant="secondary">{engineer}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Technical Team</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.technicalTeam.map((member) => (
                  <Badge key={member} variant="secondary">{member}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Workflow */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Workflow</h3>
          <div className="space-y-4">
            {data.stages.map((stage, index) => (
              <div key={index}>
                <h4 className="font-medium mb-2">{stage.name}</h4>
                <ul className="space-y-2">
                  {stage.tasks.map((task, taskIndex) => (
                    <li key={taskIndex}>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </li>
                  ))}
                </ul>
                {index < data.stages.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </Card>

        {/* KPIs */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">KPIs & Success Metrics</h3>
          <ul className="space-y-4">
            {data.kpis.map((kpi, index) => (
              <li key={index}>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{kpi.title}</p>
                  <Badge variant="secondary">{kpi.weight}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{kpi.target}</p>
              </li>
            ))}
          </ul>
        </Card>

        {/* Resources */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Resources & Budget</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-semibold text-primary mt-1">
                {formatCurrency(data.budget)}
              </p>
            </div>
            <ul className="space-y-4">
              {data.resources.map((resource, index) => (
                <li key={index}>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{resource.type}</p>
                    <Badge variant="secondary">Qty: {resource.quantity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{resource.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Review;
