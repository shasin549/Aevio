import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, LogIn, Lock, Mail, ShieldAlert, ArrowRight, Video } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, initialTab = 'login' }) => {
  const { login, register, error, setError } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, bio, profilePhoto);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Authentication action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccount = (demoEmail: string, pass: string) => {
    setEmail(demoEmail);
    setPassword(pass);
    setActiveTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-zinc-800 transition-colors duration-200"
        id="auth-container-card"
      >
        {/* Header Tab Toggles */}
        <div className="flex border-b border-gray-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 py-4 text-center text-sm font-bold transition-all ${
              activeTab === 'login'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 py-4 text-center text-sm font-bold transition-all ${
              activeTab === 'register'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6">
          {/* Brand Presentation */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 mb-3.5">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {activeTab === 'login' ? 'Welcome back!' : 'Join StreamVibe'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {activeTab === 'login' ? 'Access your library, playlists, and analytics.' : 'Publish your videos and grow your global community.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Channel Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. PixelArt Studios"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Brief Channel Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short description of your content"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Sign In' : 'Create Channel'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Tester Account Assist */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-3">
              Developer Test accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleDemoAccount('shasinsha7384@gmail.com', 'admin1234')}
                className="p-2 border border-dashed border-red-200 dark:border-red-950/40 hover:bg-red-50/40 dark:hover:bg-red-950/10 rounded-xl text-left"
              >
                <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Admin
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">shasinsha7384@gmail.com</div>
              </button>
              <button
                onClick={() => handleDemoAccount('techbytes@example.com', 'creator1234')}
                className="p-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 rounded-xl text-left"
              >
                <div className="font-bold text-gray-800 dark:text-zinc-300">Creator</div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">techbytes@example.com</div>
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 mt-5 underline"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};
