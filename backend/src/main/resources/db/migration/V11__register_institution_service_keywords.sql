-- V11: 기관 키워드 테이블의 환경 차이를 명시적으로 정리한다.
-- 기존 기관·상담 업무·키워드 데이터는 삭제하거나 수정하지 않는다.
-- 이미 존재하는 테이블은 필수 구조가 맞을 때만 유지한다.

-- 아래 프로시저는 이 마이그레이션에서만 사용하는 검사 도구다.
-- 실패 후 남아 있을 수 있는 같은 이름의 검사 도구만 정리한다.
-- 실제 기관·키워드 테이블을 삭제하는 명령은 아니다.
DROP PROCEDURE IF EXISTS fg_v11_register_institution_keywords;

DELIMITER $$

CREATE PROCEDURE fg_v11_register_institution_keywords()
SQL SECURITY INVOKER
BEGIN
    DECLARE found_table INT DEFAULT 0;
    DECLARE matched_items INT DEFAULT 0;
    DECLARE fg_schema_name VARCHAR(64);

    SET fg_schema_name = DATABASE();

    -- 실행할 DB가 선택되지 않은 연결에서는 진행하지 않는다.
    IF fg_schema_name IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: target schema is not selected';
    END IF;

    -- 접속한 DB만 대상으로 검사한다.
    -- 공용 DB 이름을 고정하지 않아 검증 DB에서도 같은 파일을 사용한다.
    SELECT COUNT(*)
      INTO found_table
      FROM information_schema.tables
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords';

    -- 검증 DB처럼 테이블이 없는 환경에서는 정상 구조로 생성한다.
    -- IF NOT EXISTS로 기존 구조의 차이를 숨기지 않는다.
    IF found_table = 0 THEN
        CREATE TABLE institution_service_keywords (
            service_id BIGINT NOT NULL COMMENT '지원 서비스 번호',
            keyword_code VARCHAR(80) NOT NULL COMMENT '상담 키워드 코드',

            -- 같은 서비스에 같은 키워드가 중복 등록되지 않게 한다.
            PRIMARY KEY (service_id, keyword_code),

            -- 실제 존재하는 상담 업무에만 키워드를 연결한다.
            CONSTRAINT fk_institution_service_keywords_service_id
                FOREIGN KEY (service_id)
                REFERENCES institution_services (service_id)
        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_0900_ai_ci;
    END IF;

    -- 기존 테이블이 있더라도 검사 없이 통과시키지 않는다.
    -- 실제 테이블인지, 엔진·문자 정렬이 기대한 값인지 확인한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.tables
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND table_type = 'BASE TABLE'
       AND engine = 'InnoDB'
       AND table_collation = 'utf8mb4_0900_ai_ci';

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword table engine or collation';
    END IF;

    -- 다른 컬럼이 추가된 환경은 별도 확인이 필요하다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.columns
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords';

    IF matched_items <> 2 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: expected exactly two keyword table columns';
    END IF;

    -- 서비스 번호는 부모 서비스 번호와 같은 signed BIGINT여야 한다.
    -- 자동 증가나 기본값이 붙은 다른 구조는 허용하지 않는다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.columns
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND column_name = 'service_id'
       AND ordinal_position = 1
       AND data_type = 'bigint'
       AND LOCATE('unsigned', column_type) = 0
       AND is_nullable = 'NO'
       AND column_default IS NULL
       AND extra = '';

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected service_id definition';
    END IF;

    -- 키워드 코드는 NOT NULL VARCHAR(80), 기본값 없음으로 확인한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.columns
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND column_name = 'keyword_code'
       AND ordinal_position = 2
       AND data_type = 'varchar'
       AND character_maximum_length = 80
       AND collation_name = 'utf8mb4_0900_ai_ci'
       AND is_nullable = 'NO'
       AND column_default IS NULL
       AND extra = '';

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword_code definition';
    END IF;

    -- 복합 기본키의 구성뿐 아니라 순서도 확인한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.key_column_usage
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND constraint_name = 'PRIMARY'
       AND (
            (column_name = 'service_id' AND ordinal_position = 1)
         OR (column_name = 'keyword_code' AND ordinal_position = 2)
       );

    IF matched_items <> 2 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword table primary key';
    END IF;

    -- 현재 기준의 제약은 기본키 하나와 외래키 하나다.
    -- 추가 UNIQUE·CHECK 등으로 의미가 달라진 환경은 중단한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.table_constraints
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords';

    IF matched_items <> 2 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword table constraints';
    END IF;

    -- 외래키 이름은 환경마다 달라도 된다.
    -- 연결되는 서비스 테이블과 컬럼은 같아야 한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.key_column_usage
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND column_name = 'service_id'
       AND ordinal_position = 1
       AND referenced_table_schema = fg_schema_name
       AND referenced_table_name = 'institution_services'
       AND referenced_column_name = 'service_id';

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword table foreign key';
    END IF;

    -- 복합 외래키나 추가 외래키가 없는지도 확인한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.key_column_usage
     WHERE table_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND referenced_table_name IS NOT NULL;

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword foreign key columns';
    END IF;

    -- 부모 삭제·수정에 따라 키워드가 자동 변경되는 구조는
    -- 현재 확인한 공용 DB의 기준과 다르므로 중단한다.
    SELECT COUNT(*)
      INTO matched_items
      FROM information_schema.referential_constraints
     WHERE constraint_schema = fg_schema_name
       AND table_name = 'institution_service_keywords'
       AND referenced_table_name = 'institution_services'
       AND delete_rule IN ('RESTRICT', 'NO ACTION')
       AND update_rule IN ('RESTRICT', 'NO ACTION');

    IF matched_items <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'V11: unexpected keyword foreign key rules';
    END IF;
END$$

DELIMITER ;

-- 모든 확인을 통과해야 Flyway가 V11을 성공으로 기록한다.
CALL fg_v11_register_institution_keywords();

-- 검사 도구만 제거하고 실제 키워드 테이블은 유지한다.
DROP PROCEDURE fg_v11_register_institution_keywords;