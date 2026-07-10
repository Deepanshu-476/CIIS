import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiSquare, FiClock, FiCamera, FiMapPin, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';

const MAX_LOCATION_ACCURACY_METERS = 200;
const LOCATION_SAMPLE_COUNT = 3;

const ClockInSection = ({
  timer,
  isRunning,
  loading,
  isUserInCurrentCompany,
  isProcessing,
  handleIn,
  handleClockOut,
  config
}) => {
  const attendanceMode = config?.settings?.attendanceMode || 'normal';
  const token = localStorage.getItem('token');

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'in' or 'out'
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selfieUploading, setSelfieUploading] = useState(false);

  const videoRef = useRef(null);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const getCoordinates = () => {
    const getSinglePosition = () => new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: "Geolocation is not supported by your browser." });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          resolve({ error: error.message });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

    return new Promise(async (resolve) => {
      const readings = [];
      let lastError = null;

      for (let i = 0; i < LOCATION_SAMPLE_COUNT; i += 1) {
        const reading = await getSinglePosition();
        if (reading.error) {
          lastError = reading.error;
        } else {
          readings.push(reading);
          if (reading.accuracy <= 50) break;
        }
      }

      if (!readings.length) {
        resolve({ error: lastError || "Unable to fetch location." });
        return;
      }

      readings.sort((a, b) => (a.accuracy || Infinity) - (b.accuracy || Infinity));
      resolve(readings[0]);
    });
  };

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const uploadSelfie = async (dataUrl) => {
    try {
      setSelfieUploading(true);
      // Convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('selfie', blob, 'selfie.jpg');

      const uploadRes = await axios.post('/attendance/upload-selfie', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      if (uploadRes.data.success) {
        return uploadRes.data.selfieUrl;
      }
      throw new Error("Selfie upload failed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setSelfieUploading(false);
    }
  };

  const handleActionClick = (mode) => {
    setModalMode(mode);
    // If camera is required, open camera modal
    if (attendanceMode === 'image' || attendanceMode === 'both') {
      setShowCameraModal(true);
      setTimeout(() => startCamera(), 100);
    } else {
      // Just perform normal flow (which might require location only)
      runAttendanceFlow(mode, null);
    }
  };

  const handleCancelModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedImage(null);
  };

  const runAttendanceFlow = async (mode, uploadedSelfieUrl) => {
    let payload = {};
    if (uploadedSelfieUrl) {
      payload.selfieUrl = uploadedSelfieUrl;
    }

    if (attendanceMode === 'location' || attendanceMode === 'both') {
      toast.info("Fetching location...");
      const coords = await getCoordinates();
      if (coords.error) {
        toast.error(`Location error: ${coords.error}`);
        return;
      }
      if (coords.accuracy && coords.accuracy > MAX_LOCATION_ACCURACY_METERS) {
        toast.error(`Location accuracy is low (${Math.round(coords.accuracy)}m). Please use a phone/GPS device or connect to Wi-Fi and try again.`);
        return;
      }
      payload.latitude = coords.latitude;
      payload.longitude = coords.longitude;
      payload.accuracy = coords.accuracy;
    }

    if (mode === 'in') {
      await handleIn(payload);
    } else {
      await handleClockOut(payload);
    }
    setShowCameraModal(false);
  };

  const handleConfirmCaptured = async () => {
    if (!capturedImage) return;
    const selfieUrl = await uploadSelfie(capturedImage);
    if (!selfieUrl) return;
    await runAttendanceFlow(modalMode, selfieUrl);
  };

  return (
    <div className="dashboard-clock-section" style={{ flex: 1, minWidth: '320px' }}>
      <div className="dashboard-timer-display">
        <div className="dashboard-timer-value">{formatTime(timer)}</div>
        <div className={`dashboard-timer-status ${isRunning ? 'status-active-text' : 'status-inactive-text'}`}>
          <div className={`dashboard-timer-dot ${isRunning ? 'dot-active' : 'dot-inactive'}`}></div>
          {isRunning ? 'Active Timer • Live' : 'Timer Stopped'}
        </div>
      </div>
      <div className="dashboard-clock-buttons">
        <button
          onClick={() => handleActionClick('in')}
          disabled={isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading}
          className={`dashboard-btn dashboard-btn-clockin ${isRunning ? 'btn-disabled' : ''}`}
        >
          <FiPlay size={20} /> Clock In
        </button>
        <button
          onClick={() => handleActionClick('out')}
          disabled={!isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading}
          className={`dashboard-btn dashboard-btn-clockout ${!isRunning ? 'btn-disabled' : ''}`}
        >
          <FiSquare size={20} /> Clock Out
        </button>
      </div>

      {showCameraModal && (
        <div className="confirmation-overlay" style={{ zIndex: 1000 }}>
          <div className="confirmation-popup" style={{ maxWidth: '450px' }}>
            <button className="confirmation-close-btn" onClick={handleCancelModal} disabled={selfieUploading}>
              <FiX size={20} />
            </button>
            <h3 className="confirmation-title">{modalMode === 'in' ? 'Clock In Verification' : 'Clock Out Verification'}</h3>
            <p className="confirmation-message" style={{ marginBottom: '15px' }}>
              Your company requires a selfie to verify attendance.
            </p>

            <div style={{ width: '100%', height: '300px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div className="confirmation-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
              {capturedImage ? (
                <>
                  <button className="confirmation-btn confirmation-btn-cancel" onClick={startCamera} disabled={selfieUploading}>
                    Retake
                  </button>
                  <button className="confirmation-btn confirmation-btn-confirm" onClick={handleConfirmCaptured} disabled={selfieUploading}>
                    {selfieUploading ? 'Uploading...' : 'Confirm & Submit'}
                  </button>
                </>
              ) : (
                <>
                  <button className="confirmation-btn confirmation-btn-cancel" onClick={handleCancelModal}>
                    Cancel
                  </button>
                  <button className="confirmation-btn confirmation-btn-confirm" onClick={capturePhoto}>
                    <FiCamera style={{ marginRight: '8px' }} /> Capture Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockInSection;
