-- 회원 프로필(member_profiles)에서 고를 수 있는 체류자격·체류 유형 선택지를 넣습니다.
-- 체류자격 이름은 추천 질문의 목록(recommend/FastResultStore.RESIDENCE_STATUSES)과 글자까지 같게 둡니다:
-- 추천 기능이 프로필에 저장된 값을 그대로 쓸 수 있게 하기 위해서입니다.

INSERT INTO visa_types (visa_code, visa_name) VALUES
    ('E-9', '비전문취업(E-9)'),
    ('H-2', '방문취업(H-2)'),
    ('PROFESSIONAL', '전문인력'),
    ('STUDENT', '유학생'),
    ('F-4', '재외동포(F-4)'),
    ('F-5', '영주(F-5)'),
    ('F-6', '결혼이민(F-6)'),
    ('OTHER', '기타');

-- 내국인도 쓰는 서비스라 내국인을 함께 둡니다. 내국인은 체류자격을 저장하지 않습니다.
INSERT INTO residence_types (residence_code, residence_name) VALUES
    ('KOREAN', '내국인'),
    ('FOREIGN_RESIDENT', '등록 외국인(장기체류)'),
    ('FOREIGN_SHORT_TERM', '단기체류 외국인');
