CREATE TABLE IF NOT EXISTS recommendation_usage_logs (
    usage_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_type VARCHAR(20) NOT NULL,
    outcome_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
