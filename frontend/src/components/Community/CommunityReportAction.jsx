import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "../../auth/store/useAuthStore.js";
import {reportCommunityComment, reportCommunityPost} from "../../api/communityApi.js";

const REPORT_REASONS = ["SPAM_AD", "ABUSE_HATE", "SEXUAL_CONTENT", "MISINFORMATION", "OTHER"];

// 게시글·댓글이 같은 신고 선택 UI와 API 호출 흐름을 사용한다.
export default function CommunityReportAction({postId, commentId = null}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const memberId = useAuthStore((state) => state.member?.memberId);
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function open() {
        if (!memberId) {
            navigate("/login", {state: {from: `/service/community`}});
            return;
        }
        setError("");
        setIsOpen(true);
    }

    async function submit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (commentId) {
                await reportCommunityComment(postId, commentId, reason);
            } else {
                await reportCommunityPost(postId, reason);
            }
            setIsOpen(false);
        } catch (requestError) {
            setError(requestError?.message || t("community.report.error"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button type="button" className="community-report-button" onClick={open}>
                {t("community.report.action")}
            </button>

            {isOpen && (
                <div className="community-report-backdrop" role="presentation">
                    <form className="community-report-dialog" onSubmit={submit}>
                        <h3>{t("community.report.action")}</h3>
                        <p>{t("community.report.description")}</p>
                        <label>
                            <span>{t("community.report.reason")}</span>
                            <select
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                            >
                                {REPORT_REASONS.map((code) => (
                                    <option key={code} value={code}>
                                        {t(`community.report.reasons.${code}`)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {error && <p role="alert">{error}</p>}
                        <div className="community-report-actions">
                            <button
                                type="submit"
                                className="button button-primary community-report-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? t("community.report.submitting")
                                    : t("community.report.submit")}
                            </button>
                            <button
                                type="button"
                                className="community-report-cancel-button"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                            >
                                {t("community.report.cancel")}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
