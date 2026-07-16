import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  Settings, Minimize2, Tv2, SkipForward, ToggleLeft, ToggleRight
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster: string;
  title: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title, onEnded, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);

  // Auto-hide controls timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  // Handle Autoplay and source change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (autoPlay) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.log('Autoplay blocked or failed:', err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(false);
      }
    }
  }, [src]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const targetMuted = !isMuted;
      setIsMuted(targetMuted);
      videoRef.current.muted = targetMuted;
      if (!targetMuted && volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handlePictureInPicture = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.error('Picture-in-picture failed:', err);
    }
  };

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error enabling fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error exiting fullscreen:', err));
    }
  };

  // Sync fullscreen state if user exits via ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoplayNext && onEnded) {
      onEnded();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-2xl border border-zinc-800"
      id="custom-video-player-container"
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        referrerPolicy="no-referrer"
      />

      {/* Screen click/tap controls overlay */}
      <div 
        onClick={handlePlayPause}
        className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Giant Pause/Play center indicator */}
        <button 
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white flex items-center justify-center transition-all scale-95 hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
        </button>
      </div>

      {/* Custom Controls panel at bottom */}
      <div 
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-3.5 transition-transform duration-300 ease-out z-10 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        id="video-controls-panel"
      >
        {/* Progress Bar (Timeline) */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-mono font-medium text-zinc-300 select-none">
            {formatTime(currentTime)}
          </span>
          
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / (duration || 1)) * 100}%, #3f3f46 ${(currentTime / (duration || 1)) * 100}%, #3f3f46 100%)`
            }}
          />
          
          <span className="text-xs font-mono font-medium text-zinc-300 select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Lower Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button 
              onClick={handlePlayPause}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Back */}
            <button 
              onClick={() => skipSeconds(-10)} 
              className="text-white hover:text-zinc-300 transition-colors"
              title="Backward 10s"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>

            {/* Skip Next */}
            <button 
              onClick={onEnded} 
              className="text-white hover:text-zinc-300 transition-colors"
              title="Next Video"
            >
              <SkipForward className="w-4.5 h-4.5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button 
                onClick={handleToggleMute}
                className="text-white hover:text-zinc-300 transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-white transition-all duration-300 overflow-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Autoplay toggle */}
            <button
              onClick={() => setAutoplayNext(!autoplayNext)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              title="Autoplay Next Video"
            >
              <span className="hidden sm:inline">Autoplay</span>
              {autoplayNext ? (
                <ToggleRight className="w-6 h-6 text-red-500" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-zinc-500" />
              )}
            </button>

            {/* Playback speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/50 hover:bg-zinc-800 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-28 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 text-xs text-zinc-300 z-50">
                  <span className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase block">Speed</span>
                  {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-zinc-900 transition-colors ${
                        playbackSpeed === speed ? 'text-red-500 font-bold' : ''
                      }`}
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in picture */}
            <button
              onClick={handlePictureInPicture}
              className="text-white hover:text-red-500 transition-colors"
              title="Picture in Picture"
            >
              <Tv2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="text-white hover:text-red-500 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
