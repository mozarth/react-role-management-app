import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  description?: string;
  data: ChartItem[];
  loading?: boolean;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  dataKey?: string;
  barColor?: string;
  height?: number;
}

export function BarChart({
  title,
  description,
  data,
  loading = false,
  className,
  xAxisLabel,
  yAxisLabel,
  dataKey = "value",
  barColor = "#3b82f6",
  height = 300
}: BarChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className={`h-[${height}px] flex items-center justify-center`}>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className={`h-[${height}px] flex items-center justify-center`}>
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                />
                <YAxis 
                  label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0 } : undefined}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  name={title}
                  dataKey={dataKey}
                  fill={barColor}
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}