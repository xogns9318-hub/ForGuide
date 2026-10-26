import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ProfileAvatar.module.css";

// 회원 프로필 이미지 (원형)
// imageUrl이 없거나 불러오기에 실패하면 이름 첫 글자로 대신 표시한다
// size: 화면에 보이는 지름(px)
export default function ProfileAvatar({ imageUrl, name = "", size = 48 }) {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);

    // 이미지 주소가 바뀌면 다시 시도
    useEffect(() => {
        setFailed(false);
    }, [imageUrl]);

    const initial = Array.from((name ?? "").trim())[0] ?? "?";
    const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

    if (!imageUrl || failed) {
        return (
            <span className={`${styles.avatar} ${styles.initial}`} style={style} aria-hidden="true">
                {initial}
            </span>
        );
    }

    return (
        <img
            className={styles.avatar}
            style={style}
            src={imageUrl}
            alt={name ? t("auth.profileImage.altWithName", { name }) : t("auth.profileImage.alt")}
            onError={() => setFailed(true)}
        />
    );
}
