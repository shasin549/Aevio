import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Video } from '../types';
import { VideoCard } from './VideoCard';
import { Edit2, Save, Trash2, Eye, ShieldCheck, Heart, Tv } from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  onNavigate: (view: string, refId?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onNavigate }) => {
  const { currentUser, subscribeChannel, deleteVideo, fetchUserProfile } = useApp();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const { updateProfile } = useApp();

  const isOwner = currentUser?.id === userId;

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchUserProfile(userId);
      setProfile(data);
      setEditName(data.name);
      setEditBio(data.bio);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      setErrorMsg(err.message || 'Failed to load user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    try {
      const data = await subscribeChannel(userId);
      setProfile((prev: any) => ({
        ...prev,
        subscribersCount: data.subscribersCount,
        isSubscribed: data.isSubscribed
      }));
    } catch (err) {
      console.error('Subscription change failed:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editName, editBio);
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you absolutely sure you want to delete this video? This cannot be undone.')) {
      try {
        await deleteVideo(videoId);
        loadProfile();
      } catch (err) {
        console.error('Delete action failed:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 mt-3 font-medium">Loading channel...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-transparent">
        <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl max-w-md border border-red-100 dark:border-red-900/30">
          <h3 className="text-base font-bold text-red-600 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">{errorMsg}</p>
        </div>
        <button 
          onClick={() => onNavigate('home')}
          className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Channel Not Found</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">The creator or channel does not exist on this platform.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-transparent pb-12 transition-colors duration-200">
      {/* Banner */}
      <div className="h-44 sm:h-56 w-full relative bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80"
          alt="Channel Banner"
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Profile Header Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 sm:-mt-14 relative z-10 mb-8 pb-6 border-b border-gray-200 dark:border-zinc-800">
          
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-[#0f0f0f] shadow-lg overflow-hidden bg-white shrink-0">
            <img
              src={profile.profilePhoto}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Meta */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1.5">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-zinc-700 text-sm font-bold rounded-xl text-gray-900 dark:text-white"
                />
              ) : (
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5 truncate">
                  {profile.name}
                  {profile.isAdmin && (
                    <span className="p-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" title="Platform Administrator">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </h1>
              )}

              {/* Action Buttons (Subscribe or Edit) */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isOwner ? (
                  isEditing ? (
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold text-xs rounded-full transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className={`px-5 py-2 font-bold text-xs rounded-full shadow-md transition-all cursor-pointer ${
                      profile.isSubscribed
                        ? 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-700'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10'
                    }`}
                  >
                    {profile.isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>

            {/* Platform Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-sans text-gray-500 dark:text-zinc-400">
              <span className="font-semibold text-gray-800 dark:text-zinc-200">
                {profile.subscribersCount} <span className="font-normal text-gray-400 dark:text-zinc-500">subscribers</span>
              </span>
              <span className="text-gray-300 dark:text-zinc-700">•</span>
              <span className="font-semibold text-gray-800 dark:text-zinc-200">
                {profile.totalViews} <span className="font-normal text-gray-400 dark:text-zinc-500">total views</span>
              </span>
              <span className="text-gray-300 dark:text-zinc-700">•</span>
              <span className="font-semibold text-gray-800 dark:text-zinc-200">
                {profile.videos?.length || 0} <span className="font-normal text-gray-400 dark:text-zinc-500">videos</span>
              </span>
            </div>

            {/* Bio */}
            <div className="mt-3.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-zinc-700 text-xs rounded-xl text-gray-900 dark:text-white focus:outline-none resize-none"
                />
              ) : (
                <p className="italic">{profile.bio || "No channel biography declared yet."}</p>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Videos Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Tv className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
            Uploaded Videos
          </h2>

          {!profile.videos || profile.videos.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
              <p className="text-sm text-gray-400 dark:text-zinc-500">No videos published yet.</p>
              {isOwner && (
                <button
                  onClick={() => onNavigate('upload')}
                  className="mt-3 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl"
                >
                  Publish First Video
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {profile.videos.map((video: Video) => (
                <div key={video.id} className="relative group">
                  <VideoCard
                    video={video}
                    onClick={() => onNavigate('watch', video.id)}
                  />
                  {/* Delete Option on hover if owner or admin */}
                  {(isOwner || currentUser?.isAdmin) && (
                    <button
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="absolute top-2.5 right-2.5 p-2 bg-black/75 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Delete Video"
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
