import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, Compass, Clock, PlaySquare, Heart, Shield, 
  Tv, ListMusic, User as UserIcon, LogIn, Upload
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, refId?: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen }) => {
  const { currentUser, playlists } = useApp();

  if (!isOpen) return null;

  const categories = [
    { name: 'Home', view: 'home', icon: Home },
    { name: 'Trending', view: 'trending', icon: Compass },
  ];

  const personalSection = [
    { name: 'My Channel', view: 'profile', param: currentUser?.id, icon: Tv },
    { name: 'Watch Later', view: 'playlist', param: 'play-1', icon: Clock },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-zinc-800 flex flex-col shrink-0 h-[calc(100vh-57px)] overflow-y-auto select-none transition-all duration-200">
      {/* Prominent Upload File Button - Only for Admin */}
      {currentUser?.isAdmin && (
        <div className="p-3">
          <button
            onClick={() => onNavigate('upload')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-200 cursor-pointer"
            id="sidebar-upload-btn"
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      )}

      {currentUser?.isAdmin && <hr className="border-gray-200 dark:border-zinc-800 mx-4 my-1" />}

      {/* Categories section */}
      <div className="p-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentView === cat.view;
          return (
            <button
              key={cat.name}
              onClick={() => onNavigate(cat.view)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-zinc-400'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {currentUser && (
        <>
          <hr className="border-gray-200 dark:border-zinc-800 mx-4 my-1" />

          {/* Personal/Library section */}
          <div className="p-3">
            <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-1.5">
              Library
            </span>
            {personalSection.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view && (item.view !== 'playlist' || item.param === 'play-1');
              return (
                <button
                  key={item.name}
                  onClick={() => onNavigate(item.view, item.param)}
                  className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-zinc-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <hr className="border-gray-200 dark:border-zinc-800 mx-4 my-1" />

      {/* Custom Playlists */}
      {currentUser && (
        <div className="p-3">
          <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-1.5">
            Playlists
          </span>
          {playlists.filter(p => p.id !== 'play-1').length === 0 ? (
            <p className="px-4 text-xs text-gray-400 dark:text-zinc-500 py-1">No custom playlists.</p>
          ) : (
            playlists.filter(p => p.id !== 'play-1').map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onNavigate('playlist', playlist.id)}
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'playlist' && playlist.id === playlist.id
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <ListMusic className="w-5 h-5 text-gray-500 dark:text-zinc-400 shrink-0" />
                <span className="truncate flex-1 text-left">{playlist.name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {currentUser?.isAdmin && (
        <>
          <hr className="border-gray-200 dark:border-zinc-800 mx-4 my-1" />
          <div className="p-3">
            <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block mb-1.5">
              Admin
            </span>
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'admin' 
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Shield className="w-5 h-5 text-red-500" />
              Admin Panel
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
