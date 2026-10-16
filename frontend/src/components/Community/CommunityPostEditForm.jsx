import { useState } from "react";
import { updateCommunityPost } from "../../api/communityApi.js";

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

// 게시글 본문과 기존·새 사진을 한 번에 수정하는 폼
export default function CommunityPostEditForm({ post, onCancel, onUpdated }) {
    const [content, setContent] = useState(post.content);
    const [removedImageIds, setRemovedImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const existingImages = post.images ?? [];

    function isRemoved(imageId) {
        return removedImageIds.includes(imageId);
    }

    function toggleExistingImage(imageId) {
        setRemovedImageIds((currentIds) =>
            currentIds.includes(imageId)
                ? currentIds.filter((id) => id !== imageId)
                : [...currentIds, imageId],
        );
    }

    function handleNewImages(event) {
        const selectedImages = Array.from(event.target.files ?? []);
        const invalidImage = selectedImages.find(
            (image) => !["image/jpeg", "image/png"].includes(image.type)
                || image.size > MAX_IMAGE_BYTES,
        );

        if (invalidImage) {
            setError("JPG 또는 PNG 사진만, 한 장당 20MB 이하로 올릴 수 있습니다.");
            event.target.value = "";
            return;
        }

        const activeExistingCount = existingImages.filter(
            (image) => !isRemoved(image.imageId),
        ).length;

        if (activeExistingCount + newImages.length + selectedImages.length > MAX_IMAGE_COUNT) {
            setError("게시글 사진은 최대 4장까지 올릴 수 있습니다.");
            event.target.value = "";
            return;
        }

        setNewImages((currentImages) => [...currentImages, ...selectedImages]);
        setError("");
        event.target.value = "";
    }

    function removeNewImage(index) {
        setNewImages((currentImages) =>
            currentImages.filter((_, imageIndex) => imageIndex !== index),
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent) {
            setError("게시글 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        const formData = new FormData();
        formData.append("content", trimmedContent);
        removedImageIds.forEach((imageId) => {
            formData.append("removeImageIds", String(imageId));
        });
        newImages.forEach((image) => formData.append("images", image));

        try {
            const updatedPost = await updateCommunityPost(post.postId, formData);
            onUpdated(updatedPost);
        } catch (requestError) {
            setError(requestError.message || "게시글을 수정하지 못했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form className="community-post-edit-form" onSubmit={handleSubmit}>
            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={5000}
                rows={6}
                disabled={isSubmitting}
                aria-label="게시글 내용 수정"
            />

            {existingImages.length > 0 && (
                <div className="community-edit-existing-images">
                    {existingImages.map((image) => {
                        const removed = isRemoved(image.imageId);

                        return (
                            <figure
                                key={image.imageId}
                                className={removed ? "is-removed" : ""}
                            >
                                <img src={image.imageUrl} alt="기존 게시글 사진" />
                                <button
                                    type="button"
                                    onClick={() => toggleExistingImage(image.imageId)}
                                    disabled={isSubmitting}
                                >
                                    {removed ? "삭제 취소" : "사진 삭제"}
                                </button>
                            </figure>
                        );
                    })}
                </div>
            )}

            <div className="community-edit-image-picker">
                <label htmlFor={`edit-images-${post.postId}`}>
                    사진 추가
                </label>
                <input
                    id={`edit-images-${post.postId}`}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleNewImages}
                    disabled={isSubmitting}
                />

                {newImages.length > 0 && (
                    <ul>
                        {newImages.map((image, index) => (
                            <li key={`${image.name}-${index}`}>
                                {image.name}
                                <button
                                    type="button"
                                    onClick={() => removeNewImage(index)}
                                    disabled={isSubmitting}
                                >
                                    제거
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && <p role="alert">{error}</p>}

            <div className="community-post-edit-actions">
                <button type="button" onClick={onCancel} disabled={isSubmitting}>
                    취소
                </button>
                <button type="submit" className="button" disabled={isSubmitting}>
                    {isSubmitting ? "수정 중..." : "수정 완료"}
                </button>
            </div>
        </form>
    );
}
