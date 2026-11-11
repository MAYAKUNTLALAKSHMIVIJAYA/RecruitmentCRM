import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'akhil@recruitflow.com', password: 'Admin@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const demoAccounts = [
    { label: 'Admin (Akhil)', email: 'akhil@recruitflow.com', password: 'Admin@123', color: 'bg-purple-100 text-purple-700', role: 'Lead Admin' },
    { label: 'Admin (Riya)', email: 'admin@recruitflow.com', password: 'Admin@123', color: 'bg-purple-100 text-purple-700', role: 'Full Access' },
    { label: 'Recruiter (Ananya)', email: 'ananya@recruitflow.com', password: 'Recruiter@123', color: 'bg-indigo-100 text-indigo-700', role: 'Primary Demo User' },
    { label: 'Recruiter (Vikram)', email: 'vikram@recruitflow.com', password: 'Recruiter@123', color: 'bg-blue-100 text-blue-700', role: 'Secondary User' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-900/50">
            <Layers className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RecruitFlow CRM</h1>
          <p className="text-slate-400 text-sm mt-1">Never Miss a Candidate. Never Miss a Follow-up.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Sign In</h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Demo Login</p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm({ email: acc.email, password: acc.password })}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all hover:shadow-sm ${
                    form.email === acc.email ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-700">{acc.label}</div>
                    <div className="text-xs text-slate-400">{acc.email}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${acc.color}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          RecruitFlow CRM Demo — All emails are simulated
        </p>
      </div>
    </div>
  );
};
