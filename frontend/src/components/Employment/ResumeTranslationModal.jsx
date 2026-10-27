import { useTranslation } from "react-i18next";

export default function ResumeTranslationModal({
    isOpen,
    sourceText,
    fieldLabel,
    translatedText,
    isLoading,
    error,
    currentIndex,
    totalCount,
    hasNext,
    onTranslatedTextChange,
    onRetry,
    onCancel,
    onApply,
}) {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    return (
        <div className="resume-translation-backdrop">
            <section
                className="resume-translation-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="resume-translation-title"
            >
                <header className="resume-translation-modal-header">
                    <div>
                        <p className="resume-translation-eyebrow">
                            {t("resume.translation.eyebrow")}
                        </p>
                        <h2 id="resume-translation-title">{t("resume.translation.title")}</h2>
                    </div>

                    <button
                        type="button"
                        className="resume-translation-close"
                        onClick={onCancel}
                        aria-label={t("resume.translation.closeAria")}
                    >
                        ×
                    </button>
                </header>

                <p className="resume-translation-description">
                    {t("resume.translation.description")}
                </p>

                {totalCount > 1 && (
                    <p className="resume-translation-progress">
                        {t("resume.translation.progress", {
                            current: currentIndex + 1,
                            total: totalCount,
                        })}
                    </p>
                )}

                {fieldLabel && <p className="resume-translation-field-label">{fieldLabel}</p>}

                <label className="resume-translation-field">
                    <span>{t("resume.translation.original")}</span>
                    <textarea value={sourceText} readOnly rows={4} />
                </label>

                <label className="resume-translation-field">
                    <span>{t("resume.translation.koreanDraft")}</span>

                    {isLoading ? (
                        <p className="resume-translation-status">
                            {t("resume.translation.translating")}
                        </p>
                    ) : (
                        <textarea
                            value={translatedText}
                            onChange={(event) => onTranslatedTextChange(event.target.value)}
                            rows={4}
                            disabled={Boolean(error)}
                        />
                    )}
                </label>

                {error && (
                    <p className="resume-translation-error" role="alert">
                        {error}
                    </p>
                )}

                <footer className="resume-translation-actions">
                    <button type="button" className="button" onClick={onCancel}>
                        {t("resume.translation.cancel")}
                    </button>

                    {error ? (
                        <button type="button" className="button button-primary" onClick={onRetry}>
                            {t("resume.translation.retry")}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={onApply}
                            disabled={isLoading || !translatedText.trim()}
                        >
                            {hasNext
                                ? t("resume.translation.applyAndNext")
                                : t("resume.translation.apply")}
                        </button>
                    )}
                </footer>
            </section>
        </div>
    );
}
