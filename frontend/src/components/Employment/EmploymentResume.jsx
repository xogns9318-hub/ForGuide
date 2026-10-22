import { useState } from "react";
import Banner from "../Banner/Banner.jsx";
import "../../styles/employment-resume.css";

const EMPTY_ROWS = Array.from({ length: 4 });

const BASIC_SECTIONS = [
    {
        title: "학력",
        columns: ["학교명", "전공분야", "학위", "기간"],
    },
    {
        title: "경력",
        columns: ["근무처", "담당직무", "직위", "기간"],
    },
    {
        title: "자격증",
        columns: ["자격증명", "등급", "발급기관", "취득일"],
    },
    {
        title: "수상내역",
        columns: ["수상명", "등급", "수여기관", "수상일"],
    },
];

const BLIND_SECTIONS = [
    {
        title: "경력",
        columns: ["직무 분야", "담당업무", "직위", "기간"],
    },
    {
        title: "자격증",
        columns: ["자격증명", "등급", "발급기관", "취득일"],
    },
    {
        title: "직무 관련 교육",
        columns: ["교육 분야", "교육 과정", "수료 여부", "기간"],
    },
];

// 최대 4행으로 고정된 이력서 표의 입력 칸만 만든다.
// 입력값 상태·저장 API 연결은 다음 작업에서 추가한다.
function ResumeTableSection({ title, columns }) {
    return (
        <section className="resume-table-section">
            <h3>{title}</h3>
            <div className="resume-table resume-table-four-columns">
                <div className="resume-table-header">
                    {columns.map((column) => (
                        <span key={column}>{column}</span>
                    ))}
                </div>

                {EMPTY_ROWS.map((_, rowIndex) => (
                    <div className="resume-table-row" key={`${title}-${rowIndex}`}>
                        {columns.map((column) => (
                            <input
                                key={column}
                                type="text"
                                aria-label={`${title} ${rowIndex + 1}행 ${column}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}

function BasicPersonalInfo() {
    return (
        <section className="resume-personal-section">
            <h3>인적사항</h3>
            <div className="resume-personal-grid">
                <div className="resume-photo-slot" aria-label="증명사진 영역">
                    <div className="resume-photo-frame" aria-hidden="true" />
                    <span>사진</span>
                    <small>3 × 4cm</small>
                </div>

                <div className="resume-personal-fields">
                    <label>
                        <span>성명</span>
                        <input type="text" placeholder="(한글)" aria-label="성명 한글" />
                        <input type="text" placeholder="(영문)" aria-label="성명 영문" />
                    </label>
                    <label>
                        <span>생년월일</span>
                        <input type="text" aria-label="생년월일" />
                    </label>
                    <label>
                        <span>연락처</span>
                        <input type="tel" placeholder="휴대전화" aria-label="휴대전화" />
                        <input type="tel" placeholder="비상 연락처" aria-label="비상 연락처" />
                    </label>
                    <label>
                        <span>이메일</span>
                        <input type="email" aria-label="이메일" />
                    </label>
                    <label>
                        <span>주소</span>
                        <input type="text" aria-label="주소" />
                    </label>
                </div>
            </div>
        </section>
    );
}

function BlindPersonalInfo() {
    return (
        <section className="resume-personal-section">
            <h3>지원 정보</h3>
            <div className="resume-blind-fields">
                <label>
                    <span>접수번호</span>
                    <input type="text" aria-label="접수번호" />
                </label>
                <label>
                    <span>지원 직무</span>
                    <input type="text" aria-label="지원 직무" />
                </label>
                <label>
                    <span>연락처</span>
                    <input type="tel" placeholder="휴대전화" aria-label="휴대전화" />
                </label>
                <label>
                    <span>이메일</span>
                    <input type="email" aria-label="이메일" />
                </label>
            </div>
        </section>
    );
}

// 저장·불러오기·인쇄 기능을 붙이기 전, 두 이력서 양식과 탭만 제공하는 화면이다.
export default function EmploymentResume() {
    const [resumeType, setResumeType] = useState("basic");
    const isBlind = resumeType === "blind";

    return (
        <div className="page-stack employment-resume-page">
            <Banner
                title="취업 준비자료"
                description="지원 방식에 맞는 A4 이력서를 작성하고 저장하거나 출력하세요."
            />

            <div
                className="employment-resume-tabs"
                role="tablist"
                aria-label="이력서 양식 선택"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={!isBlind}
                    className={!isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("basic")}
                >
                    기본 이력서
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={isBlind}
                    className={isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("blind")}
                >
                    블라인드 채용 이력서
                </button>
            </div>

            {isBlind && (
                <p className="employment-blind-notice">
                    블라인드 채용 이력서에는 사진·이름·생년월일 등 신원 정보가 포함되지 않습니다.
                </p>
            )}

            <article
                className="employment-resume-sheet"
                role="tabpanel"
                aria-label={isBlind ? "블라인드 채용 이력서" : "기본 이력서"}
            >
                <header className="employment-resume-sheet-title">
                    <h2>{isBlind ? "블라인드 채용 이력서" : "이력서"}</h2>
                    <span className="employment-example-badge">예시 데이터</span>
                </header>

                {isBlind ? <BlindPersonalInfo /> : <BasicPersonalInfo />}

                {(isBlind ? BLIND_SECTIONS : BASIC_SECTIONS).map((section) => (
                    <ResumeTableSection key={section.title} {...section} />
                ))}
            </article>

            {/* 다음 작업: mock 저장·불러오기와 window.print 연결 */}
            <div className="employment-resume-actions" aria-label="이력서 기능">
                <div>
                    <button type="button" className="button button-primary">저장</button>
                    <button type="button" className="button">불러오기</button>
                    <button type="button" className="button">인쇄/출력</button>
                </div>
                <button type="button" className="button">한국어로 변환</button>
            </div>
        </div>
    );
}
