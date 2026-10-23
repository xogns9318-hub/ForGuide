-- 로그인한 회원이 기본·블라인드 이력서를 양식별로 한 개씩 저장
CREATE TABLE member_resumes
(
    resume_id   BIGINT      NOT NULL AUTO_INCREMENT,
    member_id   BIGINT      NOT NULL,

    -- BASIC : 일반 이력서, BLIND: 블라인드 채용 이력서
    resume_type varchar(20) NOT NULL,

    -- 현재 React 화면의 personal, career 등의 입력 데이터를 JSON으로 저장
    resume_data JSON        NOT NULL,

    -- 일반 이력서 증명사진의 서버 저장 경로
    -- 블라인드 이력서 또는 사진을 삭제한 경우에는 NULL
    photo_url   VARCHAR(1000) NULL,

    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (resume_id),

    -- 회원 한 명은 일반 이력서와 블라인드 이력서를 각각 한 개만 유지
    UNIQUE KEY uk_member_resumes_member_type (member_id, resume_type),

    CONSTRAINT fk_member_resumes_member
        FOREIGN KEY (member_id) REFERENCES members (member_id) ON DELETE CASCADE,

    CONSTRAINT chk_member_resumes_type
        CHECK (resume_type IN ('BASIC', 'BLIND'))
)   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;