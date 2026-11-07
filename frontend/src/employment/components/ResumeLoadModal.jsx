import { useTranslation } from "react-i18next";

function formatSavedAt(savedAt, language) {
    return new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(savedAt));
}

function getResumeTypeName(resumeType, t) {
    return resumeType === "blind" ? t("resume.page.blindTab") : t("resume.page.basicTab");
}

export default function ResumeLoadModal({ isOpen, drafts, isLoading, onClose, onSelect }) {
    const { t, i18n } = useTranslation();

    if (!isOpen) {
        return null;
    }

    return (
        <div className="resume-library-backdrop">
            <section
                className="resume-library-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="resume-library-title"
            >
                <header className="resume-library-header">
                    <div>
                        <h2 id="resume-library-title">{t("resume.library.title")}</h2>
                        <p>{t("resume.library.description")}</p>
                    </div>

                    <button type="button" className="button" onClick={onClose}>
                        {t("resume.library.close")}
                    </button>
                </header>

                {isLoading ? (
                    <p className="resume-library-state">{t("resume.library.loading")}</p>
                ) : drafts.length === 0 ? (
                    <p className="resume-library-state">{t("resume.library.empty")}</p>
                ) : (
                    <ul className="resume-library-list">
                        {drafts.map((draft) => (
                            <li key={draft.id}>
                                <button type="button" onClick={() => onSelect(draft.id)}>
                                    <strong>{getResumeTypeName(draft.resumeType, t)}</strong>
                                    <span>{formatSavedAt(draft.savedAt, i18n.language)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
