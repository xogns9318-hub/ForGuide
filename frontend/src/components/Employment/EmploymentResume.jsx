import { useState } from "react";
import Banner from "../Banner/Banner.jsx";
import {
    getResumeDraft,
    getResumeDrafts,
    saveResumeDraft
} from "../../api/resumeApi.js";
import ResumeLoadModal from "./ResumeLoadModal.jsx";
import "../../styles/employment-resume.css";

const EMPTY_ROWS = Array.from({ length: 4 });
const BASIC_SECTIONS = [
    {
        key: "education",
        title: "학력",
        columns:["학교명", "전공분야", "학위", "기간"],
        fields: ["schoolName", "major", "degree", "period"],
    },
    {
        key: "career",
        title: "경력",
        columns: ["근무처", "담당직무", "직위", "기간"],
        fields: ["companyName", "jobDuty", "position", "period"],
    },
    {
        key: "certificates",
        title: "자격증",
        columns: ["자격증명", "등급", "발급기관", "취득일"],
        fields: ["name", "grade", "issuer", "acquiredAt"],
    },
    {
        key: "awards",
        title: "수상내역",
        columns: ["수상명", "등급", "수여기관", "수상일"],
        fields: ["name", "grade", "organization", "awardedAt"],
    },
];

const BLIND_SECTIONS = [
    {
        key: "career",
        title: "경력",
        columns: ["직무 분야", "담당업무", "직위", "기간"],
        fields: ["jobField", "jobDuty", "position", "period"],
    },
    {
        key: "certificates",
        title: "자격증",
        columns: ["자격증명", "등급", "발급기관", "취득일"],
        fields: ["name", "grade", "issuer", "acquiredAt"],
    },
    {
        key: "jobEducation",
        title: "직무 관련 교육",
        columns: ["교육 분야", "교육 과정", "수료 여부", "기간"],
        fields: ["field", "courseName", "completionStatus", "period"],
    },
];

function createEmptyRows(fields) {
    return Array.from(
        { length: 4 },
        () => Object.fromEntries(
            fields.map((field) => [field, ""]),
        ),
    );
}

function createInitialBasicResume() {
    return {
        photoPreviewUrl: "",
        personal: {
            koreanName: "",
            englishName: "",
            birthDate: "",
            phone: "",
            email: "",
            address: "",
        },

        education: createEmptyRows([
            "schoolName",
            "major",
            "degree",
            "period",
        ]),

        career: createEmptyRows([
            "companyName",
            "jobDuty",
            "position",
            "period",
        ]),

        certificates: createEmptyRows([
            "name",
            "grade",
            "issuer",
            "acquiredAt",
        ]),

        awards: createEmptyRows([
            "name",
            "grade",
            "organization",
            "awardedAt",
        ]),
    };
}

function createInitialBlindResume() {
    return {
        personal: {
            receiptNumber: "",
            targetJob: "",
            phone: "",
            email: "",
        },

        career: createEmptyRows([
            "jobField",
            "jobDuty",
            "position",
            "period",
        ]),

        certificates: createEmptyRows([
            "name",
            "grade",
            "issuer",
            "acquiredAt",
        ]),

        jobEducation: createEmptyRows([
            "field",
            "courseName",
            "completionStatus",
            "period",
        ]),
    };
}

// 한 구역은 요구사항에 맞춰 항상 4행의 빈 입력칸으로 보여 준다.
function ResumeTable({ title, columns, fields, rows, onChange, })
{
    return (
        <section className="resume-table-section">
            <h3>{title}</h3>

            <div className="resume-table-header">
                {columns.map((column) => (
                    <span key={column}>{column}</span>
                ))}
            </div>

            {rows.map((row, rowIndex) => (
                <div
                    className="resume-table-row"
                    key={`${title}-${rowIndex}`}
                >
                    {columns.map((column, columnIndex) => {
                        const field = fields[columnIndex];

                        return (
                            <input
                                key={field}
                                type="text"
                                value={row[field]}
                                onChange={(event) => (
                                    onChange(
                                        rowIndex,
                                        field,
                                        event.target.value,
                                    )
                                )}
                                aria-label={
                                    `${title} ${rowIndex + 1}행 ${column}`
                                }
                            />
                        );
                    })}
                </div>
            ))}
        </section>
    );
}

function BasicPersonalInfo({personal, photoPreviewUrl, onChange, onPhotoChange,}) {
    return (
    <section className="resume-personal-section">
        <h3>인적사항</h3>

        <div className="resume-personal-grid">
        <label className="resume-photo-slot">
            <input
                className="resume-photo-input"
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
            />

            <div className="resume-photo-frame">
                {photoPreviewUrl && (
                    <img
                        src={photoPreviewUrl}
                        alt="선택한 사진 미리보기"
                    />

                )}
            </div>

            <span>
                {photoPreviewUrl ? "사진 변경" : "사진 선택"}
            </span>
            <small>3 * 4cm</small>
        </label>

            <div className="resume-personal-fields">
                <label className="resume-name-field">
                    <span>성명</span>

                    <input
                        type="text"
                        placeholder="(한글)"
                        value={personal.koreanName}
                        onChange={(event) => (
                            onChange("koreanName", event.target.value)
                        )}
                    />

                    <input
                        type="text"
                        placeholder="(영문)"
                        value={personal.englishName}
                        onChange={(event) => (
                            onChange("englishName", event.target.value)
                        )}
                    />
                </label>

                <label>
                    <span>생년월일</span>
                    <input
                        type="text"
                        value={personal.birthDate}
                        onChange={(event) => (
                            onChange("birthDate", event.target.value)
                        )}
                    />
                </label>

                <label>
                    <span>연락처</span>
                    <input
                        type="tel"
                        placeholder="휴대전화"
                        value={personal.phone}
                        onChange={(event) => (
                            onChange("phone", event.target.value)
                        )}
                    />
                </label>

                <label>
                    <span>이메일</span>
                    <input
                        type="email"
                        value={personal.email}
                        onChange={(event) => (
                            onChange("email", event.target.value)
                        )}
                    />
                </label>

                <label>
                    <span>주소</span>
                    <input
                        type="text"
                        value={personal.address}
                        onChange={(event) => (
                            onChange("address", event.target.value)
                        )}
                    />
                </label>
            </div>
        </div>
    </section>
    );
}

function BlindPersonalInfo({ personal, onChange }) {
    return (
    <section className="resume-personal-section">
        <h3>지원 정보</h3>

        <div className="resume-blind-fields">
            <label>
                <span>접수번호</span>
                <input
                    type="text"
                    value={personal.receiptNumber}
                    onChange={(event) => (
                        onChange("receiptNumber", event.target.value)
                    )}
                />
            </label>

            <label>
                <span>지원 직무</span>
                <input
                    type="text"
                    value={personal.targetJob}
                    onChange={(event) => (
                        onChange("targetJob", event.target.value)
                    )}
                />
            </label>

            <label>
                <span>연락처</span>
                <input
                    type="tel"
                    placeholder="휴대전화"
                    value={personal.phone}
                    onChange={(event) => (
                        onChange("phone", event.target.value)
                    )}
                />
            </label>

            <label>
                <span>이메일</span>
                <input
                    type="email"
                    value={personal.email}
                    onChange={(event) => (
                        onChange("email", event.target.value)
                    )}
                />
            </label>
        </div>
    </section>
    );
}

// 저장·불러오기·인쇄는 다음 작업에서 연결하고, 여기서는 양식과 탭만 제공한다.
export default function EmploymentResume() {
    const [resumeType, setResumeType] = useState("basic");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    const [savedDrafts, setSavedDrafts] = useState([]);

    // 기본,블라인드 이력서의 입력값을 화면이 열려 있는 동안 보관
    const [basicResume, setBasicResume] = useState(
        createInitialBasicResume,
    );

    const [blindResume, setBlindResume] = useState(
        createInitialBlindResume,
    );

    function handleBasicPersonalChange(field, value) {
        setBasicResume((previousResume) => ({
            ...previousResume,
            personal: {
                ...previousResume.personal,
                [field]: value,
            },
        }));
    }

    function handleBasicPhotoChange(event) {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        // 선택한 사진은 서버 업로드 전까지 브라우저에서만 미리보기로 사용
        const previewUrl = URL.createObjectURL(selectedFile);

        setBasicResume((previousResume) => ({
            ...previousResume,
            photoPreviewUrl: previewUrl,
        }));
    }

    function handleBlindPersonalChange(field, value) {
        setBlindResume((previousResume) => ({
            ...previousResume,
            personal: {
                ...previousResume.personal,
                [field]: value,
            },
        }));
    }

    const isBlind = resumeType === "blind";
    const sections = isBlind ? BLIND_SECTIONS : BASIC_SECTIONS;
    const activeResume = isBlind ? blindResume : basicResume;

    function handleTableChange(sectionKey, rowIndex, field, value) {
        const setResume = isBlind ? setBlindResume : setBasicResume;

        setResume((previousResume) => ({
            ...previousResume,
            [sectionKey]: previousResume[sectionKey].map(
                (row, currentRowIndex) => (
                    currentRowIndex === rowIndex
                        ? {...row, [field]: value}
                        : row
                ),
            ),
        }));
    }

    async function handleSave() {
        setIsSaving(true);
        setSaveMessage("");

        try{
            await saveResumeDraft({
                resumeType,
                resume: activeResume,
            });

            const resumeName = isBlind
                ? "블라인드 채용 이력서"
                : "기본 이력서";

            setSaveMessage(`${resumeName}를 저장했습니다.`);
        } catch {
            setSaveMessage("저장하지 못했습니다. 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleOpenLibrary() {
        setIsLibraryOpen(true);
        setIsLoadingDrafts(true);
        setSaveMessage("");

        try {
            const drafts = await getResumeDrafts();

            setSavedDrafts(drafts);
        } catch {
            setIsLibraryOpen(false);
            setSaveMessage(
                "저장한 이력서 목록을 불러오지 못했습니다.",
            );
        } finally {
            setIsLoadingDrafts(false);
        }
    }

    async function handleSelectDraft(draftId) {
        setIsLoadingDrafts(true);

        try {
            const selectedDraft = await getResumeDraft(draftId);

            if(!selectedDraft) {
                throw new Error("저장한 이력서를 찾을 수 없습니다.");
            }

            if(selectedDraft.resumeType === "blind") {
                setBlindResume(selectedDraft.resume);
                setResumeType("blind");
            } else {
                setBasicResume(selectedDraft.resume);
                setResumeType("basic");
            }

            setIsLibraryOpen(false);
            setSaveMessage("저장한 이력서를 불러왔습니다.");
        } catch {
            setSaveMessage(
                "저장한 이력서를 불러오지 못했습니다.",
            );
        } finally {
            setIsLoadingDrafts(false);
        }
    }

    function handlePrint() {
        // 현재 화면에 선택된 이력서 양식만 A4 인쇄 미리보기로 보낸다.
        window.print();
    }

    return <div className="page-stack employment-resume-page">
        <Banner title="취업 준비자료" description="지원 방식에 맞는 A4 이력서를 작성하고 저장하거나 출력하세요." />
        <div className="employment-resume-tabs" role="tablist" aria-label="이력서 양식 선택">
            <button type="button" role="tab"
                    aria-selected={!isBlind} className={!isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("basic")}>기본 이력서
            </button>
            <button type="button" role="tab"
                    aria-selected={isBlind} className={isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("blind")}>블라인드 채용 이력서
            </button>
        </div>{isBlind && <p className="employment-blind-notice">사진·이름·생년월일 등 신원 정보는 작성하지 않습니다.</p>}
        <article className="employment-resume-sheet" role="tabpanel">
            <header className="employment-resume-sheet-title">
                <h2>{isBlind ? "블라인드 채용 이력서" : "이력서"}</h2>
                <span>예시 데이터</span>
            </header>{isBlind ? (
                <BlindPersonalInfo
                    personal={blindResume.personal}
                    onChange={handleBlindPersonalChange}
                />
        ) : (
            <BasicPersonalInfo
                personal={basicResume.personal}
                photoPreviewUrl={basicResume.photoPreviewUrl}
                onChange={handleBasicPersonalChange}
                onPhotoChange={handleBasicPhotoChange}
            />
        )}

            {sections.map(({ key, title, columns, fields }) => (
                <ResumeTable
                    key={key}
                    title={title}
                    columns={columns}
                    fields={fields}
                    rows={activeResume[key]}
                    onChange={(rowIndex, field, value) => (
                        handleTableChange(key, rowIndex, field, value)
                    )}
                />
            ))}
        </article>
        <div className="employment-resume-actions">
            <div>
                <button
                    type="button"
                    className="button button-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                    type="button"
                    className="button"
                    onClick={handleOpenLibrary}
                >
                    불러오기
                </button>
                <button
                    type="button"
                    className="button"
                    onClick={handlePrint}
                >
                    인쇄/출력
                </button>
            </div>
            <button type="button" className="button">한국어로 변환</button>
        </div>

        <ResumeLoadModal
            isOpen={isLibraryOpen}
            drafts={savedDrafts}
            isLoading={isLoadingDrafts}
            onClose={() => setIsLibraryOpen(false)}
            onSelect={handleSelectDraft}
        />
        {saveMessage && (
            <p className="employment-resume-save-message">
                {saveMessage}
            </p>
        )}
    </div>;

}
