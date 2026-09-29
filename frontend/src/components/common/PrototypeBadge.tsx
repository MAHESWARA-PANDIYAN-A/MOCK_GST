import React from 'react';
import { ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PrototypeBadge: React.FC<Props> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-sm ${sizeClasses[size]} ${className}`}
      title="This is a prototype simulation for SIH26130. Not an official Government of India portal."
    >
      <Cpu className="w-3.5 h-3.5 text-amber-700 animate-pulse flex-shrink-0" />
      <span className="font-semibold text-amber-800">SIH26130 Prototype</span>
      <span className="text-amber-500 font-normal">—</span>
      <span className="text-amber-700">Simulated GST Workflow</span>
    </span>
  );
};
