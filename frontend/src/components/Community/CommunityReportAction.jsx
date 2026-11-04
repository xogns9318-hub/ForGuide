import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import {
    reportCommunityComment,
    reportCommunityPost,
} from "../../api/communityApi.js";

const REPORT_REASONS = [
    "SPAM_AD",
    "ABUSE_HATE",
    "SEXUAL_CONTENT",
    "MISINFORMATION",
    "OTHER",
];
const MAX_IMAGE_COUNT = 4;

// 게시글·댓글이 같은 신고 선택 UI와 API 호출 흐름을 사용한다.
export default function CommunityReportAction({ postId, commentId = null }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const memberId = useAuthStore((state) => state.member?.memberId);
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);
    const previewUrlsRef = useRef(new Set());

    useEffect(() => () => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    function clearImages() {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current.clear();
        setImagePreviews([]);
    }

    function close() {
        if (isSubmitting) return;
        clearImages();
        setError("");
        setIsOpen(false);
    }

    function open() {
        if (!memberId) {
            navigate("/login", {state: {from: `/service/community`}});
            return;
        }
        setError("");
        setIsOpen(true);
    }

    function handleImageChange(event) {
        const selectedFiles = Array.from(event.target.files || []);
        event.target.value = "";

        if (imagePreviews.length + selectedFiles.length > MAX_IMAGE_COUNT) {
            setError(t("community.report.maxImageCount", { count: MAX_IMAGE_COUNT }));
            return;
        }

        const nextPreviews = selectedFiles.map((file) => {
            const url = URL.createObjectURL(file);
            previewUrlsRef.current.add(url);
            return { file, url };
        });

        setError("");
        setImagePreviews((previous) => [...previous, ...nextPreviews]);
    }

    function removeImage(index) {
        setImagePreviews((previous) => {
            const removed = previous[index];
            if (removed) {
                URL.revokeObjectURL(removed.url);
                previewUrlsRef.current.delete(removed.url);
            }
            return previous.filter((_, currentIndex) => currentIndex !== index);
        });
    }

    async function submit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (commentId) {
                await reportCommunityComment(
                    postId,
                    commentId,
                    reason,
                    imagePreviews.map((image) => image.file),
                );
            } else {
                await reportCommunityPost(
                    postId,
                    reason,
                    imagePreviews.map((image) => image.file),
                );
            }
            clearImages();
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
                        <div className="community-report-images">
                            <label className="community-report-image-add">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                {t("community.report.addImage")}
                            </label>
                            <span>{t("community.report.imageGuide")}</span>
                        </div>
                        {imagePreviews.length > 0 && (
                            <ul className="community-report-image-preview-list">
                                {imagePreviews.map((image, index) => (
                                    <li key={image.url}>
                                        <img
                                            src={image.url}
                                            alt={t("community.report.selectedImageAlt", {
                                                index: index + 1,
                                            })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            aria-label={t("community.report.removeImage")}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
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
                                onClick={close}
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
