import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Video, Comment, Playlist, AppNotification, Analytics } from '../types';

interface AppContextType {
  currentUser: User | null;
  token: string | null;
  videos: Video[];
  playlists: Playlist[];
  notifications: AppNotification[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, bio?: string, profilePhoto?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, bio: string, profilePhoto?: string) => Promise<void>;
  fetchVideos: (filters?: { search?: string; category?: string; tag?: string; sort?: string; creatorId?: string }) => Promise<void>;
  uploadVideo: (videoData: Partial<Video> & { videoUrl: string }) => Promise<Video>;
  likeVideo: (videoId: string) => Promise<{ likesCount: number; dislikesCount: number; isLiked: boolean }>;
  dislikeVideo: (videoId: string) => Promise<{ likesCount: number; dislikesCount: number; isDisliked: boolean }>;
  deleteVideo: (videoId: string) => Promise<void>;
  subscribeChannel: (channelId: string) => Promise<{ isSubscribed: boolean; subscribersCount: number }>;
  addComment: (videoId: string, text: string) => Promise<Comment>;
  addReply: (commentId: string, text: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, isPrivate: boolean) => Promise<Playlist>;
  toggleVideoInPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  reportVideo: (videoId: string, reason: string) => Promise<void>;
  fetchAdminAnalytics: () => Promise<Analytics>;
  fetchAdminUsers: () => Promise<User[]>;
  toggleAdminUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  fetchVideoDetails: (videoId: string) => Promise<any>;
  fetchVideoComments: (videoId: string) => Promise<Comment[]>;
  fetchPlaylistVideos: (playlistId: string) => Promise<any>;
  fetchUserProfile: (userId: string) => Promise<any>;
  error: string | null;
  setError: (err: string | null) => void;
}

const isUserAdmin = (user: any): boolean => {
  if (!user) return false;
  return !!(user.isAdmin || user.id === 'admin-user' || (user.email && user.email.toLowerCase() === 'shasinsha7384@gmail.com'));
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('yt_token'));
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('yt_theme') as 'light' | 'dark') || 'dark');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalStorageDb, setUseLocalStorageDb] = useState<boolean>(() => {
    return localStorage.getItem('yt_offline_mode') === 'true';
  });

  // --- OFFLINE / FALLBACK LOCALSTORAGE DB HELPERS ---
  const getStoredUsers = (): User[] => {
    const val = localStorage.getItem('yt_users_fallback');
    if (!val) {
      const initUsers: User[] = [
        {
          id: 'admin-user',
          name: 'Admin Developer',
          email: 'shasinsha7384@gmail.com',
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Primary administrator of the Video Sharing platform.',
          subscribers: [],
          subscribedTo: [],
          createdAt: new Date('2026-01-01').toISOString(),
          isAdmin: true
        }
      ];
      localStorage.setItem('yt_users_fallback', JSON.stringify(initUsers));
      return initUsers;
    }
    return JSON.parse(val);
  };

  const saveStoredUsers = (users: User[]) => {
    localStorage.setItem('yt_users_fallback', JSON.stringify(users));
  };

  const getStoredVideos = (): Video[] => {
    const val = localStorage.getItem('yt_videos_fallback');
    if (!val) {
      const initVideos: Video[] = [
        {
          id: 'vid-1',
          title: 'Stunning Big Buck Bunny CGI Animation',
          description: 'The classic Open Movie Project masterpiece. Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
          uploaderId: 'admin-user',
          uploaderName: 'Admin Developer',
          uploaderPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          tags: ['animation', 'cgi', 'bunny'],
          category: 'Film & Animation',
          views: 1240,
          likes: ['admin-user'],
          dislikes: [],
          visibility: 'public',
          uploadDate: new Date('2026-06-15').toISOString(),
          duration: '09:56'
        },
        {
          id: 'vid-2',
          title: 'Cosmic Journey through the Nebula',
          description: 'Embark on a stellar and peaceful journey through deep space, galaxies, and supernovas. Perfect ambient visual for coding and study focus.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
          uploaderId: 'admin-user',
          uploaderName: 'Admin Developer',
          uploaderPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          tags: ['space', 'cosmic', 'relax'],
          category: 'Tech & Science',
          views: 890,
          likes: [],
          dislikes: [],
          visibility: 'public',
          uploadDate: new Date('2026-07-01').toISOString(),
          duration: '00:15'
        },
        {
          id: 'vid-3',
          title: 'Full Stack Development Workspace Beats',
          description: 'Relaxing ambient music beats paired with warm mechanical keyboard clicks. Programmers paradise.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
          uploaderId: 'admin-user',
          uploaderName: 'Admin Developer',
          uploaderPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          tags: ['coding', 'music', 'lofi'],
          category: 'Music',
          views: 4500,
          likes: ['admin-user'],
          dislikes: [],
          visibility: 'public',
          uploadDate: new Date('2026-07-10').toISOString(),
          duration: '00:14'
        }
      ];
      localStorage.setItem('yt_videos_fallback', JSON.stringify(initVideos));
      return initVideos;
    }
    return JSON.parse(val);
  };

  const saveStoredVideos = (videosList: Video[]) => {
    localStorage.setItem('yt_videos_fallback', JSON.stringify(videosList));
  };

  const getStoredComments = (): Comment[] => {
    const val = localStorage.getItem('yt_comments_fallback');
    if (!val) {
      const initComments: Comment[] = [
        {
          id: 'comment-1',
          userId: 'admin-user',
          userName: 'Admin Developer',
          userPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          videoId: 'vid-1',
          comment: 'Welcome to the platform! This is a test comment showing how fully interactive Vercel builds are.',
          replies: [],
          createdAt: new Date('2026-07-15T12:00:00.000Z').toISOString()
        }
      ];
      localStorage.setItem('yt_comments_fallback', JSON.stringify(initComments));
      return initComments;
    }
    return JSON.parse(val);
  };

  const saveStoredComments = (commentsList: Comment[]) => {
    localStorage.setItem('yt_comments_fallback', JSON.stringify(commentsList));
  };

  const getStoredPlaylists = (): Playlist[] => {
    const val = localStorage.getItem('yt_playlists_fallback');
    if (!val) {
      const initPlaylists: Playlist[] = [
        {
          id: 'play-1',
          userId: 'admin-user',
          name: 'Watch Later',
          videoIds: ['vid-1', 'vid-2'],
          isPrivate: true,
          createdAt: new Date('2026-05-12').toISOString()
        },
        {
          id: 'play-2',
          userId: 'admin-user',
          name: 'Coding Focus',
          videoIds: ['vid-3'],
          isPrivate: false,
          createdAt: new Date('2026-06-05').toISOString()
        }
      ];
      localStorage.setItem('yt_playlists_fallback', JSON.stringify(initPlaylists));
      return initPlaylists;
    }
    return JSON.parse(val);
  };

  const saveStoredPlaylists = (playlistsList: Playlist[]) => {
    localStorage.setItem('yt_playlists_fallback', JSON.stringify(playlistsList));
  };

  const getStoredNotifications = (): AppNotification[] => {
    const val = localStorage.getItem('yt_notifications_fallback');
    if (!val) {
      const initNotifs: AppNotification[] = [
        {
          id: 'notif-1',
          userId: 'admin-user',
          type: 'subscriber',
          message: 'Luna Harmonies subscribed to your channel!',
          isRead: false,
          createdAt: new Date('2026-07-15T09:00:00.000Z').toISOString(),
          referenceId: 'creator-music'
        }
      ];
      localStorage.setItem('yt_notifications_fallback', JSON.stringify(initNotifs));
      return initNotifs;
    }
    return JSON.parse(val);
  };

  const saveStoredNotifications = (notificationsList: AppNotification[]) => {
    localStorage.setItem('yt_notifications_fallback', JSON.stringify(notificationsList));
  };

  const getStoredReports = (): any[] => {
    const val = localStorage.getItem('yt_reports_fallback');
    if (!val) {
      localStorage.setItem('yt_reports_fallback', JSON.stringify([]));
      return [];
    }
    return JSON.parse(val);
  };

  const saveStoredReports = (reportsList: any[]) => {
    localStorage.setItem('yt_reports_fallback', JSON.stringify(reportsList));
  };

  // Server detection and silent fallback trigger
  useEffect(() => {
    const detectBackend = async () => {
      try {
        const res = await fetch('/api/videos', { method: 'GET' });
        const contentType = res.headers.get('content-type');
        if (!res.ok || (contentType && contentType.includes('text/html'))) {
          throw new Error('Not a JSON response');
        }
        setUseLocalStorageDb(false);
        localStorage.setItem('yt_offline_mode', 'false');
      } catch (err) {
        console.warn('API server is not responding or not found (common on Vercel static hosting). Enabling client-side LocalStorage DB fallback.', err);
        setUseLocalStorageDb(true);
        localStorage.setItem('yt_offline_mode', 'true');
      }
    };
    detectBackend();
  }, []);

  // Apply Theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#0f0f0f';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f9f9f9';
    }
    localStorage.setItem('yt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Set auth header helper
  const getHeaders = (customHeaders = {}) => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders
    };
  };

  // Helper to parse JSON responses safely and avoid cryptic "Unexpected token 'T'..." syntax errors when hosted on static providers like Vercel
  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>') || text.includes('The page c') || text.includes('Cannot GET') || text.includes('not found') || text.includes('Not Found')) {
        throw new Error(
          'API backend server not found or returned HTML. If you deployed to Vercel, please note that Vercel only hosts the static frontend and does not run the backend Express server (server.ts). Please use the Google Cloud Run preview URL or run the server locally.'
        );
      }
      throw new Error(`Expected JSON response, but received: ${contentType || 'plain text'}`);
    }
    return res.json();
  };

  // Get current user profile if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      if (useLocalStorageDb) {
        const users = getStoredUsers();
        const user = users.find(u => u.id === token);
        if (user) {
          setCurrentUser(user);
          // Initial loads
          setPlaylists(getStoredPlaylists().filter(p => p.userId === user.id));
          setNotifications(getStoredNotifications().filter(n => n.userId === user.id));
        } else {
          logout();
        }
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: getHeaders()
        });
        if (res.ok) {
          const userData = await parseJsonResponse(res);
          setCurrentUser(userData);
          // Initial loads
          fetchPlaylists();
          fetchNotifications();
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to restore user:', err);
        // Try localStorage lookup as safeguard
        const users = getStoredUsers();
        const user = users.find(u => u.id === token);
        if (user) {
          setCurrentUser(user);
          setPlaylists(getStoredPlaylists().filter(p => p.userId === user.id));
          setNotifications(getStoredNotifications().filter(n => n.userId === user.id));
        } else {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [token, useLocalStorageDb]);

  // Load initial public video feed
  useEffect(() => {
    fetchVideos();
  }, [token, useLocalStorageDb]);

  // Login
  const login = async (email: string, password: string) => {
    setError(null);
    if (useLocalStorageDb) {
      const users = getStoredUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('Email not found in client-side fallback database. Feel free to Register a new account!');
      }
      localStorage.setItem('yt_token', user.id);
      setToken(user.id);
      setCurrentUser(user);
      setPlaylists(getStoredPlaylists().filter(p => p.userId === user.id));
      setNotifications(getStoredNotifications().filter(n => n.userId === user.id));
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Login failed.');

      localStorage.setItem('yt_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Register
  const register = async (name: string, email: string, password: string, bio?: string, profilePhoto?: string) => {
    setError(null);
    if (useLocalStorageDb) {
      const users = getStoredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error('Email already registered in client-side fallback database.');
      }
      const defaultPhoto = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`;
      const newUser: User = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name,
        email: email.toLowerCase(),
        profilePhoto: profilePhoto || defaultPhoto,
        bio: bio || 'Welcome to my channel!',
        subscribers: [],
        subscribedTo: [],
        createdAt: new Date().toISOString(),
        isAdmin: email.toLowerCase() === 'shasinsha7384@gmail.com'
      };
      users.push(newUser);
      saveStoredUsers(users);

      localStorage.setItem('yt_token', newUser.id);
      setToken(newUser.id);
      setCurrentUser(newUser);
      setPlaylists([]);
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, bio, profilePhoto })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      localStorage.setItem('yt_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('yt_token');
    setToken(null);
    setCurrentUser(null);
    setPlaylists([]);
    setNotifications([]);
  };

  // Update profile
  const updateProfile = async (name: string, bio: string, profilePhoto?: string) => {
    setError(null);
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const users = getStoredUsers();
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            name,
            bio,
            profilePhoto: profilePhoto || u.profilePhoto
          };
        }
        return u;
      });
      saveStoredUsers(updatedUsers);
      const updatedUser = updatedUsers.find(u => u.id === currentUser.id)!;
      setCurrentUser(updatedUser);

      // Update uploader headers in fallback videos list
      const videosList = getStoredVideos().map(v => {
        if (v.uploaderId === currentUser.id) {
          return {
            ...v,
            uploaderName: name,
            uploaderPhoto: profilePhoto || v.uploaderPhoto
          };
        }
        return v;
      });
      saveStoredVideos(videosList);
      setVideos(videosList);
      return;
    }
    try {
      const res = await fetch('/api/users/profile/update', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name, bio, profilePhoto })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      setCurrentUser(data);
      // Refresh current videos list
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch Videos
  const fetchVideos = async (filters?: { search?: string; category?: string; tag?: string; sort?: string; creatorId?: string }) => {
    if (useLocalStorageDb) {
      const isRequesterAdmin = currentUser && currentUser.isAdmin;
      const usersList = getStoredUsers();
      let filtered = getStoredVideos();

      if (filters) {
        if (filters.creatorId) {
          const creatorUser = usersList.find(u => u.id === filters.creatorId);
          if (isUserAdmin(creatorUser) && !isRequesterAdmin) {
            filtered = [];
          } else {
            filtered = filtered.filter(v => v.uploaderId === filters.creatorId);
          }
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          filtered = filtered.filter(v => {
            const uploader = usersList.find(u => u.id === v.uploaderId);
            const isUploaderAdmin = isUserAdmin(uploader);
            const uName = (isUploaderAdmin && !isRequesterAdmin) ? 'aevio' : v.uploaderName.toLowerCase();
            return v.title.toLowerCase().includes(s) || 
              v.description.toLowerCase().includes(s) || 
              uName.includes(s) ||
              v.tags.some(t => t.toLowerCase().includes(s))
          });
        }
        if (filters.category) {
          filtered = filtered.filter(v => v.category === filters.category);
        }
        if (filters.tag) {
          filtered = filtered.filter(v => v.tags.includes(filters.tag!));
        }
        if (filters.sort) {
          if (filters.sort === 'views') {
            filtered = [...filtered].sort((a, b) => b.views - a.views);
          } else if (filters.sort === 'likes') {
            filtered = [...filtered].sort((a, b) => (b.likes || []).length - (a.likes || []).length);
          } else {
            filtered = [...filtered].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
          }
        }
      } else {
        // default latest sort
        filtered = [...filtered].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      }

      // Mask admin uploader info for non-admins
      const masked = filtered.map(v => {
        const uploader = usersList.find(u => u.id === v.uploaderId);
        if (isUserAdmin(uploader) && !isRequesterAdmin) {
          return {
            ...v,
            uploaderName: 'Aevio',
            uploaderPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
          };
        }
        return v;
      });

      setVideos(masked);
      return;
    }
    try {
      let query = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.tag) params.append('tag', filters.tag);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.creatorId) params.append('creatorId', filters.creatorId);
        query = '?' + params.toString();
      }

      const res = await fetch(`/api/videos${query}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  };

  // Upload Video
  const uploadVideo = async (videoData: Partial<Video> & { videoUrl: string }) => {
    setError(null);
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('You must be logged in to upload videos.');
      const allvids = getStoredVideos();
      const newVid: Video = {
        id: 'vid-' + Math.random().toString(36).substr(2, 9),
        title: videoData.title || 'Untitled Video',
        description: videoData.description || '',
        videoUrl: videoData.videoUrl,
        thumbnail: videoData.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        uploaderId: currentUser.id,
        uploaderName: currentUser.name,
        uploaderPhoto: currentUser.profilePhoto,
        tags: videoData.tags || [],
        category: videoData.category || 'People & Blogs',
        views: 0,
        likes: [],
        dislikes: [],
        visibility: videoData.visibility || 'public',
        uploadDate: new Date().toISOString(),
        duration: videoData.duration || '00:15'
      };
      allvids.push(newVid);
      saveStoredVideos(allvids);
      setVideos(prev => [newVid, ...prev]);
      return newVid;
    }
    try {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(videoData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      // Refresh videos list
      fetchVideos();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Like Video
  const likeVideo = async (videoId: string) => {
    if (!token) throw new Error('You must be logged in to like videos.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('You must be logged in to like videos.');
      const allvids = getStoredVideos();
      let likesCount = 0;
      let dislikesCount = 0;
      let isLiked = false;

      const updated = allvids.map(v => {
        if (v.id === videoId) {
          let likesList = [...(v.likes || [])];
          let dislikesList = [...(v.dislikes || [])];
          
          if (likesList.includes(currentUser.id)) {
            likesList = likesList.filter(id => id !== currentUser.id);
            isLiked = false;
          } else {
            likesList.push(currentUser.id);
            dislikesList = dislikesList.filter(id => id !== currentUser.id);
            isLiked = true;
          }
          
          likesCount = likesList.length;
          dislikesCount = dislikesList.length;
          
          return { ...v, likes: likesList, dislikes: dislikesList };
        }
        return v;
      });
      saveStoredVideos(updated);
      setVideos(updated);
      return { likesCount, dislikesCount, isLiked };
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Dislike Video
  const dislikeVideo = async (videoId: string) => {
    if (!token) throw new Error('You must be logged in to dislike videos.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('You must be logged in to dislike videos.');
      const allvids = getStoredVideos();
      let likesCount = 0;
      let dislikesCount = 0;
      let isDisliked = false;

      const updated = allvids.map(v => {
        if (v.id === videoId) {
          let likesList = [...(v.likes || [])];
          let dislikesList = [...(v.dislikes || [])];
          
          if (dislikesList.includes(currentUser.id)) {
            dislikesList = dislikesList.filter(id => id !== currentUser.id);
            isDisliked = false;
          } else {
            dislikesList.push(currentUser.id);
            likesList = likesList.filter(id => id !== currentUser.id);
            isDisliked = true;
          }
          
          likesCount = likesList.length;
          dislikesCount = dislikesList.length;
          
          return { ...v, likes: likesList, dislikes: dislikesList };
        }
        return v;
      });
      saveStoredVideos(updated);
      setVideos(updated);
      return { likesCount, dislikesCount, isDisliked };
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/dislike`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete Video
  const deleteVideo = async (videoId: string) => {
    if (useLocalStorageDb) {
      const remaining = getStoredVideos().filter(v => v.id !== videoId);
      saveStoredVideos(remaining);
      setVideos(remaining);
      return;
    }
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete video.');
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Toggle Subscribe channel
  const subscribeChannel = async (channelId: string) => {
    if (!token) throw new Error('You must be logged in to subscribe to channels.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const users = getStoredUsers();
      const targetUser = users.find(u => u.id === channelId);
      if (isUserAdmin(targetUser) && !currentUser.isAdmin) {
        throw new Error('Channel not found');
      }
      let isSubscribed = false;
      let subscribersCount = 0;

      const updatedUsers = users.map(u => {
        if (u.id === channelId) {
          let subs = [...(u.subscribers || [])];
          if (subs.includes(currentUser.id)) {
            subs = subs.filter(id => id !== currentUser.id);
            isSubscribed = false;
          } else {
            subs.push(currentUser.id);
            isSubscribed = true;
          }
          subscribersCount = subs.length;
          return { ...u, subscribers: subs };
        }
        if (u.id === currentUser.id) {
          let subTo = [...(u.subscribedTo || [])];
          if (subTo.includes(channelId)) {
            subTo = subTo.filter(id => id !== channelId);
          } else {
            subTo.push(channelId);
          }
          return { ...u, subscribedTo: subTo };
        }
        return u;
      });
      saveStoredUsers(updatedUsers);
      const updatedMe = updatedUsers.find(u => u.id === currentUser.id)!;
      setCurrentUser(updatedMe);
      return { isSubscribed, subscribersCount };
    }
    try {
      const res = await fetch(`/api/users/${channelId}/subscribe`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add Comment
  const addComment = async (videoId: string, text: string) => {
    if (!token) throw new Error('You must be logged in to comment.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const commentsList = getStoredComments();
      const newComment: Comment = {
        id: 'comment-' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.profilePhoto,
        videoId,
        comment: text,
        replies: [],
        createdAt: new Date().toISOString()
      };
      commentsList.push(newComment);
      saveStoredComments(commentsList);
      return newComment;
    }
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ videoId, comment: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Comment upload failed.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add Reply
  const addReply = async (commentId: string, text: string) => {
    if (!token) throw new Error('You must be logged in to reply.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const commentsList = getStoredComments();
      let updatedComment: Comment | null = null;
      const updated = commentsList.map(c => {
        if (c.id === commentId) {
          const replies = [...(c.replies || [])];
          const newReply = {
            id: 'reply-' + Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            userPhoto: currentUser.profilePhoto,
            comment: text,
            createdAt: new Date().toISOString()
          };
          replies.push(newReply);
          updatedComment = { ...c, replies };
          return updatedComment;
        }
        return c;
      });
      if (!updatedComment) throw new Error('Comment not found');
      saveStoredComments(updated);
      return updatedComment;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ comment: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reply upload failed.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete Comment
  const deleteComment = async (commentId: string) => {
    if (useLocalStorageDb) {
      const remaining = getStoredComments().filter(c => c.id !== commentId);
      saveStoredComments(remaining);
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch Playlists
  const fetchPlaylists = async () => {
    if (!token) return;
    if (useLocalStorageDb) {
      if (!currentUser) return;
      const filtered = getStoredPlaylists().filter(p => p.userId === currentUser.id);
      setPlaylists(filtered);
      return;
    }
    try {
      const res = await fetch('/api/playlists', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  // Create Playlist
  const createPlaylist = async (name: string, isPrivate: boolean) => {
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const playlistsList = getStoredPlaylists();
      const newPlaylist: Playlist = {
        id: 'play-' + Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        name,
        videoIds: [],
        isPrivate,
        createdAt: new Date().toISOString()
      };
      playlistsList.push(newPlaylist);
      saveStoredPlaylists(playlistsList);
      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    }
    try {
      const res = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, isPrivate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create playlist.');
      fetchPlaylists();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Toggle Video in Playlist
  const toggleVideoInPlaylist = async (playlistId: string, videoId: string) => {
    if (useLocalStorageDb) {
      const playlistsList = getStoredPlaylists();
      const updated = playlistsList.map(p => {
        if (p.id === playlistId) {
          let videoIds = [...(p.videoIds || [])];
          if (videoIds.includes(videoId)) {
            videoIds = videoIds.filter(id => id !== videoId);
          } else {
            videoIds.push(videoId);
          }
          return { ...p, videoIds };
        }
        return p;
      });
      saveStoredPlaylists(updated);
      if (currentUser) {
        setPlaylists(updated.filter(p => p.userId === currentUser.id));
      }
      return;
    }
    try {
      const res = await fetch(`/api/playlists/${playlistId}/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ videoId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle video.');
      fetchPlaylists();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    if (useLocalStorageDb) {
      if (!currentUser) return;
      setNotifications(getStoredNotifications().filter(n => n.userId === currentUser.id));
      return;
    }
    try {
      const res = await fetch('/api/notifications', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Mark single Notification read
  const markNotificationRead = async (id: string) => {
    if (useLocalStorageDb) {
      const all = getStoredNotifications();
      const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
      saveStoredNotifications(updated);
      if (currentUser) {
        setNotifications(updated.filter(n => n.userId === currentUser.id));
      }
      return;
    }
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all read
  const markAllNotificationsRead = async () => {
    if (useLocalStorageDb) {
      if (!currentUser) return;
      const all = getStoredNotifications();
      const updated = all.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n);
      saveStoredNotifications(updated);
      setNotifications(updated.filter(n => n.userId === currentUser.id));
      return;
    }
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  // Report video
  const reportVideo = async (videoId: string, reason: string) => {
    if (!token) throw new Error('You must be logged in to report videos.');
    if (useLocalStorageDb) {
      if (!currentUser) throw new Error('Not logged in');
      const reports = getStoredReports();
      const videosList = getStoredVideos();
      const foundVideo = videosList.find(v => v.id === videoId);
      const title = foundVideo ? foundVideo.title : 'Unknown Video';
      reports.push({
        id: 'report-' + Math.random().toString(36).substr(2, 9),
        videoId,
        videoTitle: title,
        reporterId: currentUser.id,
        reason,
        createdAt: new Date().toISOString()
      });
      saveStoredReports(reports);
      return;
    }
    try {
      const res = await fetch('/api/admin/report', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ videoId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to report video.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch admin dashboard analytics
  const fetchAdminAnalytics = async (): Promise<Analytics> => {
    if (useLocalStorageDb) {
      const videosList = getStoredVideos();
      const usersList = getStoredUsers();
      const reportsList = getStoredReports();

      const totalViews = videosList.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = videosList.reduce((sum, v) => sum + (v.likes || []).length, 0);

      // Category counts
      const categoryDistribution: { [category: string]: number } = {};
      videosList.forEach(v => {
        categoryDistribution[v.category] = (categoryDistribution[v.category] || 0) + 1;
      });

      return {
        totalViews,
        totalLikes,
        totalVideos: videosList.length,
        totalUsers: usersList.length,
        categoryDistribution,
        recentReports: reportsList
      };
    }
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: getHeaders()
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch admin users list
  const fetchAdminUsers = async (): Promise<User[]> => {
    if (useLocalStorageDb) {
      return getStoredUsers();
    }
    try {
      const res = await fetch('/api/admin/users', {
        headers: getHeaders()
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to fetch admin users.');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Toggle admin user status
  const toggleAdminUser = async (userId: string) => {
    if (useLocalStorageDb) {
      const usersList = getStoredUsers();
      const updated = usersList.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u);
      saveStoredUsers(updated);
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updated.find(u => u.id === userId)!);
      }
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle admin status.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (useLocalStorageDb) {
      const remainingUsers = getStoredUsers().filter(u => u.id !== userId);
      saveStoredUsers(remainingUsers);
      const remainingVideos = getStoredVideos().filter(v => v.uploaderId !== userId);
      saveStoredVideos(remainingVideos);
      setVideos(remainingVideos);
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Verify Admin Password
  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    setError(null);
    if (useLocalStorageDb) {
      const usersList = getStoredUsers();
      let admin = usersList.find(u => u.id === 'admin-user' || u.isAdmin);
      if (!admin) {
        admin = {
          id: 'admin-user',
          name: 'Admin Developer',
          email: 'shasinsha7384@gmail.com',
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Primary administrator of the Video Sharing platform.',
          subscribers: [],
          subscribedTo: [],
          createdAt: new Date('2026-01-01').toISOString(),
          isAdmin: true
        };
        usersList.push(admin);
        saveStoredUsers(usersList);
      }
      localStorage.setItem('yt_token', admin.id);
      setToken(admin.id);
      setCurrentUser(admin);
      return true;
    }
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Incorrect secret access key.');

      localStorage.setItem('yt_token', data.token);
      setToken(data.token);
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // fetchVideoDetails
  const fetchVideoDetails = async (videoId: string): Promise<any> => {
    if (useLocalStorageDb) {
      const videosList = getStoredVideos();
      const video = videosList.find(v => v.id === videoId);
      if (!video) throw new Error('Video not found.');
      
      const updated = videosList.map(v => v.id === videoId ? { ...v, views: (v.views || 0) + 1 } : v);
      saveStoredVideos(updated);

      const usersList = getStoredUsers();
      const uploader = usersList.find(u => u.id === video.uploaderId);
      const isUploaderAdmin = isUserAdmin(uploader);
      const isRequesterAdmin = currentUser && currentUser.isAdmin;

      const isLiked = currentUser ? (video.likes || []).includes(currentUser.id) : false;
      const isDisliked = currentUser ? (video.dislikes || []).includes(currentUser.id) : false;
      const isSubscribed = isUploaderAdmin ? false : (currentUser ? (uploader?.subscribers || []).includes(currentUser.id) : false);
      const subscribersCount = isUploaderAdmin ? 0 : (uploader ? (uploader.subscribers || []).length : 0);

      const responseVideo = { ...video };
      if (isUploaderAdmin && !isRequesterAdmin) {
        responseVideo.uploaderName = 'Aevio';
        responseVideo.uploaderPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
      }

      return {
        ...responseVideo,
        views: (video.views || 0) + 1,
        isLiked,
        isDisliked,
        isSubscribed,
        subscribersCount
      };
    }
    
    const headers = getHeaders();
    const res = await fetch(`/api/videos/${videoId}`, { headers });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch video details.');
    return data;
  };

  // fetchVideoComments
  const fetchVideoComments = async (videoId: string): Promise<Comment[]> => {
    if (useLocalStorageDb) {
      const commentsList = getStoredComments();
      const usersList = getStoredUsers();
      const isRequesterAdmin = currentUser && currentUser.isAdmin;

      const filtered = commentsList.filter(c => c.videoId === videoId);
      const masked = filtered.map(c => {
        const commenter = usersList.find(u => u.id === c.userId);
        let resComment = { ...c };
        
        if (isUserAdmin(commenter) && !isRequesterAdmin) {
          resComment.userName = 'Aevio';
          resComment.userPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
        }
        
        if (c.replies) {
          resComment.replies = c.replies.map(r => {
            const replier = usersList.find(u => u.id === r.userId);
            let resReply = { ...r };
            if (isUserAdmin(replier) && !isRequesterAdmin) {
              resReply.userName = 'Aevio';
              resReply.userPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
            }
            return resReply;
          });
        }
        
        return resComment;
      });

      return masked.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const res = await fetch(`/api/comments/${videoId}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch video comments.');
    return data;
  };

  // fetchPlaylistVideos
  const fetchPlaylistVideos = async (playlistId: string): Promise<any> => {
    if (useLocalStorageDb) {
      const playlist = getStoredPlaylists().find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');
      const allVideos = getStoredVideos();
      const matchingVideos = allVideos.filter(v => (playlist.videoIds || []).includes(v.id));

      const usersList = getStoredUsers();
      const isRequesterAdmin = currentUser && currentUser.isAdmin;

      const maskedVideos = matchingVideos.map(v => {
        const uploader = usersList.find(u => u.id === v.uploaderId);
        if (isUserAdmin(uploader) && !isRequesterAdmin) {
          return {
            ...v,
            uploaderName: 'Aevio',
            uploaderPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
          };
        }
        return v;
      });

      return { playlist, videos: maskedVideos };
    }
    const tokenVal = localStorage.getItem('yt_token');
    const res = await fetch(`/api/playlists/${playlistId}/videos`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {})
      }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch playlist details.');
    return data;
  };

  // fetchUserProfile
  const fetchUserProfile = async (userId: string): Promise<any> => {
    if (useLocalStorageDb) {
      const usersList = getStoredUsers();
      const user = usersList.find(u => u.id === userId);
      if (!user || (isUserAdmin(user) && !(currentUser && currentUser.isAdmin))) {
        throw new Error('Channel not found.');
      }

      const allVideos = getStoredVideos();
      const uploaded = allVideos.filter(v => v.uploaderId === userId);
      const subscribersCount = (user.subscribers || []).length;
      const isSubscribed = currentUser ? (user.subscribers || []).includes(currentUser.id) : false;
      return {
        ...user,
        videos: uploaded,
        subscribersCount,
        isSubscribed
      };
    }
    const tokenVal = localStorage.getItem('yt_token');
    const res = await fetch(`/api/users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {})
      }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile.');
    return data;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        videos,
        playlists,
        notifications,
        theme,
        toggleTheme,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        fetchVideos,
        uploadVideo,
        likeVideo,
        dislikeVideo,
        deleteVideo,
        subscribeChannel,
        addComment,
        addReply,
        deleteComment,
        fetchPlaylists,
        createPlaylist,
        toggleVideoInPlaylist,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        reportVideo,
        fetchAdminAnalytics,
        fetchAdminUsers,
        toggleAdminUser,
        deleteUser,
        verifyAdminPassword,
        fetchVideoDetails,
        fetchVideoComments,
        fetchPlaylistVideos,
        fetchUserProfile,
        error,
        setError
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
