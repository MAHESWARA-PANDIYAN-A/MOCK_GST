import React from 'react';
import { StatusHistoryItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  history: StatusHistoryItem[];
}

export const TimelineView: React.FC<Props> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No status history recorded yet.
      </div>
    );
  }

  // Sort history ascending for timeline or descending
  const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Dot */}
          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={item.new_status} size="sm" />
                {item.old_status && (
                  <span className="text-xs text-slate-600 font-mono">
                    (from {item.old_status})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>

            {item.reason && (
              <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                {item.reason}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <User className="w-3.5 h-3.5" />
              <span>Action By: <strong className="text-slate-700">{item.changed_by}</strong></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
