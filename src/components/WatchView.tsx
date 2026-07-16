import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Video, Comment, Playlist } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { 
  ThumbsUp, ThumbsDown, Share2, Plus, AlertTriangle, 
  Download, Send, CornerDownRight, Trash2, FolderPlus, 
  Clock, Lock, CheckCircle2, ChevronDown
} from 'lucide-react';

interface WatchViewProps {
  videoId: string;
  onNavigate: (view: string, refId?: string) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({ videoId, onNavigate }) => {
  const { 
    currentUser, token, likeVideo, dislikeVideo, subscribeChannel, 
    addComment, addReply, deleteComment, playlists, createPlaylist, 
    toggleVideoInPlaylist, reportVideo, videos, fetchVideos,
    fetchVideoDetails, fetchVideoComments
  } = useApp();

  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  
  const [showShareToast, setShowShareToast] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const loadVideoDetails = async () => {
    setIsLoading(true);
    try {
      const data = await fetchVideoDetails(videoId);
      setVideo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideoComments = async () => {
    try {
      const data = await fetchVideoComments(videoId);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVideoDetails();
    loadVideoComments();
  }, [videoId, token]);

  const handleLike = async () => {
    if (!currentUser) { onNavigate('login'); return; }
    try {
      const data = await likeVideo(videoId);
      setVideo((prev: any) => ({
        ...prev,
        likes: data.isLiked ? [...(prev.likes || []), currentUser.id] : (prev.likes || []).filter((id: string) => id !== currentUser.id),
        dislikes: (prev.dislikes || []).filter((id: string) => id !== currentUser.id),
        isLiked: data.isLiked,
        isDisliked: false
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) { onNavigate('login'); return; }
    try {
      const data = await dislikeVideo(videoId);
      setVideo((prev: any) => ({
        ...prev,
        dislikes: data.isDisliked ? [...(prev.dislikes || []), currentUser.id] : (prev.dislikes || []).filter((id: string) => id !== currentUser.id),
        likes: (prev.likes || []).filter((id: string) => id !== currentUser.id),
        isLiked: false,
        isDisliked: data.isDisliked
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) { onNavigate('login'); return; }
    try {
      const data = await subscribeChannel(video.uploaderId);
      setVideo((prev: any) => ({
        ...prev,
        isSubscribed: data.isSubscribed,
        subscribersCount: data.subscribersCount
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment = await addComment(videoId, commentText);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReplySubmit = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      const updatedComment = await addReply(commentId, text);
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommentClick = async (commentId: string) => {
    if (confirm('Delete comment?')) {
      try {
        await deleteComment(commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/#watch/${videoId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      });
  };

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      setIsCreatingPlaylist(true);
      const newPl = await createPlaylist(newPlaylistName, true);
      await toggleVideoInPlaylist(newPl.id, videoId);
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
    } catch (err) {
      console.error(err);
      setIsCreatingPlaylist(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await reportVideo(videoId, reportReason);
      setShowReportModal(false);
      setReportReason('');
      alert('Thank you. The video was flagged for administrator inspection.');
    } catch (err) {
      console.error(err);
    }
  };

  // Autoplay next video logic
  const handleAutoplayEnded = () => {
    const related = videos.filter(v => v.id !== videoId);
    if (related.length > 0) {
      onNavigate('watch', related[0].id);
    }
  };

  // Format Views helper
  const formatViews = (views: number) => {
    if (!views) return '0 views';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M views';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K views';
    return views + ' views';
  };

  const relatedVideos = videos.filter(v => v.id !== videoId);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 mt-3 font-medium">Loading player stream...</span>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Video Unavailable</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">This video may have been removed or marked private.</p>
        <button onClick={() => onNavigate('home')} className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl">
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 bg-transparent transition-colors duration-200">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Player & Meta details & Comments */}
        <div className="lg:col-span-2 space-y-5">
          <VideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            title={video.title}
            onEnded={handleAutoplayEnded}
          />

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
            {video.title}
          </h1>

          {/* Actions Bar & Creator Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1.5 border-b border-gray-100 dark:border-zinc-800 pb-5">
            {/* Creator profile */}
            <div className="flex items-center gap-3.5">
              <button 
                onClick={() => {
                  const isAevio = video.uploaderName === 'Aevio' || video.uploaderName === 'Official';
                  if (isAevio) return;
                  onNavigate('profile', video.uploaderId);
                }}
                disabled={video.uploaderName === 'Aevio' || video.uploaderName === 'Official'}
                className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 shadow-sm ${(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') ? 'cursor-default' : ''}`}
              >
                <img src={video.uploaderPhoto} alt={video.uploaderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
              <div className="min-w-0">
                <button 
                  onClick={() => {
                    const isAevio = video.uploaderName === 'Aevio' || video.uploaderName === 'Official';
                    if (isAevio) return;
                    onNavigate('profile', video.uploaderId);
                  }}
                  disabled={video.uploaderName === 'Aevio' || video.uploaderName === 'Official'}
                  className={`font-bold text-sm text-gray-900 dark:text-white hover:underline block text-left ${(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') ? 'cursor-default no-underline hover:no-underline' : ''}`}
                >
                  {video.uploaderName}
                </button>
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                  {(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') ? 'Official System Creator' : `${video.subscribersCount || 0} subscribers`}
                </span>
              </div>
              {!(video.uploaderName === 'Aevio' || video.uploaderName === 'Official') && (
                <button
                  onClick={handleSubscribe}
                  className={`ml-3.5 px-4 py-1.5 font-bold text-xs rounded-full shadow-md transition-all cursor-pointer ${
                    video.isSubscribed
                      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {video.isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              {/* Likes/Dislikes cluster */}
              <div className="flex items-center bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-200/50 dark:border-zinc-800/50 overflow-hidden shrink-0">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-4 py-2 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold ${
                    video.isLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-300'
                  }`}
                  id="like-btn"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{video.likes?.length || 0}</span>
                </button>
                <div className="h-4 w-px bg-gray-300 dark:bg-zinc-700" />
                <button
                  onClick={handleDislike}
                  className={`flex items-center px-3.5 py-2 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold ${
                    video.isDisliked ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-300'
                  }`}
                  id="dislike-btn"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Share */}
              <button
                onClick={handleShareClick}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-full text-xs font-semibold border border-gray-200/50 dark:border-zinc-800/50 transition-colors"
                id="share-btn"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              {/* Save to Playlist */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-full text-xs font-semibold border border-gray-200/50 dark:border-zinc-800/50 transition-colors"
                    id="save-playlist-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save</span>
                  </button>

                  {showPlaylistMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-3.5 divide-y divide-gray-100 dark:divide-zinc-800">
                      <div className="pb-2.5 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span>Save to Playlist</span>
                        <FolderPlus className="w-4 h-4 text-zinc-400" />
                      </div>
                      
                      <div className="py-2.5 max-h-40 overflow-y-auto space-y-2 text-xs">
                        {playlists.map(pl => {
                          const isIncluded = pl.videoIds.includes(videoId);
                          return (
                            <label key={pl.id} className="flex items-center gap-2.5 cursor-pointer text-gray-700 dark:text-zinc-300 font-medium">
                              <input
                                type="checkbox"
                                checked={isIncluded}
                                onChange={() => toggleVideoInPlaylist(pl.id, videoId)}
                                className="rounded text-red-600 focus:ring-red-500 accent-red-600 h-4 w-4"
                              />
                              <span className="truncate flex-1">{pl.name}</span>
                              {pl.isPrivate && <Lock className="w-3 h-3 text-zinc-500 shrink-0" />}
                            </label>
                          );
                        })}
                      </div>

                      <form onSubmit={handleCreatePlaylistSubmit} className="pt-2.5 flex gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="New playlist..."
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-xs rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isCreatingPlaylist}
                          className="px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                        >
                          Create
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Download Option for video creator */}
              {(currentUser?.id === video.uploaderId || currentUser?.isAdmin) && (
                <a
                  href={video.videoUrl}
                  download={video.title}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-full text-xs font-bold transition-colors"
                  title="Download raw file"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Download</span>
                </a>
              )}

              {/* Report button */}
              {currentUser && (
                <button
                  onClick={() => {
                    setShowReportModal(true);
                  }}
                  className="p-2 bg-gray-50 dark:bg-zinc-900 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/20 text-gray-400 rounded-full border border-gray-200/50 dark:border-zinc-800/50 transition-colors shrink-0"
                  title="Flag inappropriate video"
                  id="report-btn"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Description Box */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-zinc-200">
              <span>{formatViews(video.views)}</span>
              <span>•</span>
              <span>{new Date(video.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-zinc-400">#{video.category}</span>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
              {video.description || 'No description provided.'}
            </p>

            {video.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {video.tags.map((t: string) => (
                  <span key={t} className="text-xs font-semibold text-red-600 dark:text-red-400">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Toast */}
          {showShareToast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-slide-in border border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Share link copied to clipboard!</span>
            </div>
          )}

          {/* --- COMMENTS SECTION --- */}
          <div className="space-y-5 pt-4">
            <h3 className="font-sans font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <span>Comments</span>
              <span className="text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </h3>

            {/* Input Comment Box */}
            {currentUser ? (
              <form onSubmit={handleAddCommentSubmit} className="flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a public comment..."
                    className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-700 text-sm text-gray-900 dark:text-white py-1 focus:outline-none focus:border-red-600 placeholder-gray-400 resize-none"
                  />
                  {commentText && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setCommentText('')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-md"
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/10 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                  Comments are read-only for public visitors. Only platform administrators can leave comments.
                </span>
              </div>
            )}

            {/* Comments Lists */}
            <div className="space-y-6 pt-3">
              {comments.map((comm) => {
                const isCommAevio = comm.userName === 'Aevio' || comm.userName === 'Official';
                return (
                  <div key={comm.id} className="space-y-3">
                    <div className="flex gap-3.5 items-start">
                      <button 
                        onClick={() => {
                          if (isCommAevio) return;
                          onNavigate('profile', comm.userId);
                        }}
                        disabled={isCommAevio}
                        className={`w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm ${isCommAevio ? 'cursor-default' : ''}`}
                      >
                        <img src={comm.userPhoto} alt={comm.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              if (isCommAevio) return;
                              onNavigate('profile', comm.userId);
                            }}
                            disabled={isCommAevio}
                            className={`font-bold text-xs text-gray-900 dark:text-white truncate ${isCommAevio ? 'cursor-default no-underline hover:no-underline' : 'hover:underline'}`}
                          >
                            {comm.userName}
                          </button>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 mt-1 leading-relaxed">
                          {comm.comment}
                        </p>

                        {/* Comment actions (Reply, Delete) */}
                        <div className="flex items-center gap-3.5 mt-2 text-[11px] text-gray-400 dark:text-zinc-500 font-semibold select-none">
                          {currentUser && (
                            <button
                              onClick={() => {
                                setActiveReplyId(activeReplyId === comm.id ? null : comm.id);
                                setReplyTexts(prev => ({ ...prev, [comm.id]: '' }));
                              }}
                              className="hover:text-red-600 transition-colors"
                            >
                              Reply
                            </button>
                          )}
                          {(currentUser?.id === comm.userId || currentUser?.id === video.uploaderId || currentUser?.isAdmin) && (
                            <button
                              onClick={() => handleDeleteCommentClick(comm.id)}
                              className="hover:text-red-600 hover:underline text-red-500 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies nesting list */}
                    {comm.replies?.length > 0 && (
                      <div className="pl-12 space-y-4 pt-1 border-l border-zinc-200 dark:border-zinc-800 ml-5">
                        {comm.replies.map((reply) => {
                          const isReplyAevio = reply.userName === 'Aevio' || reply.userName === 'Official';
                          return (
                            <div key={reply.id} className="flex gap-3 items-start">
                              <button 
                                onClick={() => {
                                  if (isReplyAevio) return;
                                  onNavigate('profile', reply.userId);
                                }}
                                disabled={isReplyAevio}
                                className={`w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm ${isReplyAevio ? 'cursor-default' : ''}`}
                              >
                                <img src={reply.userPhoto} alt={reply.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      if (isReplyAevio) return;
                                      onNavigate('profile', reply.userId);
                                    }}
                                    disabled={isReplyAevio}
                                    className={`font-bold text-xs text-gray-900 dark:text-white truncate ${isReplyAevio ? 'cursor-default no-underline hover:no-underline' : 'hover:underline'}`}
                                  >
                                    {reply.userName}
                                  </button>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                                  {reply.comment}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Inline Reply input */}
                  {activeReplyId === comm.id && currentUser && (
                    <form 
                      onSubmit={(e) => handleAddReplySubmit(comm.id, e)} 
                      className="pl-12 flex gap-3 items-center ml-5 pt-1.5"
                    >
                      <CornerDownRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder={`Reply to ${comm.userName}...`}
                        value={replyTexts[comm.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [comm.id]: e.target.value }))}
                        className="flex-1 bg-transparent border-b border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white py-1.5 focus:outline-none focus:border-red-600"
                      />
                      <button type="submit" className="p-1.5 text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Related Videos sidebar list */}
        <div className="space-y-4">
          <h3 className="font-sans font-bold text-sm text-gray-900 dark:text-white mb-2">Up Next</h3>

          {relatedVideos.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No related videos found.</p>
          ) : (
            relatedVideos.map((rel) => (
              <div 
                key={rel.id}
                onClick={() => onNavigate('watch', rel.id)}
                className="group flex gap-3.5 cursor-pointer rounded-2xl overflow-hidden hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 p-1.5 transition-colors duration-200"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-32 sm:w-36 overflow-hidden bg-zinc-100 dark:bg-zinc-800 rounded-xl shrink-0">
                  <img src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono font-medium text-white tracking-wider">
                    {rel.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {rel.title}
                  </h4>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 block truncate">
                    {rel.uploaderName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 font-sans">
                    <span>{formatViews(rel.views)}</span>
                    <span>•</span>
                    <span>{new Date(rel.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Flag Report Modal popup */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleReportSubmit} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report Inappropriate Content
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
              If this video breaches platform terms, contains extreme violence, hate speech, or spam, state your reasons below. It will be submitted to moderators instantly.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g., Copyright violation, explicit media..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full mt-4 p-3 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-sm text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
            <div className="flex justify-end gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-xs font-bold text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/15"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
