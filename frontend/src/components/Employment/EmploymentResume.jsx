import { useState, useEffect } from "react";
import {
    deleteResumePhoto,
    getResumeDraft,
    getResumeDrafts,
    getResumePhotoPreviewUrl,
    saveResumeDraft,
    translateResumeText,
} from "../../api/resumeApi.js";
import { useTranslation } from "react-i18next";
import ResumeLoadModal from "./ResumeLoadModal.jsx";
import ResumeTranslationModal from "./ResumeTranslationModal.jsx";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import {
    readResumeTemporaryDraft,
    readResumeTemporaryPhoto,
    writeResumeTemporaryDraft,
    writeResumeTemporaryPhoto,
    clearResumeTemporaryPhoto,
} from "../../utils/resumeDraftStorage.js";
import "../../styles/employment-resume.css";

const EMPTY_ROWS = Array.from({ length: 4 });

const TRANSLATABLE_TABLE_FIELDS = new Set([
    "major",
    "jobDuty",
    "position",
    "jobField",
    "field",
    "courseName",
    "completionStatus",
]);

const BASIC_SECTIONS = [
    {
        key: "education",
        titleKey: "education",
        columnKeys: ["schoolName", "major", "degree", "period"],
        fields: ["schoolName", "major", "degree", "period"],
    },
    {
        key: "career",
        titleKey: "career",
        columnKeys: ["companyName", "jobDuty", "position", "period"],
        fields: ["companyName", "jobDuty", "position", "period"],
    },
    {
        key: "certificates",
        titleKey: "certificates",
        columnKeys: ["certificateName", "grade", "issuer", "acquiredAt"],
        fields: ["name", "grade", "issuer", "acquiredAt"],
    },
    {
        key: "awards",
        titleKey: "awards",
        columnKeys: ["awardName", "grade", "organization", "awardedAt"],
        fields: ["name", "grade", "organization", "awardedAt"],
    },
];

const BLIND_SECTIONS = [
    {
        key: "career",
        titleKey: "career",
        columnKeys: ["jobField", "jobDuty", "position", "period"],
        fields: ["jobField", "jobDuty", "position", "period"],
    },
    {
        key: "certificates",
        titleKey: "certificates",
        columnKeys: ["certificateName", "grade", "issuer", "acquiredAt"],
        fields: ["name", "grade", "issuer", "acquiredAt"],
    },
    {
        key: "jobEducation",
        titleKey: "jobEducation",
        columnKeys: ["field", "courseName", "completionStatus", "period"],
        fields: ["field", "courseName", "completionStatus", "period"],
    },
];

function createEmptyRows(fields) {
    return Array.from({ length: 4 }, () => Object.fromEntries(fields.map((field) => [field, ""])));
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

        education: createEmptyRows(["schoolName", "major", "degree", "period"]),

        career: createEmptyRows(["companyName", "jobDuty", "position", "period"]),

        certificates: createEmptyRows(["name", "grade", "issuer", "acquiredAt"]),

        awards: createEmptyRows(["name", "grade", "organization", "awardedAt"]),
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

        career: createEmptyRows(["jobField", "jobDuty", "position", "period"]),

        certificates: createEmptyRows(["name", "grade", "issuer", "acquiredAt"]),

        jobEducation: createEmptyRows(["field", "courseName", "completionStatus", "period"]),
    };
}

// 한 구역은 요구사항에 맞춰 항상 4행의 빈 입력칸으로 보여 준다.
function ResumeTable({ title, columns, fields, rows, onChange }) {
    const { t } = useTranslation();

    return (
        <section className="resume-table-section">
            <h3>{title}</h3>

            <div className="resume-table-header">
                {columns.map((column) => (
                    <span key={column}>{column}</span>
                ))}
            </div>

            {rows.map((row, rowIndex) => (
                <div className="resume-table-row" key={`${title}-${rowIndex}`}>
                    {columns.map((column, columnIndex) => {
                        const field = fields[columnIndex];

                        return (
                            <div className="resume-table-cell" key={field}>
                                <input
                                    type="text"
                                    value={row[field]}
                                    onChange={(event) =>
                                        onChange(rowIndex, field, event.target.value)
                                    }
                                    aria-label={t("resume.table.cellAria", {
                                        title,
                                        row: rowIndex + 1,
                                        column,
                                    })}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
        </section>
    );
}

function BasicPersonalInfo({
    personal,
    photoPreviewUrl,
    isRemovingPhoto,
    onChange,
    onPhotoChange,
    onPhotoRemove,
}) {
    const { t } = useTranslation();
    return (
        <section className="resume-personal-section">
            <h3>{t("resume.personal.basicTitle")}</h3>

            <div className="resume-personal-grid">
                <div className="resume-photo-control">
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
                                    alt={t("resume.personal.photoPreviewAlt")}
                                />
                            )}
                        </div>

                        {!photoPreviewUrl && <span>{t("resume.personal.selectPhoto")}</span>}
                        <small>3 * 4cm</small>
                    </label>

                    {photoPreviewUrl && (
                        <button
                            type="button"
                            className="button resume-photo-delete"
                            onClick={onPhotoRemove}
                            disabled={isRemovingPhoto}
                        >
                            {isRemovingPhoto
                                ? t("resume.personal.removingPhoto")
                                : t("resume.personal.removePhoto")}
                        </button>
                    )}
                </div>

                <div className="resume-personal-fields">
                    <label className="resume-name-field">
                        <span>{t("resume.personal.name")}</span>

                        <input
                            type="text"
                            placeholder={t("resume.personal.koreanNamePlaceholder")}
                            value={personal.koreanName}
                            onChange={(event) => onChange("koreanName", event.target.value)}
                        />

                        <input
                            type="text"
                            placeholder={t("resume.personal.englishNamePlaceholder")}
                            value={personal.englishName}
                            onChange={(event) => onChange("englishName", event.target.value)}
                        />
                    </label>

                    <label>
                        <span>{t("resume.personal.birthDate")}</span>
                        <input
                            type="text"
                            value={personal.birthDate}
                            onChange={(event) => onChange("birthDate", event.target.value)}
                        />
                    </label>

                    <label>
                        <span>{t("resume.personal.phone")}</span>
                        <input
                            type="tel"
                            placeholder={t("resume.personal.phonePlaceholder")}
                            value={personal.phone}
                            onChange={(event) => onChange("phone", event.target.value)}
                        />
                    </label>

                    <label>
                        <span>{t("resume.personal.email")}</span>
                        <input
                            type="email"
                            value={personal.email}
                            onChange={(event) => onChange("email", event.target.value)}
                        />
                    </label>

                    <label>
                        <span>{t("resume.personal.address")}</span>
                        <input
                            type="text"
                            value={personal.address}
                            onChange={(event) => onChange("address", event.target.value)}
                        />
                    </label>
                </div>
            </div>
        </section>
    );
}

function BlindPersonalInfo({ personal, onChange }) {
    const { t } = useTranslation();

    return (
        <section className="resume-personal-section">
            <h3>{t("resume.personal.blindTitle")}</h3>

            <div className="resume-blind-fields">
                <label>
                    <span>{t("resume.personal.receiptNumber")}</span>
                    <input
                        type="text"
                        value={personal.receiptNumber}
                        onChange={(event) => onChange("receiptNumber", event.target.value)}
                    />
                </label>

                <label>
                    <span>{t("resume.personal.targetJob")}</span>
                    <input
                        type="text"
                        value={personal.targetJob}
                        onChange={(event) => onChange("targetJob", event.target.value)}
                    />
                </label>

                <label>
                    <span>{t("resume.personal.phone")}</span>
                    <input
                        type="tel"
                        placeholder={t("resume.personal.phonePlaceholder")}
                        value={personal.phone}
                        onChange={(event) => onChange("phone", event.target.value)}
                    />
                </label>

                <label>
                    <span>{t("resume.personal.email")}</span>
                    <input
                        type="email"
                        value={personal.email}
                        onChange={(event) => onChange("email", event.target.value)}
                    />
                </label>
            </div>
        </section>
    );
}

// 저장·불러오기·인쇄는 다음 작업에서 연결하고, 여기서는 양식과 탭만 제공한다.
export default function EmploymentResume() {
    const { t } = useTranslation();
    const memberId = useAuthStore((state) => state.member?.memberId);

    const [resumeType, setResumeType] = useState("basic");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    const [savedDrafts, setSavedDrafts] = useState([]);
    const [basicPhotoFile, setBasicPhotoFile] = useState(null);
    const [basicResumeId, setBasicResumeId] = useState(null);
    const [basicPhotoUrl, setBasicPhotoUrl] = useState(null);
    const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
    const [hasTemporaryBasicPhoto, setHasTemporaryBasicPhoto] = useState(false);
    const [translationTarget, setTranslationTarget] = useState(null);
    const [translationDraft, setTranslationDraft] = useState("");
    const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState("");
    const [translationQueue, setTranslationQueue] = useState([]);
    const [translationQueueIndex, setTranslationQueueIndex] = useState(0);

    // 기본,블라인드 이력서의 입력값을 화면이 열려 있는 동안 보관
    const [basicResume, setBasicResume] = useState(createInitialBasicResume);

    const [blindResume, setBlindResume] = useState(createInitialBlindResume);

    const [restoredMemberId, setRestoredMemberId] = useState(null);

    // 로그인한 회원의 작성 중 이력서와 마지막 선택 탭을 복원
    useEffect(() => {
        if (!memberId) {
            return;
        }

        setRestoredMemberId(null);

        const savedDraft = readResumeTemporaryDraft(memberId);

        if (savedDraft?.basicResume) {
            setBasicResume({
                ...savedDraft.basicResume,
                // 브라우저 임시 사진 주소는 새로고침 뒤 사용할 수 없다.
                photoPreviewUrl: "",
            });
        }

        if (savedDraft?.blindResume) {
            setBlindResume(savedDraft.blindResume);
        }

        setBasicResumeId(savedDraft?.basicResumeId ?? null);
        setBasicPhotoUrl(savedDraft?.basicPhotoUrl ?? null);
        setHasTemporaryBasicPhoto(Boolean(savedDraft?.hasTemporaryBasicPhoto));

        setResumeType(savedDraft?.resumeType === "blind" ? "blind" : "basic");
        setBasicPhotoFile(null);
        setRestoredMemberId(memberId);
    }, [memberId]);

    // 입력값이 바뀔 때마다 회원별 브라우저 저장소에 임시 저장
    useEffect(() => {
        if (!memberId || restoredMemberId !== memberId) {
            return;
        }

        // blol: 미리보기 주소는 새로고침 뒤 무효라 저장하지 않음.
        const { photoPreviewUrl, ...basicResumeWithoutPreview } = basicResume;

        const draftToSave = {
            resumeType,
            basicResume: basicResumeWithoutPreview,
            blindResume,
            // 서버에 저장된 사진을 새로고침 뒤 다시 조회하기 위한 식별값
            basicResumeId,
            basicPhotoUrl,
            hasTemporaryBasicPhoto,
        };

        writeResumeTemporaryDraft(memberId, draftToSave);
    }, [
        memberId,
        restoredMemberId,
        resumeType,
        basicResume,
        blindResume,
        basicResumeId,
        basicPhotoUrl,
        hasTemporaryBasicPhoto,
    ]);

    // 저장 전 선택한 사진도 새로고침 뒤 IndexedDB에서 복원한다.
    useEffect(() => {
        if (
            !memberId ||
            restoredMemberId !== memberId ||
            !hasTemporaryBasicPhoto ||
            basicPhotoFile
        ) {
            return;
        }

        let isCurrent = true;

        readResumeTemporaryPhoto(memberId)
            .then((photoFile) => {
                if (!isCurrent) {
                    return;
                }

                if (!photoFile) {
                    setHasTemporaryBasicPhoto(false);
                    return;
                }

                setBasicPhotoFile(photoFile);
                setBasicResume((previousResume) => ({
                    ...previousResume,
                    photoPreviewUrl: URL.createObjectURL(photoFile),
                }));
            })
            .catch(() => {
                if (isCurrent) {
                    setHasTemporaryBasicPhoto(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [memberId, restoredMemberId, hasTemporaryBasicPhoto, basicPhotoFile]);

    // 저장된 사진은 보호 API를 통해서만 다시 미리보기 주소로 바꾼다.
    useEffect(() => {
        if (
            !memberId ||
            restoredMemberId !== memberId ||
            !basicResumeId ||
            !basicPhotoUrl ||
            basicPhotoFile ||
            basicResume.photoPreviewUrl ||
            hasTemporaryBasicPhoto
        ) {
            return;
        }

        let isCurrent = true;

        getResumePhotoPreviewUrl(basicResumeId)
            .then((photoPreviewUrl) => {
                if (!isCurrent) {
                    return;
                }

                setBasicResume((previousResume) => ({
                    ...previousResume,
                    photoPreviewUrl,
                }));
            })
            .catch(() => {
                // 사진 복원에 실패해도 이력서 텍스트 임시본은 유지한다.
            });

        return () => {
            isCurrent = false;
        };
    }, [
        memberId,
        restoredMemberId,
        basicResumeId,
        basicPhotoUrl,
        basicPhotoFile,
        basicResume.photoPreviewUrl,
        hasTemporaryBasicPhoto,
    ]);

    function handleBasicPersonalChange(field, value) {
        setBasicResume((previousResume) => ({
            ...previousResume,
            personal: {
                ...previousResume.personal,
                [field]: value,
            },
        }));
    }

    async function handleBasicPhotoChange(event) {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        // 선택 직후에는 즉시 미리보기를 보여 준다.
        const previewUrl = URL.createObjectURL(selectedFile);

        setBasicPhotoFile(selectedFile);
        setBasicResume((previousResume) => ({
            ...previousResume,
            photoPreviewUrl: previewUrl,
        }));

        try {
            // 저장 전 사진도 새로고침 뒤 복원할 수 있도록 브라우저 DB에 보관한다.
            await writeResumeTemporaryPhoto(memberId, selectedFile);
            setHasTemporaryBasicPhoto(true);
        } catch {
            setSaveMessage(t("resume.messages.temporaryPhotoSaveFailed"));
        }
    }

    async function handleBasicPhotoRemove() {
        const previousPhotoPreviewUrl = basicResume.photoPreviewUrl;
        const previousPhotoFile = basicPhotoFile;
        const previousPhotoUrl = basicPhotoUrl;
        const previousHasTemporaryPhoto = hasTemporaryBasicPhoto;

        // 클릭 즉시 화면에서는 사진을 제거한다.
        setBasicResume((previousResume) => ({
            ...previousResume,
            photoPreviewUrl: "",
        }));
        setBasicPhotoFile(null);
        setIsRemovingPhoto(true);
        setSaveMessage("");

        try {
            // 서버 사진이 있으면 DB 연결과 서버 파일을 즉시 삭제한다.
            if (basicPhotoUrl && basicResumeId) {
                await deleteResumePhoto(basicResumeId);
            }

            // 저장 전 선택했던 사진도 IndexedDB에서 제거한다.
            await clearResumeTemporaryPhoto(memberId);

            setBasicPhotoUrl(null);
            setHasTemporaryBasicPhoto(false);
            setSaveMessage(t("resume.messages.photoDeleted"));
        } catch {
            // 서버 삭제가 실패한 경우에만 원래 화면 상태로 되돌린다.
            setBasicPhotoUrl(previousPhotoUrl);
            setBasicPhotoFile(previousPhotoFile);
            setHasTemporaryBasicPhoto(previousHasTemporaryPhoto);
            setBasicResume((previousResume) => ({
                ...previousResume,
                photoPreviewUrl: previousPhotoPreviewUrl,
            }));
            setSaveMessage(t("resume.messages.photoDeleteFailed"));
        } finally {
            setIsRemovingPhoto(false);
        }
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
            [sectionKey]: previousResume[sectionKey].map((row, currentRowIndex) =>
                currentRowIndex === rowIndex ? { ...row, [field]: value } : row,
            ),
        }));
    }

    // 현재 양식에서 번역 가능한 서술성 입력값만 순서대로 수집한다.
    function collectTranslationTargets() {
        const targets = [];

        sections.forEach(({ key: sectionKey, fields }) => {
            activeResume[sectionKey].forEach((row, rowIndex) => {
                fields.forEach((field) => {
                    const sourceText = row[field]?.trim();

                    if (TRANSLATABLE_TABLE_FIELDS.has(field) && sourceText) {
                        targets.push({
                            targetKind: "table",
                            resumeType,
                            sectionKey,
                            rowIndex,
                            field,
                            fieldLabel: t(`resume.columns.${field}`),
                            sourceText,
                        });
                    }
                });
            });
        });

        if (isBlind && blindResume.personal.targetJob.trim()) {
            targets.unshift({
                targetKind: "personal",
                resumeType,
                field: "targetJob",
                fieldLabel: t("resume.personal.targetJob"),
                sourceText: blindResume.personal.targetJob.trim(),
            });
        }

        return targets;
    }

    async function requestResumeTranslation(target) {
        setIsTranslating(true);
        setTranslationError("");
        setTranslationDraft("");

        try {
            const response = await translateResumeText(target.sourceText);
            setTranslationDraft(response.translatedText);
        } catch (error) {
            setTranslationError(error?.message || t("resume.translation.failed"));
        } finally {
            setIsTranslating(false);
        }
    }

    function handleStartResumeTranslation() {
        const targets = collectTranslationTargets();

        if (targets.length === 0) {
            setSaveMessage(t("resume.translation.noContent"));
            return;
        }

        const target = targets[0];

        setTranslationQueue(targets);
        setTranslationQueueIndex(0);
        setTranslationTarget(target);
        setTranslationDraft("");
        setTranslationError("");
        setIsTranslationModalOpen(true);

        void requestResumeTranslation(target);
    }

    function handleRetryResumeTranslation() {
        if (!translationTarget) {
            return;
        }

        void requestResumeTranslation(translationTarget);
    }

    function handleApplyResumeTranslation() {
        if (!translationTarget || !translationDraft.trim()) {
            return;
        }

        const setResume =
            translationTarget.resumeType === "blind" ? setBlindResume : setBasicResume;

        if (translationTarget.targetKind === "personal") {
            setResume((previousResume) => ({
                ...previousResume,
                personal: {
                    ...previousResume.personal,
                    [translationTarget.field]: translationDraft.trim(),
                },
            }));
        } else {
            setResume((previousResume) => ({
                ...previousResume,
                [translationTarget.sectionKey]: previousResume[translationTarget.sectionKey].map(
                    (row, currentRowIndex) =>
                        currentRowIndex === translationTarget.rowIndex
                            ? {
                                  ...row,
                                  [translationTarget.field]: translationDraft.trim(),
                              }
                            : row,
                ),
            }));
        }

        const nextIndex = translationQueueIndex + 1;
        const nextTarget = translationQueue[nextIndex];

        if (nextTarget) {
            setTranslationQueueIndex(nextIndex);
            setTranslationTarget(nextTarget);
            void requestResumeTranslation(nextTarget);
            return;
        }

        handleCloseResumeTranslation();
    }

    function handleCloseResumeTranslation() {
        setIsTranslationModalOpen(false);
        setTranslationTarget(null);
        setTranslationDraft("");
        setTranslationError("");
        setTranslationQueue([]);
        setTranslationQueueIndex(0);
    }

    async function handleSave() {
        setIsSaving(true);
        setSaveMessage("");

        try {
            const savedDraft = await saveResumeDraft({
                resumeType,
                resume: activeResume,
                photoFile: isBlind ? null : basicPhotoFile,
            });

            const resumeName = isBlind ? t("resume.page.blindTab") : t("resume.page.basicTab");

            setSaveMessage(t("resume.messages.saved", { resumeName }));

            if (!isBlind) {
                setBasicResumeId(savedDraft.id);
                setBasicPhotoUrl(savedDraft.photoUrl);

                // 서버 저장이 끝났으므로 브라우저의 임시 사진 파일만 정리
                // photoPreviewUrl은 건드리지 않아 현재 사진은 화면에 그대로
                try {
                    await clearResumeTemporaryPhoto(memberId);
                } catch {
                    // 서버 저장은 성공했으므로 IndexedDB 정리 실패만 기록
                    console.warn("임시 사진을 정리하지 못했습니다.");
                }

                setHasTemporaryBasicPhoto(false);
                setBasicPhotoFile(null);
            }
        } catch {
            setSaveMessage(t("resume.messages.saveFailed"));
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
            setSaveMessage(t("resume.messages.libraryLoadFailed"));
        } finally {
            setIsLoadingDrafts(false);
        }
    }

    async function handleSelectDraft(draftId) {
        setIsLoadingDrafts(true);

        try {
            const selectedDraft = await getResumeDraft(draftId);

            if (!selectedDraft) {
                throw new Error(t("resume.messages.draftNotFound"));
            }
            const resumeWithPreview = {
                ...selectedDraft.resume,
            };

            if (selectedDraft.resumeType === "basic" && selectedDraft.photoUrl) {
                try {
                    resumeWithPreview.photoPreviewUrl = await getResumePhotoPreviewUrl(
                        selectedDraft.id,
                    );
                } catch {
                    // 사진 파일이 없거나 접근할 수 없어도 이력서 본문은 불러온다.
                    resumeWithPreview.photoPreviewUrl = "";
                }
            }

            if (selectedDraft.resumeType === "blind") {
                setBlindResume(resumeWithPreview);
                setResumeType("blind");
            } else {
                setBasicResume(resumeWithPreview);
                setBasicResumeId(selectedDraft.id);
                setBasicPhotoUrl(selectedDraft.photoUrl);
                setBasicPhotoFile(null);
                setResumeType("basic");
            }

            setIsLibraryOpen(false);
            setSaveMessage(t("resume.messages.draftLoaded"));
        } catch {
            setSaveMessage(t("resume.messages.draftLoadFailed"));
        } finally {
            setIsLoadingDrafts(false);
        }
    }

    function handlePrint() {
        // 현재 화면에 선택된 이력서 양식만 A4 인쇄 미리보기로 보낸다.
        window.print();
    }

    return (
        <div className="page-stack employment-resume-page">
            <div
                className="employment-resume-tabs"
                role="tablist"
                aria-label={t("resume.page.tabListAria")}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={!isBlind}
                    className={!isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("basic")}
                >
                    {t("resume.page.basicTab")}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={isBlind}
                    className={isBlind ? "is-active" : ""}
                    onClick={() => setResumeType("blind")}
                >
                    {t("resume.page.blindTab")}
                </button>
            </div>

            <article className="employment-resume-sheet" role="tabpanel">
                <header className="employment-resume-sheet-title">
                    <h2>
                        {isBlind
                            ? t("resume.page.blindSheetTitle")
                            : t("resume.page.basicSheetTitle")}
                    </h2>
                </header>
                {isBlind ? (
                    <BlindPersonalInfo
                        personal={blindResume.personal}
                        onChange={handleBlindPersonalChange}
                    />
                ) : (
                    <BasicPersonalInfo
                        personal={basicResume.personal}
                        photoPreviewUrl={basicResume.photoPreviewUrl}
                        isRemovingPhoto={isRemovingPhoto}
                        onChange={handleBasicPersonalChange}
                        onPhotoChange={handleBasicPhotoChange}
                        onPhotoRemove={handleBasicPhotoRemove}
                    />
                )}

                {sections.map(({ key, titleKey, columnKeys, fields }) => (
                    <ResumeTable
                        key={key}
                        title={t(`resume.sections.${titleKey}`)}
                        columns={columnKeys.map((columnKey) => t(`resume.columns.${columnKey}`))}
                        fields={fields}
                        rows={activeResume[key]}
                        onChange={(rowIndex, field, value) =>
                            handleTableChange(key, rowIndex, field, value)
                        }
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
                        {isSaving ? t("resume.actions.saving") : t("resume.actions.save")}
                    </button>
                    <button type="button" className="button" onClick={handleOpenLibrary}>
                        {t("resume.actions.load")}
                    </button>
                    <button type="button" className="button" onClick={handlePrint}>
                        {t("resume.actions.print")}
                    </button>
                </div>
                <button type="button" className="button" onClick={handleStartResumeTranslation}>
                    {t("resume.actions.translateToKorean")}
                </button>
            </div>

            <ResumeLoadModal
                isOpen={isLibraryOpen}
                drafts={savedDrafts}
                isLoading={isLoadingDrafts}
                onClose={() => setIsLibraryOpen(false)}
                onSelect={handleSelectDraft}
            />
            <ResumeTranslationModal
                isOpen={isTranslationModalOpen}
                sourceText={translationTarget?.sourceText ?? ""}
                fieldLabel={translationTarget?.fieldLabel ?? ""}
                translatedText={translationDraft}
                isLoading={isTranslating}
                error={translationError}
                currentIndex={translationQueueIndex}
                totalCount={translationQueue.length}
                hasNext={translationQueueIndex < translationQueue.length - 1}
                onTranslatedTextChange={setTranslationDraft}
                onRetry={handleRetryResumeTranslation}
                onCancel={handleCloseResumeTranslation}
                onApply={handleApplyResumeTranslation}
            />

            {saveMessage && <p className="employment-resume-save-message">{saveMessage}</p>}
        </div>
    );
}
