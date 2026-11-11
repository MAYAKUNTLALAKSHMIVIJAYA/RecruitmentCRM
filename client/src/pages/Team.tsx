import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Mail,
  Phone,
  CheckCircle,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { User, ApiResponse } from '../types';
import { getInitials } from '../utils';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get<ApiResponse<any[]>>('/team');
        setTeam(res.data.data || []);
      } catch (err) {
        console.error('Failed to load team', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="text-indigo-600" size={24} />
          Recruitment Agency Team
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Internal recruiters, team leads, and workload distribution
        </p>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading team members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member._id} className="card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-200">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.designation || 'Team Member'}</div>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {member.role === 'admin' ? 'Agency Admin' : 'Recruiter'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-900">{member.activeSubmissions ?? 0}</div>
                  <div className="text-[10px] text-slate-400">Active Submissions</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <div className="font-bold text-emerald-700">{member.totalPlacements ?? 0}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Placements</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
