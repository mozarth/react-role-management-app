import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LineChartProps {
  title: string;
  description?: string;
  data: any[];
  lines: {
    name: string;
    dataKey: string;
    color: string;
  }[];
  loading?: boolean;
  className?: string;
  xAxisDataKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
}

export function LineChart({
  title,
  description,
  data,
  lines,
  loading = false,
  className,
  xAxisDataKey = "name",
  xAxisLabel,
  yAxisLabel,
  height = 300
}: LineChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div style={{ height: `${height}px` }} className="flex items-center justify-center">
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: `${height}px` }} className="flex items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
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
                  dataKey={xAxisDataKey} 
                  label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                />
                <YAxis 
                  label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0 } : undefined}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                {lines.map((line, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={line.dataKey}
                    name={line.name}
                    stroke={line.color}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}