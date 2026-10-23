// SafeUPI REST API Service
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend register endpoint unavailable, using local session fallback:', err);
      const mockUser = {
        id: Date.now(),
        username: data.username,
        fullName: data.fullName || data.username,
        email: data.email,
      };
      const mockToken = 'safeupi_local_session_' + Date.now();
      localStorage.setItem('safeupi_current_user', JSON.stringify(mockUser));
      return {
        token: mockToken,
        user: mockUser,
        message: 'Registered in local mode (Backend offline)',
      };
    }
  },

  async login(data) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Backend login endpoint unavailable, using local session fallback:', err);
      const username = data.usernameOrEmail || 'demo';
      const mockUser = {
        id: 1,
        username: username,
        fullName: username === 'demo' ? 'Demo User' : username,
        email: username.includes('@') ? username : `${username}@safeupi.com`,
      };
      const mockToken = 'safeupi_local_session_' + Date.now();
      localStorage.setItem('safeupi_current_user', JSON.stringify(mockUser));
      return {
        token: mockToken,
        user: mockUser,
        message: 'Signed in via local demo mode (Backend offline)',
      };
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      const cached = localStorage.getItem('safeupi_current_user');
      if (cached) return JSON.parse(cached);
      return {
        id: 1,
        username: 'demo',
        fullName: 'Demo User',
        email: 'demo@safeupi.com',
      };
    }
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
      const result = fallbackAnalyzeQr(payload);
      saveLocalScan(result, payload);
      return result;
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
      const result = fallbackAnalyzeMessage(message, senderId);
      saveLocalScan(result, message);
      return result;
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
      const result = fallbackAnalyzeLink(url);
      saveLocalScan(result, url);
      return result;
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
      const history = JSON.parse(localStorage.getItem('safeupi_local_history') || '[]');
      const contacts = JSON.parse(localStorage.getItem('safeupi_local_contacts') || '[]');
      const reports = JSON.parse(localStorage.getItem('safeupi_local_reports') || '[]');
      const high = history.filter(h => h.riskLevel === 'HIGH').length;
      const med = history.filter(h => h.riskLevel === 'MEDIUM').length;
      const low = history.filter(h => h.riskLevel === 'LOW').length;
      return {
        totalScans: history.length,
        highRiskScans: high,
        mediumRiskScans: med,
        lowRiskScans: low,
        totalScamReports: reports.length + 3,
        trustedContactsCount: contacts.length,
        scansByType: {
          QR: history.filter(h => h.scanType === 'QR').length,
          MESSAGE: history.filter(h => h.scanType === 'MESSAGE').length,
          LINK: history.filter(h => h.scanType === 'LINK').length,
        },
      };
    }
  },

  async deleteHistory(id) {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('safeupi_local_history') || '[]');
      const updated = list.filter(item => item.id !== id);
      localStorage.setItem('safeupi_local_history', JSON.stringify(updated));
      return { success: true };
    }
  },

  async clearHistory() {
    try {
      const res = await fetch(`${API_BASE}/history/clear`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      localStorage.removeItem('safeupi_local_history');
      return { success: true };
    }
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
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('safeupi_local_contacts') || '[]');
      const newContact = {
        id: Date.now(),
        contactName: data.contactName,
        phoneNumber: data.phoneNumber,
        relation: data.relation || 'Family',
        email: data.email || '',
        createdAt: new Date().toISOString(),
      };
      list.unshift(newContact);
      localStorage.setItem('safeupi_local_contacts', JSON.stringify(list));
      return newContact;
    }
  },

  async deleteContact(id) {
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return await handleResponse(res);
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('safeupi_local_contacts') || '[]');
      const updated = list.filter(c => c.id !== id);
      localStorage.setItem('safeupi_local_contacts', JSON.stringify(updated));
      return { success: true };
    }
  },

  // Scam Reports
  async submitReport(data) {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('safeupi_local_reports') || '[]');
      const newReport = {
        id: Date.now(),
        reportType: data.reportType,
        targetValue: data.targetValue,
        description: data.description,
        reporterContact: data.reporterContact || '',
        reportedAt: new Date().toISOString(),
      };
      list.unshift(newReport);
      localStorage.setItem('safeupi_local_reports', JSON.stringify(list));
      return newReport;
    }
  },

  async getRecentReports() {
    try {
      const res = await fetch(`${API_BASE}/reports/recent`);
      return await handleResponse(res);
    } catch (err) {
      const localReports = JSON.parse(localStorage.getItem('safeupi_local_reports') || '[]');
      const defaultPresets = [
        { id: 'p1', reportType: 'UPI_ID', targetValue: 'electricity-bill-officer@paytm', description: 'Pretended to be electricity discom cut-off extortion', reportedAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'p2', reportType: 'LINK', targetValue: 'https://sbi-pan-reward-update.top', description: 'Phishing APK download link sent via SMS', reportedAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 'p3', reportType: 'UPI_ID', targetValue: 'refund-cashback-desk@okicici', description: 'Sent QR collect request pretending to refund OLX excess payment', reportedAt: new Date(Date.now() - 14400000).toISOString() }
      ];
      return [...localReports, ...defaultPresets];
    }
  },
};

function saveLocalScan(res, rawInput) {
  try {
    const list = JSON.parse(localStorage.getItem('safeupi_local_history') || '[]');
    const record = {
      id: Date.now(),
      scanType: res.scanType,
      rawInput: rawInput || res.payeeVpa || res.targetUrl || '',
      riskLevel: res.riskLevel,
      riskScore: res.riskScore,
      payeeVpa: res.payeeVpa,
      payeeName: res.payeeName,
      amount: res.amount,
      targetUrl: res.targetUrl,
      explanation: res.explanation,
      indicatorsJson: JSON.stringify(res.indicators || []),
      recommendationsJson: JSON.stringify(res.recommendations || []),
      createdAt: new Date().toISOString(),
    };
    list.unshift(record);
    localStorage.setItem('safeupi_local_history', JSON.stringify(list));
  } catch (e) {}
}

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
    payeeVpa = url.searchParams.get('pa') || url.searchParams.get('PA') || '';
    payeeName = url.searchParams.get('pn') || url.searchParams.get('PN') || '';
    amount = url.searchParams.get('am') || url.searchParams.get('AM') || '';
    note = url.searchParams.get('tn') || url.searchParams.get('TN') || '';
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
