import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import QRCode from 'qrcode';
import {
  Camera,
  Upload,
  Keyboard,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CameraOff,
  SwitchCamera,
  CheckCircle2,
  Info,
  QrCode as QrIcon,
  Eye,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import RiskCard from '../components/RiskCard';
import { useLanguage } from '../context/LanguageContext';

export default function QrScannerView({ onReportScam }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'file', 'manual'
  const [manualPayload, setManualPayload] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [scannedRaw, setScannedRaw] = useState(null);
  const [scanTickCount, setScanTickCount] = useState(0);

  // Modal / preview for displaying generated test QR on screen
  const [showTestQrModal, setShowTestQrModal] = useState(null);
  const [presetQrImages, setPresetQrImages] = useState({});

  // Snapshot Photo Modal states (Desktop & Mobile webcam photo capture)
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotError, setSnapshotError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const snapshotVideoRef = useRef(null);
  const snapshotStreamRef = useRef(null);

  const scannerRef = useRef(null);
  const qrRegionId = 'safeupi-qr-video-region';

  // Sample scenarios for instant testing
  const sampleScenarios = [
    {
      id: 'scam1',
      title: 'Electricity Refund Scam',
      badge: 'HIGH RISK',
      color: '#DC2626',
      payload: 'upi://pay?pa=refund-desk-8899@paytm&pn=Electricity%20Department&am=4500&cu=INR&tn=Scan%20to%20receive%20refund',
      desc: 'Impersonates electricity department with deceptive refund lure & collect trap.',
    },
    {
      id: 'scam2',
      title: 'Fake PhonePe Cashback Collect',
      badge: 'HIGH RISK',
      color: '#DC2626',
      payload: 'upi://pay?pa=phonepe.rewards992@ybl&pn=PhonePe%20Reward%20Office&am=1999&cu=INR&tn=Enter%20UPI%20PIN%20to%20credit%20cashback',
      desc: 'Requests UPI PIN under the false premise of crediting a cashback reward.',
    },
    {
      id: 'safe1',
      title: 'Legitimate Supermarket QR',
      badge: 'SAFE',
      color: '#059669',
      payload: 'upi://pay?pa=reliancefresh@okaxis&pn=Reliance%20Fresh%20Supermarket&am=240.00&cu=INR&tn=Grocery%20Store%20POS',
      desc: 'Standard NPCI merchant transaction format without suspicious keywords.',
    },
  ];

  // Pre-generate scannable QR images for all sample scenarios on mount
  useEffect(() => {
    sampleScenarios.forEach(async (sc) => {
      try {
        const url = await QRCode.toDataURL(sc.payload, {
          width: 320,
          margin: 2,
          color: { dark: '#0A192F', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        setPresetQrImages((prev) => ({ ...prev, [sc.id]: url }));
      } catch (err) {
        console.warn('Could not generate sample QR:', err);
      }
    });

    // Enumerate connected cameras initially
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((e) => console.warn('Camera pre-enumeration:', e));

    return () => {
      stopCamera();
    };
  }, []);

  // Audio chime feedback for successful scan
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // AudioContext not supported or blocked
    }
  };

  const startCamera = async (cameraId = null) => {
    setCameraError(null);
    setScannedRaw(null);
    setResult(null);

    try {
      // Clean up previous instance cleanly
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          console.warn('Clearing previous scanner:', e);
        }
        scannerRef.current = null;
      }

      setIsScanning(true);
      setScanTickCount(0);

      // Brief tick to ensure the container div is mounted in the DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Dedicate decoding exclusively to QR codes for maximum speed & sensitivity
      const html5QrCode = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Ensure devices list is up to date
      let availableDevices = cameras;
      if (!availableDevices || availableDevices.length === 0) {
        try {
          const devs = await Html5Qrcode.getCameras();
          if (devs && devs.length > 0) {
            setCameras(devs);
            availableDevices = devs;
          }
        } catch (e) {
          console.warn('Initial camera query warning:', e);
        }
      }

      const scanConfig = { fps: 20 };

      const onScanSuccess = async (decodedText) => {
        console.log('Real QR Code successfully decoded:', decodedText);
        playSuccessBeep();
        if (navigator.vibrate) {
          try { navigator.vibrate([80, 50, 80]); } catch (e) {}
        }
        setScannedRaw(decodedText);
        await stopCamera();
        analyzePayload(decodedText);
      };

      const onScanFailure = () => {
        setScanTickCount((prev) => prev + 1);
      };

      let started = false;
      let lastErr = null;

      // Strategy 1: Known Camera Device ID (plain string ID)
      const targetId = cameraId || selectedCameraId || (availableDevices?.[0]?.id);
      if (targetId) {
        try {
          await html5QrCode.start(targetId, scanConfig, onScanSuccess, onScanFailure);
          started = true;
        } catch (e) {
          console.warn('Direct device ID start failed, trying facingMode user:', e);
          lastErr = e;
        }
      }

      // Strategy 2: Laptop Front Camera (facingMode "user")
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'user' }, scanConfig, onScanSuccess, onScanFailure);
          started = true;
        } catch (e) {
          console.warn('facingMode user failed, trying environment:', e);
          lastErr = e;
        }
      }

      // Strategy 3: Mobile Back Camera (facingMode "environment")
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, scanConfig, onScanSuccess, onScanFailure);
          started = true;
        } catch (e) {
          console.warn('facingMode environment failed:', e);
          lastErr = e;
        }
      }

      if (!started) {
        throw lastErr || new Error('Unable to access camera.');
      }

      // Re-enumerate cameras in background to populate selector
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            if (!selectedCameraId) {
              setSelectedCameraId(devices[0].id);
            }
          }
        })
        .catch((e) => console.warn('Camera enumeration error:', e));

    } catch (err) {
      console.error('Failed to start camera:', err);
      setIsScanning(false);
      let msg = err.message || 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || msg.includes('Permission') || msg.includes('Permission denied')) {
        msg = 'Camera permission was blocked. Please click the lock 🔒 or camera icon in your browser address bar, set Camera to "Allow", and refresh.';
      } else if (err.name === 'NotReadableError' || msg.includes('in use') || msg.includes('Could not start video source')) {
        msg = 'Camera is already in use by another tab or app (Zoom, Teams, Camera app). Please close other tabs/apps and try again.';
      } else if (err.name === 'NotFoundError' || msg.includes('No camera')) {
        msg = 'No physical webcam detected on this device. You can use "Take Photo with Camera" or "Upload QR Image".';
      } else if (msg.includes('secure context') || msg.includes('getUserMedia')) {
        msg = 'Camera requires HTTPS or localhost. Please ensure you are browsing over a secure connection.';
      } else {
        msg = 'Unable to access camera stream. Your webcam might be in use, blocked by browser permissions, or requires a snapshot.';
      }
      setCameraError(msg);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIdx = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextId = cameras[nextIdx].id;
    setSelectedCameraId(nextId);
    if (isScanning) {
      await stopCamera();
      startCamera(nextId);
    }
  };

  const openSnapshotCamera = async () => {
    if (isScanning) {
      await stopCamera();
    }
    setShowSnapshotModal(true);
    setSnapshotError(null);
    setIsCapturing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      });

      snapshotStreamRef.current = stream;
      setTimeout(() => {
        if (snapshotVideoRef.current) {
          snapshotVideoRef.current.srcObject = stream;
          snapshotVideoRef.current.play().catch((e) => console.warn('Video play error:', e));
        }
      }, 150);
    } catch (err) {
      console.error('Failed to open snapshot camera:', err);
      let msg = 'Could not access your webcam.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please click the 🔒 lock icon in your browser address bar and set Camera to "Allow".';
      } else if (err.name === 'NotReadableError') {
        msg = 'Your webcam is currently being used by another application (Zoom, Teams) or another browser tab. Please close it and try again.';
      }
      setSnapshotError(msg);
    }
  };

  const closeSnapshotCamera = () => {
    if (snapshotStreamRef.current) {
      snapshotStreamRef.current.getTracks().forEach((t) => t.stop());
      snapshotStreamRef.current = null;
    }
    setShowSnapshotModal(false);
    setSnapshotError(null);
    setIsCapturing(false);
  };

  const takeSnapshotAndScan = async () => {
    if (!snapshotVideoRef.current) return;
    const video = snapshotVideoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    closeSnapshotCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'webcam-snapshot.png', { type: 'image/png' });
      setLoading(true);
      setFileError(null);
      setScannedRaw(null);

      try {
        const html5Qr = new Html5Qrcode('file-upload-temp-region', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        const decodedText = await html5Qr.scanFile(file, true);
        try { await html5Qr.clear(); } catch (e) {}

        console.log('Decoded from snapshot:', decodedText);
        playSuccessBeep();
        if (navigator.vibrate) {
          try { navigator.vibrate([80, 50, 80]); } catch (e) {}
        }
        setScannedRaw(decodedText);
        analyzePayload(decodedText);
      } catch (err) {
        setFileError('Could not detect a valid QR code in the captured photo. Hold your QR code closer to the camera (~1 foot away) and make sure it is well-lit.');
        setLoading(false);
      }
    }, 'image/png');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setFileError(null);
    setScannedRaw(null);
    setLoading(true);

    try {
      const html5Qr = new Html5Qrcode('file-upload-temp-region', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      const decodedText = await html5Qr.scanFile(file, true);
      try { await html5Qr.clear(); } catch (e) {}

      console.log('Decoded from image file:', decodedText);
      playSuccessBeep();
      setScannedRaw(decodedText);
      analyzePayload(decodedText);
    } catch (err) {
      setFileError('Could not decode a valid QR code from this image. Please ensure the QR code is clearly visible, well-lit, and in focus.');
      setLoading(false);
    }
  };

  const analyzePayload = async (payload) => {
    if (!payload || !payload.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await api.analyzeQr(payload.trim());
      setResult(res);
    } catch (err) {
      setCameraError('Analysis error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setScannedRaw(manualPayload);
    analyzePayload(manualPayload);
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Hidden container for file scanning */}
      <div
        id="file-upload-temp-region"
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('qrTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('qrSubtitle')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.35rem',
        marginBottom: '1.5rem',
      }}>
        <button
          onClick={() => { setActiveTab('camera'); setResult(null); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'camera' ? '#FFFFFF' : 'var(--text-muted)',
            background: activeTab === 'camera' ? 'var(--primary)' : 'transparent',
          }}
        >
          <Camera size={18} />
          <span>{t('tabLiveCamera')}</span>
        </button>

        <button
          onClick={() => { setActiveTab('file'); stopCamera(); setResult(null); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'file' ? '#FFFFFF' : 'var(--text-muted)',
            background: activeTab === 'file' ? 'var(--primary)' : 'transparent',
          }}
        >
          <Upload size={18} />
          <span>{t('tabUploadImage')}</span>
        </button>

        <button
          onClick={() => { setActiveTab('manual'); stopCamera(); setResult(null); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'manual' ? '#FFFFFF' : 'var(--text-muted)',
            background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
          }}
        >
          <Keyboard size={18} />
          <span>{t('tabManualInput')}</span>
        </button>
      </div>

      {/* Mode 1: Camera Scanner */}
      {activeTab === 'camera' && (
        <div className="safe-card" style={{ textAlign: 'center', position: 'relative' }}>
          {/* Scanner Viewport Container */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto 1.25rem auto' }}>
            {/* The dedicated mount node for Html5Qrcode - No React children inside */}
            <div
              id={qrRegionId}
              style={{
                width: '100%',
                minHeight: isScanning ? '340px' : '0px',
                height: isScanning ? 'auto' : '0px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                opacity: isScanning ? 1 : 0,
                position: isScanning ? 'relative' : 'absolute',
                pointerEvents: isScanning ? 'auto' : 'none',
                border: isScanning ? '2px solid var(--primary-bright)' : 'none',
                background: '#000000',
                boxShadow: isScanning ? '0 4px 25px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            />

            {/* Active Scanning Overlay with reticle & live radar */}
            {isScanning && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1rem',
                }}
              >
                {/* Status Bar */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  alignSelf: 'center',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} className="pulse-dot" />
                  <span>{t('scanningFullFrame')}</span>
                </div>

                {/* Laser Scanning Line */}
                <div className="scanner-laser" />

                {/* Corner reticle guides */}
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  left: '20%',
                  right: '20%',
                  bottom: '20%',
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.74rem',
                  alignSelf: 'center',
                }}>
                  {t('alignQrGuide')}
                </div>
              </div>
            )}

            {/* Idle Placeholder Card when camera is NOT active */}
            {!isScanning && (
              <div
                style={{
                  width: '100%',
                  minHeight: '280px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.5rem 1.5rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Camera size={52} color="var(--primary-bright)" style={{ margin: '0 auto 1rem auto', opacity: 0.9 }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {t('cameraReady')}
                </h4>
                <p style={{ fontSize: '0.88rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
                  {t('cameraReadyDesc')}
                </p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {!isScanning ? (
              <>
                <button
                  onClick={() => startCamera()}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '0.92rem' }}
                >
                  <Camera size={18} />
                  <span>{t('startLiveCamera')}</span>
                </button>

                {/* Instant Snapshot Fallback with live webcam photo booth */}
                <button
                  type="button"
                  onClick={openSnapshotCamera}
                  className="btn-secondary"
                  style={{
                    padding: '0.75rem 1.35rem',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  title="Open webcam view and snap a clear photo of the QR code"
                >
                  <Camera size={18} color="var(--primary-bright)" />
                  <span>{t('takePhotoCamera')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  className="btn-danger"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}
                >
                  <CameraOff size={18} />
                  <span>{t('stopCamera')}</span>
                </button>

                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.92rem' }}
                  >
                    <SwitchCamera size={18} />
                    <span>{t('switchCamera')}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Active Camera Selector Dropdown */}
          {cameras.length > 0 && !isScanning && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{t('selectCameraDevice')}</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                }}
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pro-Tips: Why Webcams Struggle to Read QR Codes */}
          <div style={{
            margin: '1.5rem auto 0 auto',
            maxWidth: '650px',
            textAlign: 'left',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary-bright)', fontWeight: 700, fontSize: '0.88rem' }}>
              <Info size={17} />
              <span>{t('scanningTipsTitle')}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>{t('tipFocusDistance')}</li>
              <li>{t('tipGlare')}</li>
              <li>{t('tipSnapshot')}</li>
            </ul>
          </div>

          {/* Camera Error Message with Actionable Help */}
          {cameraError && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              background: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--risk-high-text)',
              fontSize: '0.86rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={22} color="var(--risk-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {cameraError}
                  </div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                    {t('cameraAccessTroubleshoot')}
                  </div>
                </div>
              </div>

              <ul style={{ margin: '0 0 1rem 1.5rem', padding: 0, fontSize: '0.82rem', lineHeight: 1.6 }}>
                <li>{t('cameraStepPermission')}</li>
                <li>{t('cameraStepInUse')}</li>
                <li>{t('cameraStepPhoto')}</li>
              </ul>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  onClick={() => startCamera()}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  <RefreshCw size={14} />
                  <span>{t('tryAgainBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={openSnapshotCamera}
                  className="btn-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Camera size={14} color="var(--primary-bright)" />
                  <span>{t('takePhotoCamera')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('file')}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  <Upload size={14} />
                  <span>{t('tabUploadImage')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Upload Image */}
      {activeTab === 'file' && (
        <div className="safe-card" style={{ textAlign: 'center' }}>
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            cursor: 'pointer',
            background: 'var(--bg-surface)',
            transition: 'border-color 0.2s',
          }}>
            <Upload size={48} color="var(--primary-bright)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              {t('uploadTitle')}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              {t('uploadSubtitle')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
              <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer', padding: '0.75rem 1.5rem' }}>
                <Upload size={18} />
                <span>{t('chooseImageBtn')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="button"
                onClick={openSnapshotCamera}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.92rem',
                }}
              >
                <Camera size={18} color="var(--primary-bright)" />
                <span>{t('takePhotoCamera')}</span>
              </button>
            </div>
          </div>

          {fileError && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              background: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--risk-high-text)',
              fontSize: '0.85rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Manual Input & Preset Test Scenarios */}
      {activeTab === 'manual' && (
        <div className="safe-card">
          <form onSubmit={handleManualSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {t('manualLabel')}
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={t('manualPlaceholder')}
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !manualPayload.trim()}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>{t('analyzingHeuristics')}</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  <span>{t('analyzeQrBtn')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Scannable Test QR Presets (Available on all tabs for easy testing!) */}
      <div className="safe-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {t('quickTestTitle')}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              {t('quickTestSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
          {sampleScenarios.map((sc) => (
            <div
              key={sc.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {sc.title}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: sc.color,
                    background: 'var(--bg-card)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: `1px solid ${sc.color}40`,
                  }}>
                    {sc.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  {sc.desc}
                </p>

                {/* Scannable QR Code Thumbnail */}
                {presetQrImages[sc.id] && (
                  <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                    <img
                      src={presetQrImages[sc.id]}
                      alt={sc.title}
                      style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: '#FFF',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setShowTestQrModal(sc)}
                      title="Click to expand QR code to full size"
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      (Click QR to enlarge on screen)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  onClick={() => {
                    setManualPayload(sc.payload);
                    setScannedRaw(sc.payload);
                    analyzePayload(sc.payload);
                  }}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  <ShieldAlert size={14} />
                  <span>{t('analyzePresetBtn')}</span>
                </button>

                <button
                  onClick={() => setShowTestQrModal(sc)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  title="Enlarge QR Code"
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Scanned Payload Feedback Banner */}
      {scannedRaw && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.85rem 1.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'left',
        }}>
          <CheckCircle2 size={22} color="var(--risk-low)" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--risk-low)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('qrDetectedBanner')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '2px' }}>
              {scannedRaw}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} color="var(--primary-bright)" className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            {t('analyzingHeuristics')}
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            {t('analyzingRulesEngine')}
          </p>
        </div>
      )}

      {/* Risk Analysis Result Card */}
      {result && (
        <div style={{ marginTop: '1.5rem' }}>
          <RiskCard
            result={result}
            onReportScam={onReportScam}
          />
        </div>
      )}

      {/* Modal: Full-screen Enlarge QR Code for phone testing */}
      {showTestQrModal && (
        <div
          onClick={() => setShowTestQrModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="safe-card"
            style={{ maxWidth: '420px', width: '100%', textAlign: 'center', padding: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {showTestQrModal.title}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: showTestQrModal.color,
                background: 'var(--bg-surface)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}>
                {showTestQrModal.badge}
              </span>
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: '1rem',
              borderRadius: '16px',
              display: 'inline-block',
              margin: '0.5rem auto 1rem auto',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            }}>
              <img
                src={presetQrImages[showTestQrModal.id]}
                alt={showTestQrModal.title}
                style={{ width: '260px', height: '260px', display: 'block' }}
              />
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {t('enlargeQrModalTitle')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setManualPayload(showTestQrModal.payload);
                  setScannedRaw(showTestQrModal.payload);
                  analyzePayload(showTestQrModal.payload);
                  setShowTestQrModal(null);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                {t('scanDirectly')}
              </button>
              <button
                onClick={() => setShowTestQrModal(null)}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.25rem' }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Webcam Snapshot Modal (Direct webcam viewfinder for PC & Mobile) */}
      {showSnapshotModal && (
        <div
          onClick={closeSnapshotCamera}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="safe-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeSnapshotCamera}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                color: 'var(--text-dim)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Camera size={22} color="var(--primary-bright)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Webcam Camera Photo
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Hold your QR code up to your webcam, then click "Capture Photo & Scan".
            </p>

            {snapshotError ? (
              <div style={{
                padding: '1.25rem',
                background: 'var(--risk-high-bg)',
                border: '1px solid var(--risk-high-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--risk-high-text)',
                fontSize: '0.86rem',
                textAlign: 'left',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={20} color="var(--risk-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontWeight: 700 }}>{snapshotError}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tip: Look at the top address bar in Chrome, click the 🔒 lock icon next to the URL, and ensure Camera is set to "Allow".
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={openSnapshotCamera} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                    <RefreshCw size={14} />
                    <span>Try Again</span>
                  </button>
                  <button onClick={closeSnapshotCamera} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Live Video Viewport */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  maxHeight: '340px',
                  background: '#000',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  margin: '0 auto 1.25rem auto',
                  border: '2px solid var(--primary-bright)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  <video
                    ref={snapshotVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Target frame overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    right: '15%',
                    bottom: '15%',
                    border: '2px dashed rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                  }} />

                  <div style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    Hold QR code here
                  </div>
                </div>

                {/* Shutter Button */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={takeSnapshotAndScan}
                    disabled={isCapturing}
                    className="btn-primary"
                    style={{
                      padding: '0.85rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 15px rgba(29, 106, 229, 0.4)',
                    }}
                  >
                    <Camera size={20} />
                    <span>{isCapturing ? 'Processing Photo...' : '📸 Capture Photo & Scan'}</span>
                  </button>
                  <button
                    onClick={closeSnapshotCamera}
                    className="btn-secondary"
                    style={{ padding: '0.85rem 1.25rem', fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #00E5FF 50%, transparent 100%);
          box-shadow: 0 0 14px #00E5FF;
          animation: scanLaser 2.2s ease-in-out infinite alternate;
        }
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0.3; }
        }
        .pulse-dot {
          animation: pulseDot 1.5s infinite;
        }
        @keyframes pulseDot {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
