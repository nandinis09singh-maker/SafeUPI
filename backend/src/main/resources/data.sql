-- Seed Data for SafeUPI
-- SafeUPI — AI-Powered UPI Scam Detector

-- Seed Indicators
INSERT INTO scam_indicators (indicator_type, pattern_value, category, risk_weight, description, active)
SELECT 'VPA', 'refund-desk-8899@paytm', 'REFUND_FRAUD', 50, 'Fake electricity & courier refund scam VPA', true
WHERE NOT EXISTS (SELECT 1 FROM scam_indicators WHERE pattern_value = 'refund-desk-8899@paytm');

INSERT INTO scam_indicators (indicator_type, pattern_value, category, risk_weight, description, active)
SELECT 'VPA', 'kbc.lottery.winner@okaxis', 'LOTTERY', 50, 'KBC lottery impersonation scam', true
WHERE NOT EXISTS (SELECT 1 FROM scam_indicators WHERE pattern_value = 'kbc.lottery.winner@okaxis');

INSERT INTO scam_indicators (indicator_type, pattern_value, category, risk_weight, description, active)
SELECT 'VPA', 'phonepe.cashback.claim@ybl', 'CASHBACK', 50, 'Deceptive PhonePe reward claim handle', true
WHERE NOT EXISTS (SELECT 1 FROM scam_indicators WHERE pattern_value = 'phonepe.cashback.claim@ybl');

INSERT INTO scam_indicators (indicator_type, pattern_value, category, risk_weight, description, active)
SELECT 'DOMAIN', 'sbi-kyc-pan-update.top', 'PHISHING', 50, 'Fake SBI netbanking phishing portal', true
WHERE NOT EXISTS (SELECT 1 FROM scam_indicators WHERE pattern_value = 'sbi-kyc-pan-update.top');

INSERT INTO scam_indicators (indicator_type, pattern_value, category, risk_weight, description, active)
SELECT 'DOMAIN', 'paytm-cashback-reward.xyz', 'PHISHING', 50, 'Fake reward page stealing UPI credentials', true
WHERE NOT EXISTS (SELECT 1 FROM scam_indicators WHERE pattern_value = 'paytm-cashback-reward.xyz');
