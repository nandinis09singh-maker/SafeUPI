import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  CheckCircle2
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

  const scannerRef = useRef(null);
  const qrRegionId = 'safeupi-qr-video-region';

  // Available sample QR payloads for instant testing
  const sampleScenarios = [
    {
      title: 'Electricity Refund Scam',
      badge: 'HIGH RISK',
      color: '#DC2626',
      payload: 'upi://pay?pa=refund-desk-8899@paytm&pn=Electricity%20Department&am=4500&cu=INR&tn=Scan%20to%20receive%20refund',
    },
    {
      title: 'Fake PhonePe Cashback Collect',
      badge: 'HIGH RISK',
      color: '#DC2626',
      payload: 'upi://pay?pa=phonepe.rewards992@ybl&pn=PhonePe%20Reward%20Office&am=1999&cu=INR&tn=Enter%20UPI%20PIN%20to%20credit%20cashback',
    },
    {
      title: 'Legitimate Supermarket QR',
      badge: 'SAFE',
      color: '#059669',
      payload: 'upi://pay?pa=reliancefresh@okaxis&pn=Reliance%20Fresh%20Supermarket&am=240.00&cu=INR&tn=Grocery%20Store%20POS',
    },
  ];

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Fetch available camera devices
  const getCameraDevices = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setSelectedCameraId(devices[0].id);
        return devices;
      } else {
        setCameraError('No camera detected on this system. Please use manual input or image upload.');
        return [];
      }
    } catch (err) {
      setCameraError('Camera access denied or unavailable. You can still test with sample scenarios or manual payload below.');
      return [];
    }
  };

  const startCamera = async (cameraId = null) => {
    setCameraError(null);
    setResult(null);

    try {
      let targetId = cameraId || selectedCameraId;
      if (!targetId) {
        const devices = await getCameraDevices();
        if (devices.length > 0) targetId = devices[0].id;
        else return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      } else if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        targetId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          stopCamera();
          analyzePayload(decodedText);
        },
        (errorMessage) => {
          // Normal frame scan tick
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Failed to start camera:', err);
      setCameraError(err.message || 'Unable to start camera stream.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError(null);
    setLoading(true);

    try {
      const html5Qr = new Html5Qrcode('file-upload-temp-region');
      const decodedText = await html5Qr.scanFile(file, true);
      analyzePayload(decodedText);
    } catch (err) {
      setFileError('Could not decode a valid QR code from this image. Please ensure the QR is clear and well-lit.');
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
    analyzePayload(manualPayload);
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          UPI QR Code Fraud Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Scan physical or digital UPI QR codes to inspect the payee identity, requested amount, and deceptive transaction lures.
        </p>
      </div>

      {/* Tabs */}
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
          <span>Live Camera Scan</span>
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
          <span>Upload QR Image</span>
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
          <span>Manual Input / Scenarios</span>
        </button>
      </div>

      {/* Mode 1: Camera Scanner */}
      {activeTab === 'camera' && (
        <div className="safe-card" style={{ textAlign: 'center', position: 'relative' }}>
          <div
            id={qrRegionId}
            style={{
              width: '100%',
              maxWidth: '480px',
              minHeight: '300px',
              margin: '0 auto 1.25rem auto',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: isScanning ? '2px solid var(--primary-bright)' : '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!isScanning && (
              <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <Camera size={48} color="var(--primary-bright)" style={{ margin: '0 auto 1rem auto', opacity: 0.8 }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Camera Ready
                </h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '320px', margin: '0 auto' }}>
                  Click Start Camera below to scan real physical UPI QR codes using your device's webcam or mobile camera.
                </p>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            {!isScanning ? (
              <button
                onClick={() => startCamera()}
                className="btn-primary"
                style={{ padding: '0.75rem 1.75rem' }}
              >
                <Camera size={18} />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  className="btn-danger"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  <CameraOff size={18} />
                  <span>Stop Camera</span>
                </button>
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    <SwitchCamera size={18} />
                    <span>Switch Camera</span>
                  </button>
                )}
              </>
            )}
          </div>

          {cameraError && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              background: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--risk-high-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={18} />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Upload Image */}
      {activeTab === 'file' && (
        <div className="safe-card" style={{ textAlign: 'center' }}>
          <div id="file-upload-temp-region" style={{ display: 'none' }} />
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            cursor: 'pointer',
            background: 'var(--bg-surface)',
            transition: 'border-color 0.2s',
          }}>
            <Upload size={44} color="var(--primary-bright)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Upload QR Code Screenshot or Image
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Select a PNG, JPG, or WEBP image containing a UPI payment QR code.
            </p>
            <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <span>Choose Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
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
            }}>
              {fileError}
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
                UPI URI or Raw QR Payload:
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. upi://pay?pa=merchant@okicici&pn=Merchant%20Name&am=250&cu=INR&tn=Bill"
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
                  <span>Evaluating Risk Heuristics...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  <span>Analyze QR Payload</span>
                </>
              )}
            </button>
          </form>

          {/* Test Presets */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
              Quick Test Presets (One-Click Verification)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {sampleScenarios.map((sc, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setManualPayload(sc.payload);
                    analyzePayload(sc.payload);
                  }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = sc.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{sc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>{sc.payload}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: sc.color,
                    background: 'var(--bg-card)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: `1px solid ${sc.color}40`,
                    whiteSpace: 'nowrap',
                    marginLeft: '1rem',
                  }}>
                    {sc.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} color="var(--primary-bright)" className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            Analyzing UPI Indicators...
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            Running Java rules engine: checking institutional impersonation, collect request traps & blacklist...
          </p>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <RiskCard
          result={result}
          onReportScam={onReportScam}
        />
      )}

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
