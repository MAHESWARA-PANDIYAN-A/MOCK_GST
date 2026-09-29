import React from 'react';
import { ApplicationStatus } from '../../types';
import { 
  FileEdit, Send, Clock, Search, HelpCircle, CheckCircle, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';

interface Props {
  status: ApplicationStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, className = '', size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileEdit,
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          icon: Send,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'PENDING_FOR_VALIDATION':
        return {
          label: 'Pending Validation',
          icon: Clock,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          icon: Search,
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      case 'DOCUMENT_QUERY':
        return {
          label: 'Document Query',
          icon: HelpCircle,
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
        };
      case 'CLARIFICATION_RECEIVED':
        return {
          label: 'Clarification Received',
          icon: CheckCircle,
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: XCircle,
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
        };
      default:
        return {
          label: status || 'Unknown',
          icon: AlertCircle,
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
