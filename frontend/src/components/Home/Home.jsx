import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories } from "../../routes/routeConfig.js";
import styles from "../../styles/home.module.css";

// 헤더와 동일한 세부 서비스 이름과 주소를 사용한다.
function serviceItems(categoryId) {
    const category = categories.find((item) => item.id === categoryId);

    return category.children.map((child) => ({
        ...child,
        labelKey: `home.features.${categoryId}.${child.id}`,
    }));
}

const sections = [
    {
        id: "translation",
        titleKey: "homeOverview.translation.title",
        items: [{ id: "translation" }],
    },
    {
        id: "counseling",
        titleKey: "navigation.counseling",
        items: serviceItems("counseling"),
    },
    {
        id: "recommendation",
        titleKey: "navigation.recommendation",
        items: serviceItems("recommendation"),
    },
    {
        id: "repayment",
        titleKey: "navigation.repayment",
        items: serviceItems("repayment"),
    },
    {
        id: "employment",
        titleKey: "navigation.employment",
        items: serviceItems("employment"),
    },
    {
        id: "extendedServices",
        titleKey: "header.mega.extendedServices",
        items: [...serviceItems("simulator"), ...serviceItems("community")],
    },
    {
        id: "contact",
        titleKey: "header.mega.contact",
        items: [
            { id: "myInquiries", labelKey: "header.mega.myInquiries" },
            { id: "privateInquiry", labelKey: "header.mega.privateInquiry" },
            { id: "faq", labelKey: "header.mega.faq" },
        ],
    },
];

export default function Home() {
    const { t } = useTranslation();

    return (
        <div className={styles.home}>
            <h1 className={styles.srOnly}>{t("header.mega.home")}</h1>

            {/* 세부 기능이 아니라 가이드 전체를 기준으로 좌우를 번갈아 배치한다. */}
            {sections.map((section, index) => (
                <section
                    key={section.id}
                    className={`${styles.section} ${index % 2 ? styles.right : ""}`}
                    aria-labelledby={`home-${section.id}`}
                >
                    <div className={styles.content}>
                        <h2 id={`home-${section.id}`} className={styles.sectionTitle}>
                            {t(section.titleKey)}
                        </h2>

                        <div className={styles.features}>
                            {section.items.map((item) => {
                                const Headline = item.labelKey ? "h4" : "h3";

                                return (
                                    <article key={item.id}>
                                        {item.labelKey && (
                                            <h3 className={styles.featureTitle}>
                                                {item.path ? (
                                                    <Link
                                                        to={item.path}
                                                        className={styles.featureLink}
                                                    >
                                                        {t(item.labelKey, {
                                                            defaultValue: item.label,
                                                        })}
                                                    </Link>
                                                ) : (
                                                    t(item.labelKey)
                                                )}
                                            </h3>
                                        )}

                                        <Headline className={styles.headline}>
                                            {t(`homeOverview.${item.id}.headline`)}
                                        </Headline>

                                        <p className={styles.description}>
                                            {t(`homeOverview.${item.id}.description`)}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}