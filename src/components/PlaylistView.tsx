import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { VideoCard } from './VideoCard';
import { Play, Trash2, ListMusic, Lock, Globe } from 'lucide-react';

interface PlaylistViewProps {
  playlistId: string;
  onNavigate: (view: string, refId?: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onNavigate }) => {
  const { currentUser, toggleVideoInPlaylist, fetchPlaylistVideos } = useApp();

  const [playlist, setPlaylist] = useState<any>(null);
  const [videosList, setVideosList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlaylistDetails = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPlaylistVideos(playlistId);
      setPlaylist(data.playlist);
      setVideosList(data.videos);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlistId]);

  const handleRemoveFromPlaylist = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleVideoInPlaylist(playlistId, videoId);
      loadPlaylistDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayAll = () => {
    if (videosList.length > 0) {
      onNavigate('watch', videosList[0].id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 mt-3 font-medium">Loading playlist...</span>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Playlist Unavailable</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">This list could be private or removed.</p>
        <button onClick={() => onNavigate('home')} className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl">
          Back to Feed
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.id === playlist.userId;

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Playlist Card / Metadata */}
        <div className="w-full md:w-80 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-3xl p-5 shrink-0 flex flex-col h-fit">
          <div className="aspect-video w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
            {videosList.length > 0 ? (
              <img src={videosList[0].thumbnail} alt="Cover" className="w-full h-full object-cover opacity-80 blur-[1px]" />
            ) : null}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
              <ListMusic className="w-10 h-10 mb-2" />
              <span className="text-xs font-mono font-semibold">{videosList.length} Videos</span>
            </div>
          </div>

          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
            {playlist.name}
          </h1>

          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-gray-500 dark:text-zinc-400">
            {playlist.isPrivate ? (
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Private
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Public
              </span>
            )}
            <span>•</span>
            <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
          </div>

          <button
            onClick={handlePlayAll}
            disabled={videosList.length === 0}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play All
          </button>
        </div>

        {/* Playlist videos grid/list */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            Playlist Videos
          </h2>

          {videosList.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
              <p className="text-sm text-gray-400 dark:text-zinc-500">This playlist is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videosList.map((video) => (
                <div key={video.id} className="relative group">
                  <VideoCard
                    video={video}
                    onClick={() => onNavigate('watch', video.id)}
                  />
                  {isOwner && (
                    <button
                      onClick={(e) => handleRemoveFromPlaylist(video.id, e)}
                      className="absolute top-2.5 right-2.5 p-2 bg-black/75 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
