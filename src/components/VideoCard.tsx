import React from 'react';
import { Video } from '../types';
import { Eye, Clock } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  onCreatorClick?: (creatorId: string, e: React.MouseEvent) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onCreatorClick }) => {
  // Utility to format relative date
  const formatRelativeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins || 1}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Format views
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M views';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K views';
    }
    return views + ' views';
  };

  return (
    <div 
      onClick={onClick}
      className="group flex flex-col bg-transparent cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
      id={`video-card-${video.id}`}
    >
      {/* Thumbnail Wrapper */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-sm group-hover:shadow-lg transition-all duration-300">
        <img
          src={video.thumbnail}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Play Icon overlay */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-500/20 scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white tracking-wider">
          {video.duration || '00:00'}
        </span>
      </div>

      {/* Video Details */}
      <div className="flex gap-3.5 pt-3 px-1">
        {/* Creator Avatar */}
        <button
          onClick={(e) => {
            const isAevio = video.uploaderName === 'Aevio' || video.uploaderName === 'Official';
            if (isAevio) {
              e.stopPropagation();
              return;
            }
            if (onCreatorClick) {
              onCreatorClick(video.uploaderId, e);
            }
          }}
          className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 shadow-sm transition-opacity duration-200 ${(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') ? 'cursor-default' : 'hover:opacity-85'}`}
        >
          <img
            src={video.uploaderPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={video.uploaderName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </button>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-semibold text-sm leading-snug text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
          
          <button
            onClick={(e) => {
              const isAevio = video.uploaderName === 'Aevio' || video.uploaderName === 'Official';
              if (isAevio) {
                e.stopPropagation();
                return;
              }
              if (onCreatorClick) {
                onCreatorClick(video.uploaderId, e);
              }
            }}
            className={`text-[12px] font-medium text-gray-500 dark:text-zinc-400 mt-1 block transition-colors truncate ${(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') ? 'cursor-default' : 'hover:text-gray-900 dark:hover:text-white'}`}
          >
            {video.uploaderName}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 font-sans">
            <span>{formatViews(video.views)}</span>
            <span className="text-gray-300 dark:text-zinc-700">•</span>
            <span>{formatRelativeDate(video.uploadDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
