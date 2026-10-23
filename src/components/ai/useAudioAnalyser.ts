import { useAudioAnalyser } from './useAudioAnalyser';

export interface UseAudioAnalyserOptions {
    audioSource?: AudioNode | HTMLAudioElement | MediaStream | null;
    fftSize?: number;
    smoothingTimeConstant?: number;
    fakeSpeaking?: boolean;
}

export interface UseAudioAnalyserReturn {
    amplitude: number;
    isMicActive: boolean;
    micError: string | null;
    startMic: () => Promise<boolean>;
    stopMic: () => void;
    toggleMic: () => void;
    analyserNode: AnalyserNode | null;
}

export default useAudioAnalyser;
