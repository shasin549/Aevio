import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, X, Film, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onNavigate }) => {
  const { fetchVideos, token, currentUser } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  
  // Metadata form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech & Science');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [duration, setDuration] = useState('02:30');

  // Statuses
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Automated Canvas-based Thumbnail Generator
  const generateAutoThumbnail = (file: File) => {
    setIsGeneratingThumbnail(true);
    setErrorMsg('');

    const videoUrlObject = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrlObject;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Format duration
      const mins = Math.floor(video.duration / 60);
      const secs = Math.floor(video.duration % 60);
      setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      
      // Seek to 1 second for thumbnail capture
      video.currentTime = Math.min(1.5, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailUrl(base64Image);
        }
        setIsGeneratingThumbnail(false);
      } catch (err) {
        console.error('Failed to capture canvas frame:', err);
        // Fallback placeholder image
        setThumbnailUrl('https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=800&auto=format&fit=crop&q=80');
        setIsGeneratingThumbnail(false);
      } finally {
        URL.revokeObjectURL(videoUrlObject);
      }
    };

    video.onerror = () => {
      setErrorMsg('Failed to process video file.');
      setIsGeneratingThumbnail(false);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        processVideoFile(file);
      } else {
        setErrorMsg('Please drop a valid video file (MP4, MOV, WebM).');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const processVideoFile = (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
    if (file.size > MAX_SIZE) {
      setErrorMsg('File exceeds the maximum allowed size of 10 GB.');
      return;
    }

    setVideoFile(file);
    // Remove extension for default title
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setTitle(nameWithoutExt);

    // Generate automated thumbnail
    generateAutoThumbnail(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      // 1. Initialize upload session
      const initRes = await fetch('/api/videos/upload/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: videoFile.name,
          title,
          description,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          visibility,
          duration,
          thumbnail: thumbnailUrl,
          fileSize: videoFile.size
        })
      });

      if (!initRes.ok) {
        const errData = await initRes.json();
        throw new Error(errData.error || 'Failed to initialize chunked upload.');
      }

      const { uploadId, chunkSize } = await initRes.json();
      const totalChunks = Math.ceil(videoFile.size / chunkSize);

      // 2. Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, videoFile.size);
        const chunk = videoFile.slice(start, end);

        let success = false;
        let retries = 3;

        while (!success && retries > 0) {
          try {
            const chunkRes = await fetch(`/api/videos/upload/chunk?uploadId=${uploadId}&chunkIndex=${i}&totalChunks=${totalChunks}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'Authorization': `Bearer ${token}`
              },
              body: chunk
            });

            if (!chunkRes.ok) {
              const errData = await chunkRes.json();
              throw new Error(errData.error || `Failed to upload chunk ${i}.`);
            }

            success = true;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }

        // Upload is 90% of progress, merging is 10%
        const progress = Math.round(((i + 1) / totalChunks) * 90);
        setUploadProgress(progress);
      }

      // 3. Complete and merge upload session
      setUploadProgress(95);

      const completeRes = await fetch('/api/videos/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uploadId })
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json();
        throw new Error(errData.error || 'Failed to finalize video merge.');
      }

      const finalVideo = await completeRes.json();

      setUploadProgress(100);
      setIsDone(true);
      
      // Refresh current videos list
      fetchVideos();

      setTimeout(() => {
        onClose();
        onNavigate('home');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed.');
      setIsUploading(false);
    }
  };

  const categories = ['Music', 'Gaming', 'Education', 'Tech & Science', 'Entertainment', 'Sports', 'Vlogs'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-zinc-800 transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Video</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="p-4 mb-5 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {isDone ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Completed!</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Your video is processing and will be live in seconds.</p>
            </div>
          ) : !videoFile ? (
            /* Drag and Drop Zone */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl py-16 px-6 cursor-pointer transition-all ${
                dragActive
                  ? 'border-red-500 bg-red-50/20 dark:bg-red-950/10'
                  : 'border-gray-300 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-gray-50/50 dark:hover:bg-zinc-800/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <p className="font-semibold text-sm text-gray-800 dark:text-zinc-200">
                Drag and drop your video file to upload
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1.5">
                Support MP4, MOV, WebM formats (up to 10 GB)
              </p>
              <button
                type="button"
                className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-colors"
              >
                Select File
              </button>
            </div>
          ) : (
            /* Meta details editing form */
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form entries */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Title (required)
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Provide a compelling title for your video"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell your viewers about your video"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="public">Public (Everyone can search/view)</option>
                      <option value="private">Private (Only you can view)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="gaming, gameplay, lo-fi, chill"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Right Sidebar: Thumbnail preview & upload state */}
              <div className="space-y-5">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                    Auto Thumbnail
                  </span>
                  
                  <div className="relative aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                    {isGeneratingThumbnail ? (
                      <div className="flex flex-col items-center gap-1.5 text-xs text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                        <span>Generating...</span>
                      </div>
                    ) : thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-xs text-zinc-400">
                        <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-1" />
                        No thumbnail generated
                      </div>
                    )}
                  </div>
                </div>

                {/* File info */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-900/40 rounded-2xl border border-gray-200/50 dark:border-zinc-800/50">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    File Details
                  </span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">{videoFile.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                    Size: {videoFile.size >= 1024 * 1024 * 1024 
                      ? `${(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB` 
                      : `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">Duration: {duration}</p>
                </div>

                {/* Upload Action */}
                {isUploading ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Uploading video...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-red-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setVideoFile(null)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-zinc-700 text-sm font-semibold text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={!title || isGeneratingThumbnail}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/10 transition-colors"
                    >
                      Publish
                    </button>
                  </div>
                )}
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
