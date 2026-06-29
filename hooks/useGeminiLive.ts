import { useState, useRef, useEffect, useCallback } from 'react';
import { ConnectionState } from '../types';
import { arrayBufferToBase64, decodeAudioData, float32ToPCM16, base64ToUint8Array } from '../utils/audio';

// Constants for Audio Contexts
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState<number>(0); // For visualization
  
  // Refs for audio handling to avoid re-renders
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const wsRef = useRef<WebSocket | null>(null);

  // Refs for tracking session metadata and transcripts
  const sessionStartRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const transcriptsRef = useRef<Array<{role: string, text?: string, timestamp: string}>>([]);

  const disconnect = useCallback(async () => {
    // 1. Close websocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 2. Stop all playing audio
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();

    // 3. Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 4. Disconnect audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // 5. Close contexts
    if (inputContextRef.current) {
      await inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      await outputContextRef.current.close();
      outputContextRef.current = null;
    }

    setStatus(ConnectionState.DISCONNECTED);
    setVolume(0);

    // Save session data to backend
    if (sessionStartRef.current > 0) {
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            duration,
            transcripts: transcriptsRef.current,
            metadata: {
              browser: navigator.userAgent,
              language: navigator.language,
              os: navigator.platform
            }
          })
        });
      } catch (err) {
        console.error("Failed to save session to backend:", err);
      }
      
      sessionStartRef.current = 0;
      transcriptsRef.current = [];
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setStatus(ConnectionState.CONNECTING);
      
      sessionStartRef.current = Date.now();
      sessionIdRef.current = Math.random().toString(36).substring(2, 15);
      transcriptsRef.current = [];

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prepare Audio Processing Graph (Input)
      const inputCtx = inputContextRef.current;
      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM access (bufferSize: 4096)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      ws.onopen = () => {
        setStatus(ConnectionState.CONNECTED);
        
        // Start processing audio from mic
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Simple volume meter for visualization
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(Math.min(rms * 5, 1)); // Amplify for visual

          // Convert Float32 to PCM16
          const pcm16 = float32ToPCM16(inputData);
          const base64Data = arrayBufferToBase64(pcm16.buffer);

          // Send to server
          if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify({ audio: base64Data }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          const outputCtx = outputContextRef.current;
          if (!outputCtx) return;

          if (msg.text) {
             transcriptsRef.current.push({
               role: 'assistant',
               text: msg.text,
               timestamp: new Date().toISOString()
             });
          }

          if (msg.audio) {
            const audioData = base64ToUint8Array(msg.audio);
            const audioBuffer = await decodeAudioData(audioData, outputCtx, OUTPUT_SAMPLE_RATE);
            
            const bufferSource = outputCtx.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(outputCtx.destination);
            
            // Handle visualization for output
            setVolume(0.5 + (Math.random() * 0.3)); // Simulate speaking volume

            // Schedule playback
            const currentTime = outputCtx.currentTime;
            if (nextStartTimeRef.current < currentTime) {
              nextStartTimeRef.current = currentTime;
            }
            
            bufferSource.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            
            activeSourcesRef.current.add(bufferSource);
            bufferSource.onended = () => {
              activeSourcesRef.current.delete(bufferSource);
              if (activeSourcesRef.current.size === 0) {
                 setVolume(0); // Reset volume when silence
              }
            };
          }

          if (msg.interrupted) {
            activeSourcesRef.current.forEach(src => {
              try { src.stop(); } catch(e) {}
            });
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }

          if (msg.error) {
             console.error("Server reported error:", msg.error);
             setStatus(ConnectionState.ERROR);
             disconnect();
          }

        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        disconnect();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        setStatus(ConnectionState.ERROR);
        disconnect();
      };

    } catch (error) {
      console.error("Failed to connect:", error);
      setStatus(ConnectionState.ERROR);
      disconnect();
    }
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    volume,
    connect,
    disconnect
  };
};