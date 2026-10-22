-- SafeUPI Database Schema for MySQL
-- SafeUPI — AI-Powered UPI Scam Detector

CREATE DATABASE IF NOT EXISTS safe_upi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE safe_upi;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Scan History Table
CREATE TABLE IF NOT EXISTS scan_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    scan_type VARCHAR(20) NOT NULL,
    raw_input TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    payee_vpa VARCHAR(150) NULL,
    payee_name VARCHAR(150) NULL,
    amount VARCHAR(50) NULL,
    explanation TEXT NULL,
    indicators_json TEXT NULL,
    recommendations_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scan_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_history_user (user_id),
    INDEX idx_history_type (scan_type),
    INDEX idx_history_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Trusted Contacts Table
CREATE TABLE IF NOT EXISTS trusted_contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relation VARCHAR(50) NULL,
    email VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trusted_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_contact_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Scam Reports Table
CREATE TABLE IF NOT EXISTS scam_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    report_type VARCHAR(30) NOT NULL,
    target_value TEXT NOT NULL,
    description TEXT NOT NULL,
    reporter_contact VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scam_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_report_user (user_id),
    INDEX idx_report_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Scam Indicators Table (Dynamic Rules and Blacklist Database)
CREATE TABLE IF NOT EXISTS scam_indicators (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    indicator_type VARCHAR(30) NOT NULL,
    pattern_value VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    risk_weight INT NOT NULL DEFAULT 40,
    description TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_indicator_type (indicator_type),
    INDEX idx_indicator_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
