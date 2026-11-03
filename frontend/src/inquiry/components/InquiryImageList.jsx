import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { client } from "../../api/client.js";
import styles from "../../styles/inquiry.module.css";

// 보호된 문의 이미지는 인증 API로 받아 브라우저 임시 주소로만 표시한다.
export default function InquiryImageList({ inquiryId, images, isAdmin = false }) {
    const { t } = useTranslation();
    const [imageUrls, setImageUrls] = useState([]);

    useEffect(() => {
        let cancelled = false;
        const createdUrls = [];

        async function loadImages() {
            if (!inquiryId || !images?.length) {
                setImageUrls([]);
                return;
            }

            try {
                const urls = await Promise.all(
                    images.map(async (image) => {
                        const prefix = isAdmin ? "/admin/inquiries" : "/inquiries";
                        const blob = await client.getBlob(
                            `${prefix}/${inquiryId}/images/${image.inquiryImageId}`,
                        );
                        const url = URL.createObjectURL(blob);
                        createdUrls.push(url);
                        return { inquiryImageId: image.inquiryImageId, url };
                    }),
                );

                if (!cancelled) {
                    setImageUrls(urls);
                }
            } catch {
                if (!cancelled) {
                    setImageUrls([]);
                }
            }
        }

        void loadImages();

        return () => {
            cancelled = true;
            createdUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [images, inquiryId, isAdmin]);

    if (!imageUrls.length) {
        return null;
    }

    return (
        <div className={styles.imageList} aria-label={t("inquiry.images.label")}>
            {imageUrls.map((image, index) => (
                <a key={image.inquiryImageId} href={image.url} target="_blank" rel="noreferrer">
                    <img src={image.url} alt={t("inquiry.images.alt", { index: index + 1 })} />
                </a>
            ))}
        </div>
    );
}
