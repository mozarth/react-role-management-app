import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  nameList?: Array<{id: number | string, name: string}>;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  loading = false,
  trend,
  className,
  nameList
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline">
              <h3 className="text-3xl font-semibold">
                {loading ? "-" : value}
              </h3>
              
              {trend && (
                <span className={cn(
                  "ml-2 text-sm",
                  trend.direction === 'up' ? 'text-green-600 dark:text-green-500' : '',
                  trend.direction === 'down' ? 'text-red-600 dark:text-red-500' : '',
                  trend.direction === 'neutral' ? 'text-gray-500 dark:text-gray-400' : ''
                )}>
                  {trend.direction === 'up' && '↑'}
                  {trend.direction === 'down' && '↓'}
                  {trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            
            {/* Lista de nombres */}
            {nameList && nameList.length > 0 && (
              <div className="mt-3 space-y-1">
                {nameList.map((item) => (
                  <p key={item.id} className="text-xs text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block mr-1 mb-1">
                    {item.name}
                  </p>
                ))}
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}