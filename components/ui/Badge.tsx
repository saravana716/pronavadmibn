
import React from 'react';
import { STATUS_COLORS } from '../../constants';
import { Status } from '../../types';

interface BadgeProps {
  status: Status;
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold leading-5 rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default Badge;
