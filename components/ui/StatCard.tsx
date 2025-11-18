
import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <Card className="flex items-center p-4">
      <div className="p-3 mr-4 text-accent bg-accent bg-opacity-10 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </div>
    </Card>
  );
};

export default StatCard;
