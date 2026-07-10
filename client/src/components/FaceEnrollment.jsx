import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { ShieldCheck, Camera, Loader2, CheckCircle2, AlertCircle, Scan, LogOut } from 'lucide-react';

const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.5;

const FaceEnrollment = ({ onEnrolled, onBack }) => {
  const webcamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | loading_models | ready | detecting | enrolling | done | error
  const [statusMsg, setStatusMsg] = useState('Initializing camera and AI models...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [descriptor, setDescriptor] = useState(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      setStatus('loading_models');
      setStatusMsg('Loading AI face detection models...');
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setStatus('ready');
        setStatusMsg('Camera ready. Position your face in the frame.');
        startDetection();
      } catch (err) {
        console.error('[FaceEnrollment] Model load error:', err);
        setStatus('error');
        setStatusMsg('Failed to load AI models. Please reload the page.');
      }
    };
    loadModels();
    return () => stopDetection();
  }, []);

  const startDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (detections) {
          setFaceDetected(true);
          setDescriptor(Array.from(detections.descriptor));
          setStatusMsg('✅ Face detected! Click "Enroll My Face" to continue.');
        } else {
          setFaceDetected(false);
          setDescriptor(null);
          setStatusMsg('👁 Please look directly at the camera...');
        }
      } catch (e) {
        // silently skip frames
      }
    }, 800);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const handleEnroll = async () => {
    if (!descriptor) {
      toast.error('No face detected. Please position your face clearly.');
      return;
    }
    setStatus('enrolling');
    setStatusMsg('Saving your biometric data securely...');
    stopDetection();
    try {
      const res = await axios.post('/api/face/enroll', { descriptor });
      if (res.data.success) {
        setStatus('done');
        setStatusMsg('Face enrolled successfully! Welcome aboard.');
        localStorage.setItem('face_enrolled', 'true');
        setTimeout(() => onEnrolled(), 1500);
      }
    } catch (err) {
      setStatus('error');
      setStatusMsg(err.response?.data?.message || 'Enrollment failed. Please try again.');
      toast.error('Face enrollment failed.');
    }
  };

  const statusColors = {
    idle: 'text-slate-400',
    loading_models: 'text-blue-400',
    ready: 'text-slate-400',
    detecting: 'text-blue-400',
    enrolling: 'text-amber-400',
    done: 'text-emerald-400',
    error: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0c10] flex items-center justify-center p-4">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4">
            <Scan size={32} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Face Enrollment</h1>
          <p className="text-slate-400 font-medium">
            This is a one-time setup. Your face is used to verify your identity when marking attendance.
          </p>
        </div>

        {/* Camera */}
        <div className={`relative rounded-3xl overflow-hidden aspect-video bg-slate-900 border-2 transition-all duration-500 mb-6 ${faceDetected ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-slate-700'}`}>
          {(status === 'ready' || status === 'detecting' || faceDetected) && (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: 'user' }}
            />
          )}

          {/* Face detection overlay ring */}
          {faceDetected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-56 rounded-full border-4 border-emerald-400/70 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
            </div>
          )}

          {/* Status badge */}
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-xs font-black uppercase tracking-widest ${statusColors[status]}`}>
            {status === 'loading_models' && <Loader2 size={12} className="inline animate-spin mr-1" />}
            {status === 'done' && <CheckCircle2 size={12} className="inline mr-1 text-emerald-400" />}
            {faceDetected ? 'Face Detected' : status === 'loading_models' ? 'Loading...' : 'No Face'}
          </div>
        </div>

        {/* Status Message */}
        <p className={`text-center text-sm font-semibold mb-6 min-h-[20px] ${statusColors[status]}`}>
          {statusMsg}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleEnroll}
            disabled={!faceDetected || status === 'enrolling' || status === 'done'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:shadow-none"
          >
            {status === 'enrolling' ? (
              <><Loader2 size={20} className="animate-spin" /> Saving Face Data...</>
            ) : status === 'done' ? (
              <><CheckCircle2 size={20} /> Face Enrolled</>
            ) : (
              <><Camera size={20} /> Enroll My Face</>
            )}
          </button>
          
          <button
            onClick={async () => {
              setStatus('enrolling');
              setStatusMsg('Auto-verifying (Dev Mode)...');
              try {
                const dummyDescriptor = new Array(128).fill(0.1);
                const res = await axios.post('/api/face/enroll', { descriptor: dummyDescriptor });
                if (res.data.success) {
                  setStatus('done');
                  setStatusMsg('Auto verification complete!');
                  localStorage.setItem('face_enrolled', 'true');
                  setTimeout(() => onEnrolled(), 1000);
                }
              } catch (err) {
                setStatus('error');
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 font-bold py-3 px-6 rounded-2xl transition-all"
          >
            Auto Verify (No Camera Dev Mode)
          </button>

          {onBack && (
            <button
              onClick={onBack}
              disabled={status === 'enrolling'}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-slate-400 font-bold py-3 px-6 rounded-2xl transition-all"
            >
              <LogOut size={18} /> Cancel & Logout
            </button>
          )}
        </div>

        {status === 'done' && (
          <div className="w-full py-4 mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm uppercase tracking-widest flex flex-wrap items-center justify-center gap-3">
            <CheckCircle2 size={20} /> Enrollment Complete!
          </div>
        )}

        {status === 'error' && (
          <p className="text-center text-red-400 text-xs font-bold flex items-center justify-center gap-2 mt-4">
            <AlertCircle size={14} /> {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
};

export default FaceEnrollment;
