import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'youtube-clone-super-secret-key-2026';

function isUserAdmin(user: any): boolean {
  if (!user) return false;
  return !!(user.isAdmin || user.id === 'admin-user' || (user.email && user.email.toLowerCase() === 'shasinsha7384@gmail.com'));
}

// Request parsing configuration with high limit for video transfers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Ensure data and uploads directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Serve uploaded assets static route
app.use('/uploads', express.static(UPLOADS_DIR));

// Native Token Utilities
function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function generateToken(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64UrlEncode(JSON.stringify(header));
  const payloadStr = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${headerStr}.${payloadStr}`).digest('base64url');
  return `${headerStr}.${payloadStr}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const [headerStr, payloadStr, signature] = token.split('.');
    if (!headerStr || !payloadStr || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(`${headerStr}.${payloadStr}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// Password hashing utilities using PBKDF2
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

// Database initial seed structure
const INITIAL_DB = {
  users: [
    {
      id: 'admin-user',
      name: 'Admin Developer',
      email: 'shasinsha7384@gmail.com',
      passwordHash: hashPassword('admin1234'),
      profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Primary administrator of the Video Sharing platform.',
      subscribers: [],
      subscribedTo: [],
      createdAt: new Date('2026-01-01').toISOString(),
      isAdmin: true
    }
  ],
  videos: [
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
  ],
  comments: [
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
  ],
  playlists: [
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
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'admin-user',
      type: 'subscriber',
      message: 'Luna Harmonies subscribed to your channel!',
      isRead: false,
      createdAt: new Date('2026-07-15T09:00:00.000Z').toISOString(),
      referenceId: 'creator-music'
    }
  ],
  reports: []
};

// Initialize DB file
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);

    // Self-healing database to ensure it is always populated with beautiful seed videos on start
    let updated = false;
    if (!parsed.videos || parsed.videos.length === 0) {
      parsed.videos = INITIAL_DB.videos;
      updated = true;
    }
    if (!parsed.comments || parsed.comments.length === 0) {
      parsed.comments = INITIAL_DB.comments;
      updated = true;
    }
    if (!parsed.playlists || parsed.playlists.length === 0) {
      parsed.playlists = INITIAL_DB.playlists;
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch (err) {
    console.error('Error reading JSON db:', err);
    return INITIAL_DB;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON db:', err);
  }
}

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  req.userId = payload.id;
  req.userEmail = payload.email;
  req.isAdmin = payload.isAdmin || false;
  next();
};

const optionalAuthenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.userId = payload.id;
      req.userEmail = payload.email;
      req.isAdmin = payload.isAdmin || false;
      return next();
    }
  }

  req.userId = null;
  req.userEmail = null;
  req.isAdmin = false;
  next();
};


// --- AUTH API ROUTES ---

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, bio, profilePhoto } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const defaultPhoto = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`;
  const newUser = {
    id: 'user-' + crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    profilePhoto: profilePhoto || defaultPhoto,
    bio: bio || 'Welcome to my channel!',
    subscribers: [],
    subscribedTo: [],
    createdAt: new Date().toISOString(),
    isAdmin: email.toLowerCase() === 'shasinsha7384@gmail.com' // Auto admin for target test user
  };

  db.users.push(newUser);
  writeDB(db);

  const token = generateToken({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin });
  const { passwordHash, ...userResponse } = newUser;
  res.status(201).json({ user: userResponse, token });
});

// Admin Verify Password (Hidden, secure, does not expose route or password on client)
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Secret access key/password is required.' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPassword) {
    const db = readDB();
    const adminUser = db.users.find((u: any) => u.id === 'admin-user' || u.isAdmin);
    const userId = adminUser ? adminUser.id : 'admin-user';
    const userEmail = adminUser ? adminUser.email : 'shasinsha7384@gmail.com';
    const token = generateToken({ id: userId, email: userEmail, isAdmin: true });
    return res.json({ token, success: true });
  } else {
    return res.status(401).json({ error: 'Incorrect secret access key.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  const { passwordHash, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

// Get Current User
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const db = readDB();
  const user = db.users.find((u: any) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// --- USER API ROUTES ---

// Get Public User Profile
app.get('/api/users/:id', optionalAuthenticateToken, (req: any, res) => {
  const db = readDB();
  const user = db.users.find((u: any) => u.id === req.params.id);
  if (!user || (isUserAdmin(user) && !req.isAdmin)) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  const userVideos = db.videos.filter((v: any) => v.uploaderId === user.id && (v.visibility === 'public' || v.uploaderId === req.userId));
  const totalViews = userVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);

  const isSubscribed = req.userId ? user.subscribers.includes(req.userId) : false;

  const { passwordHash, email, ...profile } = user;
  res.json({
    ...profile,
    videos: userVideos,
    totalViews,
    subscribersCount: user.subscribers.length,
    isSubscribed
  });
});

// Update Profile
app.put('/api/users/profile/update', authenticateToken, (req: any, res) => {
  const { name, bio, profilePhoto } = req.body;
  const db = readDB();
  const userIdx = db.users.findIndex((u: any) => u.id === req.userId);

  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name) db.users[userIdx].name = name;
  if (bio !== undefined) db.users[userIdx].bio = bio;
  if (profilePhoto) db.users[userIdx].profilePhoto = profilePhoto;

  // Also update uploader info inside their videos to maintain redundancy
  db.videos.forEach((video: any) => {
    if (video.uploaderId === req.userId) {
      if (name) video.uploaderName = name;
      if (profilePhoto) video.uploaderPhoto = profilePhoto;
    }
  });

  writeDB(db);
  const { passwordHash, ...userResponse } = db.users[userIdx];
  res.json(userResponse);
});

// Toggle Subscribe
app.post('/api/users/:id/subscribe', authenticateToken, (req: any, res) => {
  const targetId = req.params.id;
  if (targetId === req.userId) {
    return res.status(400).json({ error: 'You cannot subscribe to your own channel.' });
  }

  const db = readDB();
  const targetUser = db.users.find((u: any) => u.id === targetId);
  const currentUser = db.users.find((u: any) => u.id === req.userId);

  if (!targetUser || !currentUser || (isUserAdmin(targetUser) && !req.isAdmin)) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  const subIdx = targetUser.subscribers.indexOf(req.userId);
  let isSubscribed = false;

  if (subIdx === -1) {
    targetUser.subscribers.push(req.userId);
    if (!currentUser.subscribedTo) currentUser.subscribedTo = [];
    currentUser.subscribedTo.push(targetId);
    isSubscribed = true;

    // Trigger Notification
    db.notifications.push({
      id: 'notif-' + crypto.randomUUID(),
      userId: targetId,
      type: 'subscriber',
      message: `${currentUser.name} subscribed to your channel!`,
      isRead: false,
      createdAt: new Date().toISOString(),
      referenceId: currentUser.id
    });
  } else {
    targetUser.subscribers.splice(subIdx, 1);
    if (currentUser.subscribedTo) {
      const idx = currentUser.subscribedTo.indexOf(targetId);
      if (idx !== -1) currentUser.subscribedTo.splice(idx, 1);
    }
  }

  writeDB(db);
  res.json({ isSubscribed, subscribersCount: targetUser.subscribers.length });
});

// --- VIDEO API ROUTES ---

// Get Videos (with Search, Filtering, and Pagination)
app.get('/api/videos', optionalAuthenticateToken, (req: any, res) => {
  const { search, category, tag, sort, creatorId } = req.query;
  const db = readDB();

  let filtered = db.videos.filter((v: any) => {
    // Show only public videos, or user's own private videos
    if (v.visibility === 'private') {
      return req.userId && v.uploaderId === req.userId;
    }
    return true;
  });

  // Filter by creator
  if (creatorId) {
    const creatorUser = db.users.find((u: any) => u.id === creatorId);
    if (isUserAdmin(creatorUser) && !req.isAdmin) {
      filtered = [];
    } else {
      filtered = filtered.filter((v: any) => v.uploaderId === creatorId);
    }
  }

  // Category Filter
  if (category && category !== 'All') {
    filtered = filtered.filter((v: any) => v.category === category);
  }

  // Tag Filter
  if (tag) {
    filtered = filtered.filter((v: any) => v.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase()));
  }

  // Search Filter
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter((v: any) => {
      const uploader = db.users.find((u: any) => u.id === v.uploaderId);
      const isUploaderAdmin = isUserAdmin(uploader);
      // If uploader is admin, search matches 'Aevio' instead of their admin name
      const uploaderNameSearch = isUploaderAdmin ? 'aevio' : v.uploaderName.toLowerCase();
      
      return v.title.toLowerCase().includes(query) || 
        v.description.toLowerCase().includes(query) ||
        uploaderNameSearch.includes(query) ||
        v.tags.some((t: string) => t.toLowerCase().includes(query));
    });
  }

  // Sorting
  if (sort === 'trending') {
    filtered.sort((a: any, b: any) => b.views - a.views);
  } else if (sort === 'oldest') {
    filtered.sort((a: any, b: any) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
  } else {
    // Default 'latest'
    filtered.sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  // Mask admin uploader info for non-admins
  const maskedFiltered = filtered.map((v: any) => {
    const uploader = db.users.find((u: any) => u.id === v.uploaderId);
    if (isUserAdmin(uploader) && !req.isAdmin) {
      return {
        ...v,
        uploaderName: 'Aevio',
        uploaderPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      };
    }
    return v;
  });

  res.json(maskedFiltered);
});

// Get Video by ID (Increments view counter)
app.get('/api/videos/:id', optionalAuthenticateToken, (req: any, res) => {
  const db = readDB();
  const videoIdx = db.videos.findIndex((v: any) => v.id === req.params.id);

  if (videoIdx === -1) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const video = db.videos[videoIdx];
  if (video.visibility === 'private' && (!req.userId || video.uploaderId !== req.userId)) {
    return res.status(403).json({ error: 'This video is private.' });
  }

  // Increment view count
  video.views += 1;
  db.videos[videoIdx] = video;
  writeDB(db);

  // Check subscription state of viewer to uploader
  let isSubscribed = false;
  const uploader = db.users.find((u: any) => u.id === video.uploaderId);
  if (uploader && req.userId) {
    isSubscribed = uploader.subscribers.includes(req.userId);
  }

  const isUploaderAdmin = isUserAdmin(uploader);
  const responseVideo = { ...video };
  if (isUploaderAdmin && !req.isAdmin) {
    responseVideo.uploaderName = 'Aevio';
    responseVideo.uploaderPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
  }

  res.json({
    ...responseVideo,
    isLiked: req.userId ? video.likes.includes(req.userId) : false,
    isDisliked: req.userId ? video.dislikes.includes(req.userId) : false,
    isSubscribed: isUploaderAdmin ? false : isSubscribed,
    subscribersCount: isUploaderAdmin ? 0 : (uploader ? uploader.subscribers.length : 0)
  });
});

// Upload Video (Accepts base64 or custom video transfer)
app.post('/api/videos/upload', authenticateToken, (req: any, res) => {
  const { title, description, tags, category, visibility, videoUrl, thumbnail, duration } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and Category are required.' });
  }

  const db = readDB();
  const currentUser = db.users.find((u: any) => u.id === req.userId);

  if (!currentUser) {
    return res.status(404).json({ error: 'Uploader profile not found.' });
  }

  // Generate unique ID
  const videoId = 'vid-' + crypto.randomUUID();

  // If payload sends video as base64, save it as a local file, otherwise use sent URL
  let finalVideoUrl = videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  if (videoUrl && videoUrl.startsWith('data:video')) {
    try {
      const parts = videoUrl.split(';base64,');
      if (parts.length === 2) {
        const mime = parts[0].split(':')[1];
        const ext = mime.split('/')[1] || 'mp4';
        const buffer = Buffer.from(parts[1], 'base64');
        const filename = `${videoId}.${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        finalVideoUrl = `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('Error parsing video base64 upload:', err);
    }
  }

  // Handle base64 thumbnail
  let finalThumbnail = thumbnail || 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=800&auto=format&fit=crop&q=80';
  if (thumbnail && thumbnail.startsWith('data:image')) {
    try {
      const parts = thumbnail.split(';base64,');
      if (parts.length === 2) {
        const mime = parts[0].split(':')[1];
        const ext = mime.split('/')[1] || 'png';
        const buffer = Buffer.from(parts[1], 'base64');
        const filename = `${videoId}_thumb.${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        finalThumbnail = `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('Error saving base64 thumbnail:', err);
    }
  }

  const cleanTags = Array.isArray(tags) 
    ? tags 
    : typeof tags === 'string' 
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) 
      : [];

  const newVideo = {
    id: videoId,
    title,
    description: description || '',
    videoUrl: finalVideoUrl,
    thumbnail: finalThumbnail,
    uploaderId: currentUser.id,
    uploaderName: currentUser.name,
    uploaderPhoto: currentUser.profilePhoto,
    tags: cleanTags,
    category,
    views: 0,
    likes: [],
    dislikes: [],
    visibility: visibility || 'public',
    uploadDate: new Date().toISOString(),
    duration: duration || '02:30'
  };

  db.videos.push(newVideo);

  // Notify uploader subscribers
  const subscribers = currentUser.subscribers || [];
  subscribers.forEach((subId: string) => {
    db.notifications.push({
      id: 'notif-' + crypto.randomUUID(),
      userId: subId,
      type: 'upload_completed',
      message: `${currentUser.name} uploaded a new video: "${title}"`,
      isRead: false,
      createdAt: new Date().toISOString(),
      referenceId: videoId
    });
  });

  writeDB(db);
  res.status(201).json(newVideo);
});

// Initialize chunked upload
app.post('/api/videos/upload/init', authenticateToken, (req: any, res) => {
  const { filename, title, description, tags, category, visibility, duration, thumbnail, fileSize } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and Category are required.' });
  }

  // Validate 10GB limit on backend
  const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
  if (fileSize && fileSize > MAX_SIZE) {
    return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 10 GB.' });
  }

  const uploadId = crypto.randomUUID();
  const tempDir = path.join(UPLOADS_DIR, `tmp-${uploadId}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Save metadata for final creation
    const meta = {
      filename,
      title,
      description: description || '',
      tags: tags || [],
      category,
      visibility: visibility || 'public',
      duration: duration || '02:30',
      thumbnail: thumbnail || '',
      uploaderId: req.userId,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(tempDir, 'meta.json'), JSON.stringify(meta, null, 2));

    // Return session details, specifying chunk size (e.g., 10MB)
    res.json({
      uploadId,
      chunkSize: 10 * 1024 * 1024 // 10MB chunk size
    });
  } catch (err) {
    console.error('Failed to initialize chunked upload:', err);
    res.status(500).json({ error: 'Internal server error initializing upload.' });
  }
});

// Receive a chunk of the upload
app.post('/api/videos/upload/chunk', authenticateToken, (req: any, res) => {
  const uploadId = req.query.uploadId as string;
  const chunkIndex = parseInt(req.query.chunkIndex as string, 10);
  const totalChunks = parseInt(req.query.totalChunks as string, 10);

  if (!uploadId || isNaN(chunkIndex)) {
    return res.status(400).json({ error: 'Missing uploadId or chunkIndex.' });
  }

  const tempDir = path.join(UPLOADS_DIR, `tmp-${uploadId}`);
  if (!fs.existsSync(tempDir)) {
    return res.status(404).json({ error: 'Upload session not found or expired.' });
  }

  const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
  const writeStream = fs.createWriteStream(chunkPath);

  req.pipe(writeStream);

  req.on('error', (err: any) => {
    console.error('Request read stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chunk upload failed on read.' });
    }
  });

  writeStream.on('error', (err) => {
    console.error('Write stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chunk upload failed on write.' });
    }
  });

  writeStream.on('finish', () => {
    res.json({ success: true, chunkIndex });
  });
});

// Complete and merge all chunks
app.post('/api/videos/upload/complete', authenticateToken, async (req: any, res) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    return res.status(400).json({ error: 'Missing uploadId.' });
  }

  const tempDir = path.join(UPLOADS_DIR, `tmp-${uploadId}`);
  const metaPath = path.join(tempDir, 'meta.json');

  if (!fs.existsSync(tempDir) || !fs.existsSync(metaPath)) {
    return res.status(404).json({ error: 'Upload session not found or expired.' });
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    
    // Determine file extension from original filename
    const originalFilename = meta.filename || 'video.mp4';
    const ext = path.extname(originalFilename) || '.mp4';
    
    const videoId = 'vid-' + crypto.randomUUID();
    const finalFilename = `${videoId}${ext}`;
    const destFilePath = path.join(UPLOADS_DIR, finalFilename);

    // Find all chunks in the directory
    const files = fs.readdirSync(tempDir);
    const chunkFiles = files.filter(f => f.startsWith('chunk-')).sort((a, b) => {
      const idxA = parseInt(a.split('-')[1], 10);
      const idxB = parseInt(b.split('-')[1], 10);
      return idxA - idxB;
    });

    const totalChunks = chunkFiles.length;

    // Memory-safe, sequential append merging using non-blocking fs.promises
    // This keeps RAM footprint at a flat, constant 10MB (one chunk) regardless of the total video size (e.g. 3GB or 10GB)
    await fs.promises.writeFile(destFilePath, '');
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Missing chunk at index ${i}`);
      }
      const chunkBuffer = await fs.promises.readFile(chunkPath);
      await fs.promises.appendFile(destFilePath, chunkBuffer);
    }

    // Save base64 thumbnail if present
    let finalThumbnail = meta.thumbnail || 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=800&auto=format&fit=crop&q=80';
    if (meta.thumbnail && meta.thumbnail.startsWith('data:image')) {
      try {
        const parts = meta.thumbnail.split(';base64,');
        if (parts.length === 2) {
          const mime = parts[0].split(':')[1];
          const thumbExt = mime.split('/')[1] || 'png';
          const buffer = Buffer.from(parts[1], 'base64');
          const thumbFilename = `${videoId}_thumb.${thumbExt}`;
          const thumbFilepath = path.join(UPLOADS_DIR, thumbFilename);
          fs.writeFileSync(thumbFilepath, buffer);
          finalThumbnail = `/uploads/${thumbFilename}`;
        }
      } catch (err) {
        console.error('Error saving thumbnail:', err);
      }
    }

    // Now insert video into DB
    const db = readDB();
    const currentUser = db.users.find((u: any) => u.id === req.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Uploader profile not found.' });
    }

    const finalVideoUrl = `/uploads/${finalFilename}`;

    const newVideo = {
      id: videoId,
      title: meta.title,
      description: meta.description,
      videoUrl: finalVideoUrl,
      thumbnail: finalThumbnail,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      uploaderPhoto: currentUser.profilePhoto,
      tags: meta.tags,
      category: meta.category,
      views: 0,
      likes: [],
      dislikes: [],
      visibility: meta.visibility,
      uploadDate: new Date().toISOString(),
      duration: meta.duration || '02:30'
    };

    db.videos.push(newVideo);

    // Notify uploader subscribers
    const subscribers = currentUser.subscribers || [];
    subscribers.forEach((subId: string) => {
      db.notifications.push({
        id: 'notif-' + crypto.randomUUID(),
        userId: subId,
        type: 'upload_completed',
        message: `${currentUser.name} uploaded a new video: "${meta.title}"`,
        isRead: false,
        createdAt: new Date().toISOString(),
        referenceId: videoId
      });
    });

    writeDB(db);

    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });

    res.status(201).json(newVideo);
  } catch (err: any) {
    console.error('Failed to complete upload merging:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to merge chunks.' });
    }
  }
});

// Like Video Toggle
app.post('/api/videos/:id/like', authenticateToken, (req: any, res) => {
  const db = readDB();
  const video = db.videos.find((v: any) => v.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const likeIdx = video.likes.indexOf(req.userId);
  const dislikeIdx = video.dislikes.indexOf(req.userId);

  if (dislikeIdx !== -1) {
    video.dislikes.splice(dislikeIdx, 1);
  }

  let liked = false;
  if (likeIdx === -1) {
    video.likes.push(req.userId);
    liked = true;

    // Trigger Notification for video uploader (if not current user)
    if (video.uploaderId !== req.userId) {
      const liker = db.users.find((u: any) => u.id === req.userId);
      db.notifications.push({
        id: 'notif-' + crypto.randomUUID(),
        userId: video.uploaderId,
        type: 'like',
        message: `${liker ? liker.name : 'Someone'} liked your video "${video.title}"`,
        isRead: false,
        createdAt: new Date().toISOString(),
        referenceId: video.id
      });
    }
  } else {
    video.likes.splice(likeIdx, 1);
  }

  writeDB(db);
  res.json({
    likesCount: video.likes.length,
    dislikesCount: video.dislikes.length,
    isLiked: liked,
    isDisliked: false
  });
});

// Dislike Video Toggle
app.post('/api/videos/:id/dislike', authenticateToken, (req: any, res) => {
  const db = readDB();
  const video = db.videos.find((v: any) => v.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const likeIdx = video.likes.indexOf(req.userId);
  const dislikeIdx = video.dislikes.indexOf(req.userId);

  if (likeIdx !== -1) {
    video.likes.splice(likeIdx, 1);
  }

  let disliked = false;
  if (dislikeIdx === -1) {
    video.dislikes.push(req.userId);
    disliked = true;
  } else {
    video.dislikes.splice(dislikeIdx, 1);
  }

  writeDB(db);
  res.json({
    likesCount: video.likes.length,
    dislikesCount: video.dislikes.length,
    isLiked: false,
    isDisliked: disliked
  });
});

// Delete Video (Owner or Admin)
app.delete('/api/videos/:id', authenticateToken, (req: any, res) => {
  const db = readDB();
  const videoIdx = db.videos.findIndex((v: any) => v.id === req.params.id);

  if (videoIdx === -1) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const video = db.videos[videoIdx];
  if (video.uploaderId !== req.userId && !req.isAdmin) {
    return res.status(403).json({ error: 'You are not authorized to delete this video.' });
  }

  // Remove video
  db.videos.splice(videoIdx, 1);

  // Clean related comments
  db.comments = db.comments.filter((c: any) => c.videoId !== req.params.id);

  // Clean playlists
  db.playlists.forEach((p: any) => {
    p.videoIds = p.videoIds.filter((id: string) => id !== req.params.id);
  });

  writeDB(db);
  res.json({ success: true, message: 'Video successfully deleted.' });
});

// --- COMMENTS API ---

// Get Video Comments
app.get('/api/comments/:videoId', optionalAuthenticateToken, (req: any, res) => {
  const db = readDB();
  const videoComments = db.comments.filter((c: any) => c.videoId === req.params.videoId);
  
  const maskedComments = videoComments.map((c: any) => {
    const commenter = db.users.find((u: any) => u.id === c.userId);
    let resComment = { ...c };
    
    if (isUserAdmin(commenter) && !req.isAdmin) {
      resComment.userName = 'Aevio';
      resComment.userPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
    }
    
    if (c.replies) {
      resComment.replies = c.replies.map((r: any) => {
        const replier = db.users.find((u: any) => u.id === r.userId);
        let resReply = { ...r };
        if (isUserAdmin(replier) && !req.isAdmin) {
          resReply.userName = 'Aevio';
          resReply.userPhoto = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
        }
        return resReply;
      });
    }
    
    return resComment;
  });

  maskedComments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(maskedComments);
});

// Add Comment
app.post('/api/comments', authenticateToken, (req: any, res) => {
  const { videoId, comment } = req.body;
  if (!videoId || !comment) {
    return res.status(400).json({ error: 'VideoId and Comment text are required.' });
  }

  const db = readDB();
  const currentUser = db.users.find((u: any) => u.id === req.userId);
  const video = db.videos.find((v: any) => v.id === videoId);

  if (!currentUser || !video) {
    return res.status(404).json({ error: 'User or Video not found.' });
  }

  const newComment = {
    id: 'com-' + crypto.randomUUID(),
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    videoId,
    comment,
    replies: [],
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Notify video creator
  if (video.uploaderId !== req.userId) {
    db.notifications.push({
      id: 'notif-' + crypto.randomUUID(),
      userId: video.uploaderId,
      type: 'comment',
      message: `${currentUser.name} commented on your video: "${comment.substring(0, 30)}..."`,
      isRead: false,
      createdAt: new Date().toISOString(),
      referenceId: video.id
    });
  }

  writeDB(db);
  res.status(201).json(newComment);
});

// Add Reply to Comment
app.post('/api/comments/:commentId/reply', authenticateToken, (req: any, res) => {
  const { comment } = req.body;
  if (!comment) {
    return res.status(400).json({ error: 'Reply comment text is required.' });
  }

  const db = readDB();
  const commIdx = db.comments.findIndex((c: any) => c.id === req.params.commentId);

  if (commIdx === -1) {
    return res.status(404).json({ error: 'Comment not found.' });
  }

  const currentUser = db.users.find((u: any) => u.id === req.userId);
  if (!currentUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newReply = {
    id: 'rep-' + crypto.randomUUID(),
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    comment,
    createdAt: new Date().toISOString()
  };

  db.comments[commIdx].replies.push(newReply);
  writeDB(db);
  res.status(201).json(db.comments[commIdx]);
});

// Delete Comment
app.delete('/api/comments/:id', authenticateToken, (req: any, res) => {
  const db = readDB();
  const commentIdx = db.comments.findIndex((c: any) => c.id === req.params.id);

  if (commentIdx === -1) {
    return res.status(404).json({ error: 'Comment not found.' });
  }

  const comment = db.comments[commentIdx];
  const video = db.videos.find((v: any) => v.id === comment.videoId);

  // Allow comment deletion if user is author of comment, creator of video, or admin
  const isAuthorized = comment.userId === req.userId || (video && video.uploaderId === req.userId) || req.isAdmin;
  if (!isAuthorized) {
    return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
  }

  db.comments.splice(commentIdx, 1);
  writeDB(db);
  res.json({ success: true, message: 'Comment deleted successfully.' });
});

// --- PLAYLIST API ---

// Get user playlists
app.get('/api/playlists', authenticateToken, (req: any, res) => {
  const db = readDB();
  const userPlaylists = db.playlists.filter((p: any) => p.userId === req.userId);
  res.json(userPlaylists);
});

// Create Playlist
app.post('/api/playlists/create', authenticateToken, (req: any, res) => {
  const { name, isPrivate } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required.' });
  }

  const db = readDB();
  const newPlaylist = {
    id: 'play-' + crypto.randomUUID(),
    userId: req.userId,
    name,
    videoIds: [],
    isPrivate: isPrivate === undefined ? true : isPrivate,
    createdAt: new Date().toISOString()
  };

  db.playlists.push(newPlaylist);
  writeDB(db);
  res.status(201).json(newPlaylist);
});

// Toggle Video in Playlist
app.post('/api/playlists/:id/toggle', authenticateToken, (req: any, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'VideoId is required.' });
  }

  const db = readDB();
  const playlist = db.playlists.find((p: any) => p.id === req.params.id && p.userId === req.userId);

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }

  const vIdx = playlist.videoIds.indexOf(videoId);
  let added = false;
  if (vIdx === -1) {
    playlist.videoIds.push(videoId);
    added = true;
  } else {
    playlist.videoIds.splice(vIdx, 1);
  }

  writeDB(db);
  res.json({ added, playlist });
});

// Get Playlist videos
app.get('/api/playlists/:id/videos', optionalAuthenticateToken, (req: any, res) => {
  const db = readDB();
  const playlist = db.playlists.find((p: any) => p.id === req.params.id);

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }

  if (playlist.isPrivate && playlist.userId !== req.userId) {
    return res.status(403).json({ error: 'This playlist is private.' });
  }

  const playlistVideos = db.videos.filter((v: any) => playlist.videoIds.includes(v.id));
  
  // Mask admin uploader info for non-admins
  const maskedVideos = playlistVideos.map((v: any) => {
    const uploader = db.users.find((u: any) => u.id === v.uploaderId);
    if (isUserAdmin(uploader) && !req.isAdmin) {
      return {
        ...v,
        uploaderName: 'Aevio',
        uploaderPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      };
    }
    return v;
  });

  res.json({ playlist, videos: maskedVideos });
});

// --- NOTIFICATIONS ---

// Get Notifications
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const db = readDB();
  const userNotifs = db.notifications.filter((n: any) => n.userId === req.userId);
  userNotifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

// Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
  const db = readDB();
  const notifIdx = db.notifications.findIndex((n: any) => n.id === req.params.id && n.userId === req.userId);

  if (notifIdx === -1) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  db.notifications[notifIdx].isRead = true;
  writeDB(db);
  res.json(db.notifications[notifIdx]);
});

// Mark all as read
app.post('/api/notifications/read-all', authenticateToken, (req: any, res) => {
  const db = readDB();
  db.notifications.forEach((n: any) => {
    if (n.userId === req.userId) {
      n.isRead = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// --- REPORTS & ADMIN PANEL ---

// Report a Video
app.post('/api/admin/report', authenticateToken, (req: any, res) => {
  const { videoId, reason } = req.body;
  if (!videoId || !reason) {
    return res.status(400).json({ error: 'VideoId and reason are required.' });
  }

  const db = readDB();
  const video = db.videos.find((v: any) => v.id === videoId);

  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const newReport = {
    id: 'rep-' + crypto.randomUUID(),
    videoId,
    videoTitle: video.title,
    reporterId: req.userId,
    reason,
    createdAt: new Date().toISOString()
  };

  if (!db.reports) db.reports = [];
  db.reports.push(newReport);
  writeDB(db);

  res.status(201).json(newReport);
});

// Admin Dashboard Analytics
app.get('/api/admin/dashboard', authenticateToken, (req: any, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  }

  const db = readDB();
  const totalViews = db.videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);
  const totalLikes = db.videos.reduce((sum: number, v: any) => sum + (v.likes?.length || 0), 0);

  // Category distribution helper
  const catDist: { [key: string]: number } = {};
  db.videos.forEach((v: any) => {
    catDist[v.category] = (catDist[v.category] || 0) + 1;
  });

  res.json({
    totalViews,
    totalLikes,
    totalVideos: db.videos.length,
    totalUsers: db.users.length,
    categoryDistribution: catDist,
    recentReports: db.reports || []
  });
});

// Admin - Resolve/Dismiss Report
app.delete('/api/admin/reports/:id', authenticateToken, (req: any, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  }

  const db = readDB();
  if (db.reports) {
    db.reports = db.reports.filter((r: any) => r.id !== req.params.id);
  }
  writeDB(db);
  res.json({ success: true, message: 'Report resolved.' });
});

// Admin - Manage All Users
app.get('/api/admin/users', authenticateToken, (req: any, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  }
  const db = readDB();
  const usersNoPasswords = db.users.map(({ passwordHash, ...u }: any) => u);
  res.json(usersNoPasswords);
});

// Admin - Toggle Admin Status
app.post('/api/admin/users/:id/toggle-admin', authenticateToken, (req: any, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  }
  const db = readDB();
  const uIdx = db.users.findIndex((u: any) => u.id === req.params.id);
  if (uIdx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  db.users[uIdx].isAdmin = !db.users[uIdx].isAdmin;
  writeDB(db);
  res.json({ success: true, user: db.users[uIdx] });
});

// Admin - Delete User
app.delete('/api/admin/users/:id', authenticateToken, (req: any, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden. Admin credentials required.' });
  }
  const db = readDB();
  const uIdx = db.users.findIndex((u: any) => u.id === req.params.id);
  if (uIdx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const userId = req.params.id;

  // Delete user
  db.users.splice(uIdx, 1);

  // Delete all user videos
  db.videos = db.videos.filter((v: any) => v.uploaderId !== userId);

  // Clean comment replies
  db.comments.forEach((c: any) => {
    if (c.replies) {
      c.replies = c.replies.filter((r: any) => r.userId !== userId);
    }
  });

  // Delete user comments
  db.comments = db.comments.filter((c: any) => c.userId !== userId);

  // Delete user playlists
  db.playlists = db.playlists.filter((p: any) => p.userId !== userId);

  writeDB(db);
  res.json({ success: true, message: 'User and all associated content deleted successfully.' });
});


// Vite Dev / Prod static serving configuration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
