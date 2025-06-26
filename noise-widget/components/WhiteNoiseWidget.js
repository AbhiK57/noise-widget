"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Timer, CloudRain, Waves, Sun } from 'lucide-react';

const Forest = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-8"/>
    <path d="M12 14l-4-4-2 2-2-2-4 4 6 6z"/>
    <path d="M12 14l4-4 2 2 2-2 4 4-6 6z"/>
  </svg>
);


// --- Individual Sound Control Component ---
const SoundControl = React.memo(({ sound, onVolumeChange, initialVolume }) => {
    const [volume, setVolume] = useState(initialVolume);
    const audioRef = useRef(null);

    // Effect to control audio playback and volume
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volume;
            if (volume > 0 && audio.paused) {
                audio.play().catch(error => console.error(`Error playing ${sound.name}:`, error));
            } else if (volume === 0 && !audio.paused) {
                audio.pause();
            }
        }
    }, [volume, sound.name]);

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        onVolumeChange(sound.id, newVolume);
    };

    return (
        <div className="flex items-center space-x-4 group">
            <div className="w-10 h-10 flex items-center justify-center text-slate-300 group-hover:text-teal-300 transition-colors">
                {sound.icon}
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-slate-500/30 rounded-lg appearance-none cursor-pointer accent-teal-400"
                aria-label={`${sound.name} volume`}
            />
            <audio ref={audioRef} src={sound.src} loop preload="auto" />
        </div>
    );
});
SoundControl.displayName = 'SoundControl';


// --- Main Widget Component ---
const WhiteNoiseWidget = () => {
    const SOUNDS = [
        { id: 'rain', name: 'Rain', src: '/sounds/rain.mp3', icon: <CloudRain size={28} /> },
        { id: 'forest', name: 'Forest', src: 'https://cdn.pixabay.com/audio/2022/09/20/audio_b72410a539.mp3', icon: <Forest /> },
        { id: 'ocean', name: 'Ocean', src: '/sounds/ocean.mp3', icon: <Waves size={28} /> },
        { id: 'summer', name: 'Summer Night', src: '/sounds/sun.mp3', icon: <Sun size={28} /> },
    ];
    
    const [volumes, setVolumes] = useState(() => SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}));
    const [isAnythingPlaying, setIsAnythingPlaying] = useState(false);
    const [lastPlayedVolumes, setLastPlayedVolumes] = useState(() => SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: 0.5 }), {}));
    
    const [timerDuration, setTimerDuration] = useState(0); // in seconds
    const [timerRemaining, setTimerRemaining] = useState(0);
    const timerIntervalRef = useRef(null);

    // --- Audio Logic ---
    const handleVolumeChange = useCallback((id, volume) => {
        setVolumes(prev => ({ ...prev, [id]: volume }));
    }, []);

    const stopAllSounds = useCallback(() => {
        setVolumes(SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}));
    }, [SOUNDS]);

    const toggleMasterPlay = () => {
        if (isAnythingPlaying) {
            // Store current volumes before pausing
            setLastPlayedVolumes(volumes);
            stopAllSounds();
        } else {
            // Restore last played volumes
            setVolumes(lastPlayedVolumes);
        }
    };

    // Effect to sync the master play button state
    useEffect(() => {
        const isAnySoundOn = Object.values(volumes).some(v => v > 0);
        setIsAnythingPlaying(isAnySoundOn);
    }, [volumes]);


    // --- Timer Logic ---
    const cleanupTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const startTimer = (durationInSeconds) => {
        cleanupTimer(); // Clear any existing timer
        setTimerDuration(durationInSeconds);
        setTimerRemaining(durationInSeconds);

        if (durationInSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerRemaining(prev => {
                    if (prev <= 1) {
                        cleanupTimer();
                        stopAllSounds();
                        setTimerDuration(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };
    
    const handleTimerButtonClick = (minutes) => {
        const seconds = minutes * 60;
        if (timerDuration === seconds && timerIntervalRef.current) {
            // If clicking the active timer button, stop the timer
            cleanupTimer();
            setTimerDuration(0);
            setTimerRemaining(0);
        } else {
            startTimer(seconds);
        }
    };

    // Cleanup timer on component unmount
    useEffect(() => {
        return cleanupTimer;
    }, []);

    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return 'Set Timer';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="rounded-2xl p-4" data-tauri-drag-region>
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white tracking-wider">Noisy</h1>
                <p className="text-sm text-slate-300">Mix your ambient sounds</p>
            </div>
            
            <div className="space-y-5 mb-8">
                {SOUNDS.map(sound => (
                    <SoundControl
                        key={sound.id}
                        sound={sound}
                        onVolumeChange={handleVolumeChange}
                        initialVolume={volumes[sound.id]}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-black/20 p-4 mb-6">
                <div className="flex items-center space-x-3">
                    <Timer className="text-slate-300" />
                    <span className="font-medium text-white w-24">
                        {formatTime(timerRemaining)}
                    </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                    {[15, 30, 60].map(min => (
                         <button
                            key={min}
                            onClick={() => handleTimerButtonClick(min)}
                            className={`px-3 py-1 rounded-md transition-colors ${timerDuration === min * 60 ? 'bg-teal-400 text-slate-900' : 'bg-slate-600/50 text-slate-200 hover:bg-slate-500/70'}`}
                         >
                             {min}m
                         </button>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={toggleMasterPlay}
                    className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:bg-teal-300 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                    aria-label={isAnythingPlaying ? 'Pause all sounds' : 'Play sounds'}
                >
                    {isAnythingPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
            </div>
        </div>
    );
};

export default WhiteNoiseWidget;