import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Flame,
  Clock,
  CheckCircle,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { Notification, ApiResponse } from '../types';
import { formatRelativeTime } from '../utils';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Notification[]> & { unreadCount: number }>('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.submission) {
      const subId = typeof notif.submission === 'object' ? (notif.submission as any)._id : notif.submission;
      navigate(`/submissions/${subId}`);
    } else if (notif.candidate) {
      const canId = typeof notif.candidate === 'object' ? (notif.candidate as any)._id : notif.candidate;
      navigate(`/candidates/${canId}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CANDIDATE_RISK':
        return <Flame size={18} className="text-red-600 fill-red-100" />;
      case 'FOLLOWUP_OVERDUE':
        return <Clock size={18} className="text-orange-600" />;
      case 'FEEDBACK_RECEIVED':
        return <CheckCircle size={18} className="text-emerald-600" />;
      case 'INTERVIEW_REQUESTED':
        return <Calendar size={18} className="text-blue-600" />;
      case 'SUBMISSION_ESCALATED':
        return <ShieldAlert size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-indigo-600" />;
    }
  };

  const filteredNotifs = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="text-indigo-600" size={24} />
            Recruiter Alerts & Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time triggers for feedback arrivals, overdue reminders, and critical candidate risks
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-xs">
            <CheckCheck size={14} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilterUnread(false)}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            !filterUnread ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            filterUnread ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading notifications...</div>
        ) : filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No notifications found.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex items-start gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-indigo-50/20' : ''
              }`}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-slate-100 flex-shrink-0">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {n.title}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              <ArrowRight size={15} className="text-slate-300 self-center flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
