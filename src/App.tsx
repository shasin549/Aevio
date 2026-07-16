import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoCard } from './components/VideoCard';
import { WatchView } from './components/WatchView';
import { ProfileView } from './components/ProfileView';
import { PlaylistView } from './components/PlaylistView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { UploadModal } from './components/UploadModal';
import { Video } from './types';
import { 
  Compass, Flame, ListVideo, Loader2, ArrowUpCircle, Sparkles, Filter 
} from 'lucide-react';

function Dashboard() {
  const { 
    videos, fetchVideos, isLoading, currentUser, error, setError 
  } = useApp();

  // Navigation states
  const [currentView, setCurrentView] = useState('home');
  const [activeParam, setActiveParam] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');

  // Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(8);
  const [isScrollingMore, setIsScrollingMore] = useState(false);

  // Categories list
  const categories = ['All', 'Music', 'Gaming', 'Education', 'Tech & Science', 'Entertainment', 'Sports', 'Vlogs'];

  // Handle direct navigation
  const handleNavigate = (view: string, param?: string) => {
    setError(null);
    if (view === 'upload') {
      setShowUploadModal(true);
      return;
    }

    if (view === 'admin') {
      if (window.location.pathname !== '/admin-secret-panel') {
        window.history.pushState(null, '', '/admin-secret-panel');
      }
    } else if (window.location.pathname === '/admin-secret-panel') {
      window.history.pushState(null, '', '/');
    }

    setCurrentView(view);
    setActiveParam(param || null);
    
    // Auto-scroll to top
    const mainEl = document.getElementById('main-scroll-container');
    if (mainEl) mainEl.scrollTop = 0;
  };

  // Listen for /admin-secret-panel URL
  useEffect(() => {
    const checkSecretUrl = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/admin-secret-panel' || hash === '#/admin-secret-panel' || hash === '#admin-secret-panel') {
        handleNavigate('admin');
      }
    };
    checkSecretUrl();
    window.addEventListener('popstate', checkSecretUrl);
    window.addEventListener('hashchange', checkSecretUrl);
    return () => {
      window.removeEventListener('popstate', checkSecretUrl);
      window.removeEventListener('hashchange', checkSecretUrl);
    };
  }, []);

  // Sync Category or Search Query to API fetch
  useEffect(() => {
    if (currentView === 'home' || currentView === 'trending') {
      const sorting = currentView === 'trending' ? 'trending' : sortBy;
      fetchVideos({
        search: searchQuery,
        category: selectedCategory,
        sort: sorting
      });
      // Reset visible counts for infinite scroll
      setVisibleCount(8);
    }
  }, [searchQuery, selectedCategory, sortBy, currentView]);

  // Infinite Scroll Trigger
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Check if user scrolled close to bottom
    const bottomReached = target.scrollHeight - target.scrollTop <= target.clientHeight + 40;
    
    if (bottomReached && !isScrollingMore && visibleCount < videos.length) {
      setIsScrollingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + 4);
        setIsScrollingMore(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Platform Header */}
      <Header
        onSearch={(q) => { setSearchQuery(q); handleNavigate('home'); }}
        onNavigate={handleNavigate}
        currentView={currentView}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
        />

        {/* Primary Scroll Container */}
        <main 
          id="main-scroll-container"
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto h-[calc(100vh-57px)] flex flex-col transition-all duration-300 relative"
        >
          {error && (
            <div className="m-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950 text-xs text-red-600 dark:text-red-400 rounded-xl font-medium shrink-0">
              {error}
            </div>
          )}

          {/* VIEW SWITCHER */}
          {currentView === 'home' || currentView === 'trending' ? (
            /* Home & Trending Feeds */
            <div className="px-4 lg:px-8 py-5 flex-1 flex flex-col">
              
              {/* Category Filters Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 shrink-0 no-scrollbar select-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-red-600 text-white shadow-md shadow-red-500/10'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                {/* Sort drop filter (only on Home, not Trending) */}
                {currentView === 'home' && (
                  <div className="flex items-center gap-1.5 ml-auto pl-4 border-l border-gray-200 dark:border-zinc-800 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-bold text-gray-500 dark:text-zinc-400 focus:outline-none cursor-pointer"
                    >
                      <option value="latest">Latest</option>
                      <option value="trending">Trending</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Feed Title */}
              <div className="flex items-center gap-2 mb-5 shrink-0 pt-1">
                {currentView === 'trending' ? (
                  <>
                    <Flame className="w-5 h-5 text-red-600 animate-pulse" />
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Trending Feed</h2>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-red-500" />
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Recommended</h2>
                  </>
                )}
              </div>

              {/* Videos Feed Grid */}
              {isLoading && videos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  <span className="text-xs text-gray-400 mt-3 font-medium">Assembling recommendation lists...</span>
                </div>
              ) : videos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl min-h-[300px]">
                  <Compass className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-2.5" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">No videos match your search query.</p>
                  <p className="text-xs text-gray-400 mt-1">Try broad keywords, checking spelling, or resetting categories.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} 
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {videos.slice(0, visibleCount).map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleNavigate('watch', video.id)}
                        onCreatorClick={(creatorId, e) => {
                          e.stopPropagation();
                          handleNavigate('profile', creatorId);
                        }}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll loading indicator */}
                  {visibleCount < videos.length && (
                    <div className="flex justify-center py-6">
                      {isScrollingMore ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          <span>Loading more...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setVisibleCount(prev => prev + 4)}
                          className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-bold text-gray-600 dark:text-zinc-300 rounded-xl"
                        >
                          Load More Content
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : currentView === 'watch' && activeParam ? (
            <WatchView videoId={activeParam} onNavigate={handleNavigate} />
          ) : currentView === 'profile' && activeParam ? (
            <ProfileView userId={activeParam} onNavigate={handleNavigate} />
          ) : currentView === 'playlist' && activeParam ? (
            <PlaylistView playlistId={activeParam} onNavigate={handleNavigate} />
          ) : currentView === 'admin' ? (
            <AdminPanel onNavigate={handleNavigate} />
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">Section placeholder</div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
