import React from 'react';
import VoiceOrb from './VoiceOrb';

export interface VoiceOrbProps {
    state?: 'idle' | 'listening' | 'speaking' | 'paused';
    audioSource?: AudioNode | HTMLAudioElement | MediaStream | null;
    size?: number;
    transparent?: boolean;
    onClick?: () => void;
    className?: string;
}

export const VoiceOrbComponent: React.FC<VoiceOrbProps> = (props) => {
    return <VoiceOrb {...props} />;
};

export default VoiceOrb;
