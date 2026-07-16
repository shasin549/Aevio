import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, Sun, Moon, Upload, Bell, User as UserIcon, 
  LogOut, ShieldAlert, X, Check, Menu, Video
} from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (view: string, refId?: string) => void;
  currentView: string;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onNavigate, currentView, toggleSidebar }) => {
  const { 
    currentUser, logout, theme, toggleTheme, notifications, 
    markNotificationRead, markAllNotificationsRead 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleNotificationClick = async (notif: any) => {
    await markNotificationRead(notif.id);
    setShowNotifications(false);
    if (notif.type === 'upload_completed' || notif.type === 'comment' || notif.type === 'like') {
      onNavigate('watch', notif.referenceId);
    } else if (notif.type === 'subscriber') {
      onNavigate('profile', notif.referenceId);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200">
      {/* Left section: Logo and burger */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-700 dark:text-zinc-300 transition-colors"
          id="menu-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div 
          onClick={() => { setSearchQuery(''); onSearch(''); onNavigate('home'); }} 
          className="flex items-center gap-1.5 cursor-pointer select-none"
          id="logo-container"
        >
          <div className="flex items-center justify-center w-9 h-9 bg-red-600 rounded-xl shadow-md shadow-red-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-gray-900 dark:text-white hidden sm:block">
            Stream<span className="text-red-600">Vibe</span>
          </span>
        </div>
      </div>

      {/* Middle section: Search bar with optional Upload button next to it */}
      <div className="flex-1 max-w-[620px] mx-4 flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Search titles, creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-l-full text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors"
              id="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); onSearch(''); }}
                className="absolute right-14 p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors"
                id="clear-search-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border-t border-b border-r border-gray-300 dark:border-zinc-700 rounded-r-full text-gray-700 dark:text-zinc-300 transition-colors"
              id="search-btn"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {currentUser?.isAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 shrink-0 shadow-sm ${
              currentView === 'upload'
                ? 'bg-red-600 text-white shadow-red-500/10'
                : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 shadow-black/5'
            }`}
            id="searchbar-upload-btn"
            title="Upload Video (Admin)"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        )}
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Dark/Light Mode */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-700 dark:text-zinc-300 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          id="theme-toggle-btn"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {currentUser?.isAdmin && (
          <>
            {/* Upload Button */}
            <button
              onClick={() => onNavigate('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                currentView === 'upload'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
              }`}
              id="header-upload-btn"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Upload</span>
            </button>

            {/* Notifications Panel */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-700 dark:text-zinc-300 transition-colors"
                id="notifications-toggle-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 divide-y divide-gray-100 dark:divide-zinc-800">
                  <div className="flex items-center justify-between p-3.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500 dark:text-zinc-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-start gap-2.5 ${
                            !notif.isRead ? 'bg-red-50/40 dark:bg-red-950/10' : ''
                          }`}
                        >
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-red-600 shrink-0 opacity-100" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }} />
                          <div className="flex-1">
                            <p className="text-gray-800 dark:text-zinc-200">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Account / Auth Dropdown */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-800 overflow-hidden cursor-pointer"
              id="user-profile-dropdown-btn"
            >
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1 divide-y divide-gray-100 dark:divide-zinc-800">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{currentUser.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setShowUserDropdown(false); onNavigate('profile', currentUser.id); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    My Channel
                  </button>

                  {currentUser.isAdmin && (
                    <button
                      onClick={() => { setShowUserDropdown(false); onNavigate('admin'); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      Admin Dashboard
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
