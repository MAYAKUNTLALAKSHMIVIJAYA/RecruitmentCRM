import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { Client, ApiResponse } from '../types';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Client Form
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    website: '',
    location: '',
    primaryContact: '',
    contactEmail: '',
    contactPhone: '',
    accountStatus: 'Active',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Client[]>>('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/clients', form);
      setIsModalOpen(false);
      setForm({
        companyName: '',
        industry: '',
        website: '',
        location: '',
        primaryContact: '',
        contactEmail: '',
        contactPhone: '',
        accountStatus: 'Active',
      });
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={24} />
            Client Accounts & Hiring Partners
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage client relationships, hiring managers, and track feedback turnaround SLAs
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, industry, or location..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          No clients found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client._id}
              onClick={() => navigate(`/clients/${client._id}`)}
              className="card p-5 hover:shadow-md cursor-pointer transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {client.companyName}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      {client.industry}
                    </div>
                  </div>
                  <span
                    className={
                      client.accountStatus === 'Active'
                        ? 'badge-green'
                        : client.accountStatus === 'On Hold'
                        ? 'badge-orange'
                        : 'badge-gray'
                    }
                  >
                    {client.accountStatus}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{client.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{client.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-400" />
                    <span>Primary Contact: <b>{client.primaryContact}</b></span>
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-900">{client.activeJobsCount ?? 0}</div>
                  <div className="text-[10px] text-slate-400">Open Jobs</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-900">{client.totalSubmissionsCount ?? 0}</div>
                  <div className="text-[10px] text-slate-400">Submitted</div>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <div className="font-bold text-orange-700">{client.pendingFeedbackCount ?? 0}</div>
                  <div className="text-[10px] text-orange-600 font-medium">Pending FB</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add New Client Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="m-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div>
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Industry *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT, Fintech"
                    className="input"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bangalore, India"
                    className="input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Contact *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.primaryContact}
                    onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Contact Email *</label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Phone</label>
                  <input
                    type="text"
                    className="input"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input
                    type="url"
                    placeholder="https://"
                    className="input"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
