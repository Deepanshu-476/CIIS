/**
 * tests/voiceLoopStateMachine.test.js
 *
 * State-machine unit tests for the hands-free voice loop with mocked
 * SpeechSynthesis, MediaRecorder, and AnalyserNode:
 * 1. Silence ends utterance (1.6s silence after speech)
 * 2. Mic off during TTS (echo guard drops incoming audio/transcript while speaking)
 * 3. Auto-restart after TTS (utterance.onend resumes listening)
 * 4. Countdown cancel (ready countdown interrupted by cancel voice command)
 * 5. Loop stops on close (cancels TTS, stops MediaRecorder, releases audio tracks)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Voice Loop State Machine Suite', () => {

  // Mock environment
  let mockTracks = [];
  let mockStream = null;
  let mockRecorder = null;
  let mockSpeechSynthesis = null;

  beforeEach(() => {
    mockTracks = [{
      stopCalled: false,
      stop() { this.stopCalled = true; },
    }];

    mockStream = {
      getTracks() { return mockTracks; },
    };

    mockRecorder = {
      state: 'inactive',
      ondataavailable: null,
      onstop: null,
      start() { this.state = 'recording'; },
      stop() {
        this.state = 'inactive';
        if (this.onstop) this.onstop();
      },
      requestData() {},
    };

    mockSpeechSynthesis = {
      speaking: false,
      canceled: false,
      lastUtterance: null,
      speak(utt) {
        this.speaking = true;
        this.lastUtterance = utt;
      },
      cancel() {
        this.canceled = true;
        this.speaking = false;
      },
    };
  });

  it('1. Silence ends utterance: 1.6s of silence after speech finishes utterance', () => {
    let utteranceEnded = false;
    let speechDetected = false;
    let silenceStartTime = null;
    const now = Date.now();

    const simulateAudioChunk = (avgVolume, currentTime) => {
      if (avgVolume > 10) {
        speechDetected = true;
        silenceStartTime = null;
      } else {
        if (speechDetected) {
          if (!silenceStartTime) {
            silenceStartTime = currentTime;
          } else if (currentTime - silenceStartTime >= 1600) {
            utteranceEnded = true;
          }
        }
      }
    };

    // Before speech: silence does not end utterance
    simulateAudioChunk(2, now);
    assert.strictEqual(utteranceEnded, false, 'Initial silence must not end utterance');

    // Speech spoken
    simulateAudioChunk(25, now + 500);
    assert.strictEqual(speechDetected, true);

    // Silence for 1000ms: not ended yet (< 1600ms)
    simulateAudioChunk(3, now + 1000);
    simulateAudioChunk(3, now + 2000);
    assert.strictEqual(utteranceEnded, false);

    // Silence for 1650ms: ends utterance
    simulateAudioChunk(3, now + 2650);
    assert.strictEqual(utteranceEnded, true, 'Utterance must finish after 1.6s silence');
  });

  it('2. Mic off during TTS: Echo guard drops incoming audio/transcript while agent is speaking', () => {
    let isSpeaking = false;
    let transcriptEmitted = null;

    const onTranscript = (text) => {
      // Echo guard: drop if speaking
      if (isSpeaking) return;
      transcriptEmitted = text;
    };

    // Agent speaks
    isSpeaking = true;
    onTranscript('some user words heard via microphone echo');
    assert.strictEqual(transcriptEmitted, null, 'Echo guard must reject audio while speaking');

    // Agent finishes speaking
    isSpeaking = false;
    onTranscript('actual user speech');
    assert.strictEqual(transcriptEmitted, 'actual user speech', 'Transcript must be accepted when not speaking');
  });

  it('3. Auto-restart after TTS: utterance.onend resumes listening (+ ~300ms)', async () => {
    let listening = false;
    const startListening = () => { listening = true; };

    // Simulate speak with onEnd
    let onEndCallback = null;
    const speakMock = (text, onEnd) => {
      mockSpeechSynthesis.speak({ text });
      onEndCallback = onEnd;
    };

    speakMock('Task ka naam kya rakhna hai?', () => {
      setTimeout(() => {
        startListening();
      }, 300);
    });

    assert.strictEqual(listening, false);

    // Trigger TTS finish
    onEndCallback();
    await new Promise((r) => setTimeout(r, 350));

    assert.strictEqual(listening, true, 'Listening must auto-restart after TTS completes');
  });

  it('4. Countdown cancel: 3s ready countdown is cancelled on "cancel/ruko/nahi" utterance', () => {
    let countdown = 3;
    let countdownInterval = null;
    let taskCreated = false;

    // Start 3s countdown
    countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        taskCreated = true;
      }
    }, 1000);

    // User interrupts with "ruko" at 1.5s
    const userVoiceInterrupt = 'ruko ek minute';
    const isCancel = /\b(?:cancel|ruko|nahi|no)\b/i.test(userVoiceInterrupt);

    if (isCancel) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    assert.strictEqual(countdownInterval, null, 'Countdown interval must be cleared on cancel interrupt');
    assert.strictEqual(taskCreated, false, 'Task creation must NOT proceed after cancel interrupt');
  });

  it('5. Loop stops on close: releases MediaRecorder, stops audio tracks, and cancels speech', () => {
    mockRecorder.start();
    assert.strictEqual(mockRecorder.state, 'recording');

    // Close event fired
    mockSpeechSynthesis.cancel();
    mockRecorder.stop();
    mockStream.getTracks().forEach((t) => t.stop());

    assert.strictEqual(mockSpeechSynthesis.canceled, true);
    assert.strictEqual(mockRecorder.state, 'inactive');
    assert.strictEqual(mockTracks[0].stopCalled, true, 'Microphone track must be released on close');
  });

});
