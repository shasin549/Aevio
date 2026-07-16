import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Video, Analytics, Report } from '../types';
import { 
  ShieldAlert, Users, Film, Eye, ThumbsUp, AlertTriangle, 
  Trash2, CheckCircle, ShieldCheck, UserMinus, ShieldAlert as ShieldIcon,
  Lock, Key, ArrowLeft, Loader2, Upload
} from 'lucide-react';

interface AdminPanelProps {
  onNavigate: (view: string, refId?: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const { 
    currentUser, fetchAdminAnalytics, fetchAdminUsers, toggleAdminUser, 
    deleteUser, deleteVideo, verifyAdminPassword 
  } = useApp();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'reports'>('overview');

  // Verification states
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const stats = await fetchAdminAnalytics();
      setAnalytics(stats);
      const userList = await fetchAdminUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadAdminData();
    }
  }, [currentUser]);

  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isVerifying) return;

    setIsVerifying(true);
    setPromptError(null);
    try {
      await verifyAdminPassword(password);
    } catch (err: any) {
      console.error('Admin authentication failed:', err);
      setPromptError(err.message || 'Incorrect access credentials.');
      // Auto redirect to home after 2 seconds as requested: "If the password is incorrect, deny access and redirect to the home page"
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot revoke your own admin rights.');
      return;
    }
    if (confirm('Are you sure you want to change the administrator status of this user?')) {
      try {
        await toggleAdminUser(userId);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (confirm('CRITICAL WARN: Deleting this user will permanently remove their channel, ALL uploaded videos, comments, and playlists. This is irreversible. Proceed?')) {
      try {
        await deleteUser(userId);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('yt_token');
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveReportedVideo = async (videoId: string, reportId: string) => {
    if (confirm('Are you sure you want to permanently remove this reported video? This action will notify the uploader and clean associated comments.')) {
      try {
        await deleteVideo(videoId);
        await handleResolveReport(reportId);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-[#09090b] min-h-[calc(100vh-57px)]">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center transition-all">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-500 animate-pulse" />
          </div>
          
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Gatekeeper</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2 mb-6">
            Enter the secure access key to unlock the platform control panel.
          </p>

          <form onSubmit={handleVerifyPasswordSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isVerifying || promptError !== null}
                placeholder="Secret Access Key"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                autoFocus
              />
            </div>

            {promptError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-medium text-red-600 dark:text-red-400">
                {promptError}
                <div className="mt-1.5 text-[10px] text-red-500 dark:text-red-400/80 uppercase tracking-wider font-bold animate-pulse">
                  Redirecting to home page...
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !password.trim() || promptError !== null}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-red-500/10 hover:shadow-red-500/20"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Unlock Panel'
              )}
            </button>
          </form>

          <button
            onClick={() => onNavigate('home')}
            disabled={isVerifying}
            className="mt-5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 mt-3 font-medium">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 transition-colors duration-200">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldIcon className="w-6 h-6 text-red-600" />
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Platform Control Panel</h1>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-200 cursor-pointer"
          id="admin-upload-btn"
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6 gap-2 shrink-0">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'overview'
              ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
              : 'text-gray-500 hover:text-gray-900 border-transparent'
          }`}
        >
          Analytics Overview
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'users'
              ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
              : 'text-gray-500 hover:text-gray-900 border-transparent'
          }`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'reports'
              ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400'
              : 'text-gray-500 hover:text-gray-900 border-transparent'
          }`}
        >
          Incident Flags ({(analytics?.recentReports || []).length})
        </button>
      </div>

      {/* Content tabs */}
      {activeSubTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Users</span>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.totalUsers}</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Videos Published</span>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.totalVideos}</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Plays</span>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {analytics.totalViews >= 1000 ? `${(analytics.totalViews / 1000).toFixed(1)}k` : analytics.totalViews}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Likes</span>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.totalLikes}</p>
              </div>
            </div>
          </div>

          {/* Categories bar distribution */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Category Composition</h3>
            <div className="space-y-3.5">
              {Object.entries(analytics.categoryDistribution || {}).map(([cat, count]) => {
                const numericCount = count as number;
                const percentage = (numericCount / (analytics.totalVideos || 1)) * 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-zinc-300">{cat}</span>
                      <span className="text-gray-400">{count} videos ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-600 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-5 py-3">Channel User</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Subscribers</th>
                  <th className="px-5 py-3">Platform Role</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs text-gray-700 dark:text-zinc-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <img src={u.profilePhoto} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer" onClick={() => onNavigate('profile', u.id)}>
                          {u.name}
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">Created: {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{u.email}</td>
                    <td className="px-5 py-3.5">{u.subscribers?.length || 0}</td>
                    <td className="px-5 py-3.5">
                      {u.isAdmin ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[10px]">
                          Administrator
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[10px]">
                          Creator
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleAdmin(u.id)}
                        className="px-2.5 py-1.5 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-[10px] font-bold rounded-lg transition-colors"
                        title="Toggle administrator permissions"
                      >
                        {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors inline-flex align-middle"
                        title="Permanently remove user"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {(analytics?.recentReports || []).length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">No flags reported</p>
              <p className="text-xs text-gray-400 mt-1">Excellent! Platform community is completely safe.</p>
            </div>
          ) : (
            analytics.recentReports.map((rep: Report) => (
              <div 
                key={rep.id} 
                className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span 
                      onClick={() => onNavigate('watch', rep.videoId)}
                      className="font-bold text-sm text-gray-900 dark:text-white hover:underline hover:text-red-600 dark:hover:text-red-400 cursor-pointer block truncate"
                    >
                      {rep.videoTitle || 'Flagged video'}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      Reason: <span className="text-amber-600 dark:text-amber-400 font-medium">{rep.reason}</span>
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-1">Flagged on: {new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleResolveReport(rep.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 font-semibold text-xs rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Dismiss flag
                  </button>
                  <button
                    onClick={() => handleRemoveReportedVideo(rep.videoId, rep.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold text-xs rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove video
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
