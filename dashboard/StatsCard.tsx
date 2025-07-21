import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TrendProps {
  value: string;
  label: string;
  direction: "up" | "down";
  color: string;
}

interface DetailProps {
  value: string;
  label: string;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: TrendProps;
  detail?: DetailProps;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, detail }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-xl">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral">{value}</p>
      
      {trend && (
        <div className={`text-xs ${trend.color} flex items-center mt-2`}>
          {trend.direction === "up" ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDown className="h-3 w-3 mr-1" />
          )}
          <span>{trend.value} {trend.label}</span>
        </div>
      )}
      
      {detail && (
        <div className="text-xs text-gray-500 flex items-center mt-2">
          <span>{detail.value} {detail.label}</span>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
