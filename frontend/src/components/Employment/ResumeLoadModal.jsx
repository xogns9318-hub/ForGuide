function formatSavedAt(savedAt) {
    return new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(savedAt));
}

function getResumeTypeName(resumeType) {
    return resumeType === "blind"
        ? "블라인드 채용 이력서"
        : "기본 이력서";
}

export default function ResumeLoadModal({
    isOpen,
    drafts,
    isLoading,
    onClose,
    onSelect,
}) {
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
                        <h2 id="resume-library-title">
                            저장한 이력서 불러오기
                        </h2>
                        <p>
                            저장한 이력서를 선택하면 현재 작성 내용이
                            선택한 초안으로 바뀝니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="button"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </header>

                {isLoading ? (
                    <p className="resume-library-state">
                        저장한 이력서를 불러오는 중입니다.
                    </p>
                ) : drafts.length === 0 ? (
                    <p className="resume-library-state">
                        저장한 이력서가 없습니다.
                    </p>
                ) : (
                    <ul className="resume-library-list">
                        {drafts.map((draft) => (
                            <li key={draft.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(draft.id)}
                            >
                                    <strong>
                                        {getResumeTypeName(
                                            draft.resumeType,
                                        )}
                                    </strong>
                                    <span>
                                        {formatSavedAt(draft.savedAt)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}