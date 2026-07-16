export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto: string;
  bio: string;
  subscribers: string[]; // List of user IDs who subscribed to this user
  subscribedTo: string[]; // List of user IDs this user subscribed to
  createdAt: string;
  isAdmin?: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  uploaderId: string;
  uploaderName: string;
  uploaderPhoto: string;
  tags: string[];
  category: string;
  views: number;
  likes: string[]; // List of user IDs who liked
  dislikes: string[]; // List of user IDs who disliked
  visibility: 'public' | 'private';
  uploadDate: string;
  duration: string; // "MM:SS"
}

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  comment: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  videoId: string;
  comment: string;
  replies: Reply[];
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  videoIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'subscriber' | 'comment' | 'like' | 'upload_completed';
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string; // Video ID, Comment ID, or User ID
}

export interface Analytics {
  totalViews: number;
  totalLikes: number;
  totalVideos: number;
  totalUsers: number;
  categoryDistribution: { [category: string]: number };
  recentReports: Report[];
}

export interface Report {
  id: string;
  videoId: string;
  videoTitle: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}
