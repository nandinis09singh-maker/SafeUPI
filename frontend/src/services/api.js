// SafeUPI REST API Service
const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('safeupi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.message) errMessage = data.message;
    } catch (e) {
      // not json
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Analysis
  async analyzeQr(payload) {
    try {
      const res = await fetch(`${API_BASE}/analyze/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ payload }),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend QR API failed, using client-side fallback rule evaluator:', err);
      return fallbackAnalyzeQr(payload);
    }
  },

  async analyzeMessage(message, senderId = '') {
    try {
      const res = await fetch(`${API_BASE}/analyze/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ message, senderId }),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend Message API failed, using client-side fallback rule evaluator:', err);
      return fallbackAnalyzeMessage(message, senderId);
    }
  },

  async analyzeLink(url) {
    try {
      const res = await fetch(`${API_BASE}/analyze/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ url }),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend Link API failed, using client-side fallback rule evaluator:', err);
      return fallbackAnalyzeLink(url);
    }
  },

  // History
  async getHistory() {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      return JSON.parse(localStorage.getItem('safeupi_local_history') || '[]');
    }
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/history/stats`, {
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      return {
        totalScans: 0,
        highRiskScans: 0,
        mediumRiskScans: 0,
        lowRiskScans: 0,
        totalScamReports: 0,
        trustedContactsCount: 0,
        scansByType: { QR: 0, MESSAGE: 0, LINK: 0 },
      };
    }
  },

  async deleteHistory(id) {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async clearHistory() {
    const res = await fetch(`${API_BASE}/history/clear`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Trusted Contacts
  async getContacts() {
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      return JSON.parse(localStorage.getItem('safeupi_local_contacts') || '[]');
    }
  },

  async addContact(data) {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteContact(id) {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Scam Reports
  async submitReport(data) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getRecentReports() {
    try {
      const res = await fetch(`${API_BASE}/reports/recent`);
      return await handleResponse(res);
    } catch (err) {
      return [];
    }
  },
};

// Client-side fallback rule evaluator (matches the Java rules engine logic exactly)
function fallbackAnalyzeQr(payload) {
  let score = 0;
  const indicators = [];
  const recommendations = [];
  const p = payload || '';
  const lower = p.toLowerCase();

  let payeeVpa = '';
  let payeeName = '';
  let amount = '';
  let note = '';

  try {
    const url = new URL(p.startsWith('upi://') ? p : `upi://pay?${p}`);
    payeeVpa = url.searchParams.get('pa') || '';
    payeeName = url.searchParams.get('pn') || '';
    amount = url.searchParams.get('am') || '';
    note = url.searchParams.get('tn') || '';
  } catch (e) {
    if (p.includes('@')) payeeVpa = p;
  }

  if (lower.includes('refund') || lower.includes('receive') || lower.includes('claim')) {
    score += 50;
    indicators.push({
      id: 'RECEIVE_MONEY_DECEPTION',
      title: 'Fake "Receive Money" Claim',
      description: 'The QR or note claims to credit money. Scanning a QR ALWAYS sends money out!',
      severity: 'HIGH',
      weight: 50,
    });
  }

  if (lower.includes('pin') || lower.includes('mpin')) {
    score += 50;
    indicators.push({
      id: 'PIN_HARVESTING',
      title: 'UPI PIN Requested',
      description: 'Never enter your UPI PIN to receive money.',
      severity: 'HIGH',
      weight: 50,
    });
  }

  if (payeeName && (payeeName.toLowerCase().includes('bank') || payeeName.toLowerCase().includes('electricity')) && !payeeVpa.includes('official')) {
    score += 45;
    indicators.push({
      id: 'IMPERSONATION_MISMATCH',
      title: 'Institutional Impersonation',
      description: `Payee claims to be '${payeeName}' but uses personal VPA '${payeeVpa}'.`,
      severity: 'HIGH',
      weight: 45,
    });
  }

  score = Math.min(100, score);
  const level = score >= 65 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return {
    scanType: 'QR',
    riskLevel: level,
    riskScore: score,
    payeeVpa,
    payeeName,
    amount,
    transactionNote: note,
    indicators,
    recommendations: [
      'Never enter your UPI PIN to receive payments.',
      'Always verify recipient name on banking screen.',
    ],
    explanation: level === 'HIGH' ? 'HIGH RISK: Suspicious QR code attempting to extract payment under false pretenses.' : 'LOW RISK: Standard QR structure.',
    voiceWarning: {
      english: level === 'HIGH' ? 'Warning! High risk QR code detected. Do not enter your UPI PIN.' : 'Analysis complete. Low risk detected.',
      hindi: level === 'HIGH' ? 'चेतावनी! उच्च जोखिम वाला क्यूआर कोड पाया गया है। अपना पिन न डालें।' : 'जांच पूरी हुई। कोई धोखाधड़ी नहीं मिली।',
      marathi: level === 'HIGH' ? 'सावधान! फसवणुकीचा धोका आढळला आहे. यूपीआय पिन टाकू नका.' : 'तपासणी पूर्ण झाली. कोणताही धोका नाही.',
    },
  };
}

function fallbackAnalyzeMessage(message, senderId) {
  let score = 0;
  const indicators = [];
  const lower = (message || '').toLowerCase();

  if (lower.includes('pin to receive') || lower.includes('enter upi pin') || lower.includes('enter pin to')) {
    score += 50;
    indicators.push({
      id: 'UPI_PIN_SCAM',
      title: 'UPI PIN Requested to Receive Money',
      description: 'Entering your UPI PIN ALWAYS transfers money out of your account!',
      severity: 'HIGH',
      weight: 50,
    });
  }

  if (lower.includes('electricity') && (lower.includes('disconnected') || lower.includes('tonight'))) {
    score += 45;
    indicators.push({
      id: 'ELECTRICITY_SCAM',
      title: 'Fake Electricity Disconnection Scam',
      description: 'Classic fraud message threatening power cutoff tonight.',
      severity: 'HIGH',
      weight: 45,
    });
  }

  if (lower.includes('share otp') || lower.includes('anydesk') || lower.includes('quicksupport')) {
    score += 45;
    indicators.push({
      id: 'CREDENTIAL_THEFT',
      title: 'OTP or Remote Access Theft',
      description: 'Requests confidential OTP or remote control application.',
      severity: 'HIGH',
      weight: 45,
    });
  }

  score = Math.min(100, score);
  const level = score >= 65 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return {
    scanType: 'MESSAGE',
    riskLevel: level,
    riskScore: score,
    indicators,
    recommendations: [
      'Do not click links or call numbers provided.',
      'Never enter your UPI PIN to receive refunds.',
    ],
    explanation: level === 'HIGH' ? 'HIGH RISK: Common scam tactics detected in this message.' : 'LOW RISK: No blatant scam indicators.',
    voiceWarning: {
      english: level === 'HIGH' ? 'Alert! High risk fraud message detected. Never enter your UPI PIN to receive money.' : 'Analysis complete. Low risk message.',
      hindi: level === 'HIGH' ? 'सावधान! धोखाधड़ी वाला संदेश पाया गया है। पैसे प्राप्त करने के लिए कभी भी पिन न डालें।' : 'जांच पूरी हुई। संदेश सुरक्षित है।',
      marathi: level === 'HIGH' ? 'धोका! संशयास्पद संदेश आढळला आहे. पैसे मिळवण्यासाठी कधीही पिन देऊ नका.' : 'तपासणी पूर्ण झाली.',
    },
  };
}

function fallbackAnalyzeLink(url) {
  let score = 0;
  const indicators = [];
  const lower = (url || '').toLowerCase();

  if (lower.includes('.top') || lower.includes('.xyz') || lower.includes('.club')) {
    score += 35;
    indicators.push({
      id: 'SUSPICIOUS_TLD',
      title: 'Suspicious Domain Extension',
      description: 'Uses inexpensive domain extension commonly used by scam sites.',
      severity: 'MEDIUM',
      weight: 35,
    });
  }

  if ((lower.includes('sbi') || lower.includes('hdfc') || lower.includes('paytm')) && !lower.includes('sbi.co.in') && !lower.includes('hdfcbank.com') && !lower.includes('paytm.com')) {
    score += 50;
    indicators.push({
      id: 'BRAND_IMPERSONATION',
      title: 'Brand Impersonation / Fake Domain',
      description: 'The domain mimics a financial institution but is not an authorized official portal.',
      severity: 'HIGH',
      weight: 50,
    });
  }

  score = Math.min(100, score);
  const level = score >= 65 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return {
    scanType: 'LINK',
    riskLevel: level,
    riskScore: score,
    targetUrl: url,
    indicators,
    recommendations: [
      'Do not visit this webpage or input bank credentials.',
      'Always access your bank via their verified official website or mobile app.',
    ],
    explanation: level === 'HIGH' ? 'HIGH RISK: Phishing URL detected mimicking official institutions.' : 'LOW RISK: URL does not trigger known fraud heuristics.',
    voiceWarning: {
      english: level === 'HIGH' ? 'Danger! Phishing link detected. Do not click or enter bank details.' : 'Analysis complete. Low risk URL.',
      hindi: level === 'HIGH' ? 'खतरा! फर्जी वेबसाइट का लिंक पाया गया है। इस लिंक पर न जाएं।' : 'जांच पूरी हुई। लिंक सुरक्षित लगता है।',
      marathi: level === 'HIGH' ? 'सावधान! संशयास्पद लिंक आढळली आहे. माहिती भरू नका.' : 'तपासणी पूर्ण झाली.',
    },
  };
}
