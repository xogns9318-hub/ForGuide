import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
    getConsultationInstitutions,
    getConsultationInstitution,
} from "../../api/consultationApi.js";
import styles from "../../styles/institutionResults.module.css";

const unique = (values) => [...new Set(values.filter(Boolean))];

const availability = (value, t) =>
    value === true ? t("available") : value === false ? t("unavailable") : t("unknown");

// 공식 사이트와 출처 링크에는 HTTP(S) 주소만 허용한다.
function webUrl(value) {
    try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function Website({ url, children }) {
    const href = webUrl(url);

    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ) : null;
}

function PhoneLink({ number, fallback }) {
    const phone = String(number ?? "").replace(/[^+\d]/g, "");

    return phone ? <a href={`tel:${phone}`}>{number}</a> : fallback;
}

function Field({ label, children }) {
    return (
        <div>
            <dt>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

// 카드에서는 언어를 요약하고, 상세에서는 원문과 이용 조건을 모두 보여준다.
function ServiceInformation({ service, guidance, t, compact = false }) {
    const p = service.phone;
    const v = service.visit;
    const baseLanguages = ["한국어", "영어", "중국어", "일본어", "태국어", "베트남어"];

    const languages = (method) => {
        const all = unique(
            service.languages
                .filter((language) => language.method === method)
                .map((language) => language.code),
        );

        if (!compact) {
            const original =
                method === "phone" ? guidance?.phoneLanguages : guidance?.visitLanguages;

            return original || all.join(", ") || t("unknown");
        }

        // 실제 지원하는 기본 언어만 남기고, 나머지는 다국어 한 번으로 표시한다.
        const displayed = baseLanguages.filter((language) => all.includes(language));

        if (all.some((language) => !baseLanguages.includes(language))) {
            displayed.push(t("multilingual"));
        }

        return displayed.join(", ") || t("unknown");
    };

    const location =
        unique(
            service.regions
                .filter((region) => region.method === "visit")
                .map((region) => [region.province, region.district].filter(Boolean).join(" ")),
        ).join(", ") || (p.regionStatus === "unrestricted" ? t("phoneNationwide") : t("unknown"));

    const methods = ["phone", "visit", "online"]
        .filter((method) => service[method]?.available === true)
        .map((method) => t(`methods.${method}`))
        .join(" · ");

    const reservation =
        v.reservationRequired === true
            ? t("required")
            : v.reservationRequired === false
              ? t("notRequired")
              : t("unknown");

    // 조건부 운영 설명을 단순 운영/미운영 값보다 우선해 보여준다.
    const commonFields = [
        ["location", guidance?.location || location],
        ["phoneHours", p.available === false ? t("unavailable") : p.hours || t("unknown")],
        ["visitHours", v.available === false ? t("unavailable") : v.hours || t("unknown")],
        ["phoneWeekend", guidance?.phoneWeekend || availability(p.weekend, t)],
        ["phoneHoliday", guidance?.phoneHoliday || availability(p.holiday, t)],
        ["phoneLanguages", languages("phone")],
        ...(compact && service.languageNotes ? [["languageNotes", service.languageNotes]] : []),
        ["methods", guidance?.methods || methods || t("unknown")],
        ["reservationRequired", guidance?.reservation || reservation],
    ];

    const detailFields = [
        ["visitAddress", v.address || t("unknown")],
        ["visitWeekend", guidance?.visitWeekend || availability(v.weekend, t)],
        ["visitHoliday", guidance?.visitHoliday || availability(v.holiday, t)],
        ["visitLanguages", languages("visit")],
        ["branch", v.branchInformation || t("unknown")],
        ["languageNotes", service.languageNotes || t("unknown")],
        ["contact", service.contactDescription || t("unknown")],
        ["target", service.targetDescription || t("unknown")],
        ["preparation", guidance?.preparation || t("preparationUnknown")],
    ];

    return (
        <>
            <dl className={styles.fields}>
                {(compact ? commonFields : [...commonFields, ...detailFields]).map(
                    ([key, value]) => (
                        <Field key={key} label={t(`fields.${key}`)}>
                            {value}
                        </Field>
                    ),
                )}
            </dl>

            {service.specialPhone?.hours && (
                <p className={styles.notice}>
                    {t("specialHours", {
                        scope: service.specialPhone.scope,
                        hours: service.specialPhone.hours,
                    })}
                </p>
            )}

            {!compact && (
                <div className={styles.links}>
                    <Website url={v.reservationUrl}>{t("reservationLink")}</Website>
                    <Website url={service.online.url}>{t("onlineLink")}</Website>
                    <Website url={service.sourceUrl}>{t("serviceSource")}</Website>
                </div>
            )}
        </>
    );
}

// 네이티브 dialog가 모달의 포커스와 배경 접근 제한을 관리한다.
function InstitutionDialog({ id, filters, onClose, t }) {
    const dialogRef = useRef(null);
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();

        let active = true;
        setItem(null);
        setError(null);

        getConsultationInstitution(id)
            .then((data) => {
                if (active) setItem(data);
            })
            .catch((failure) => {
                if (active) setError(failure);
            });

        return () => {
            // 닫은 기관의 늦은 응답이 다음 상세를 덮어쓰지 않게 한다.
            active = false;
            dialog.close();
        };
    }, [id, retry]);

    // 조사 자료가 있으면 새 전체 키워드를 표시한다.
    // 기존 자료에는 상담 업무별 키워드를 대신 사용한다.
    const keywords = item
        ? item.featuredKeywords.length
            ? item.featuredKeywords
            : unique(item.services.flatMap((service) => service.keywords))
        : [];

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby="institution-dialog-title"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                // 안쪽의 버튼·내용 클릭은 여기서 처리하지 않는다.
                if (event.target !== event.currentTarget) return;

                // 팝업 내부 여백과 실제 바깥 배경을 좌표로 구분한다.
                const rect = event.currentTarget.getBoundingClientRect();
                const outside =
                    event.clientX < rect.left ||
                    event.clientX > rect.right ||
                    event.clientY < rect.top ||
                    event.clientY > rect.bottom;

                // 실제로 팝업 바깥을 눌렀을 때만 닫는다.
                if (outside) onClose();
            }}
        >
            <div className={styles.dialogHeader}>
                <h2 id="institution-dialog-title">{item?.name || t("detailTitle")}</h2>
                <button type="button" className="button" onClick={onClose} autoFocus>
                    {t("close")}
                </button>
            </div>

            {!item && !error && <p role="status">{t("loading")}</p>}

            {error && (
                <div role="alert">
                    <p>{error.code === "NOT_FOUND" ? t("notFound") : t("loadError")}</p>
                    <button
                        type="button"
                        className="button"
                        onClick={() => setRetry((previous) => previous + 1)}
                    >
                        {t("retry")}
                    </button>
                </div>
            )}

            {item && (
                <div className={styles.detailBody}>
                    <p>{item.description || t("unknown")}</p>

                    {item.verificationStatus !== "verified" && (
                        <p className={styles.notice}>{t("partialNotice")}</p>
                    )}

                    <dl className={styles.fields}>
                        <Field label={t("fields.target")}>
                            {item.targetDescription || t("unknown")}
                        </Field>

                        <Field label={t("fields.address")}>{item.address || t("unknown")}</Field>

                        <Field label={t("fields.phone")}>
                            <PhoneLink number={item.phone} fallback={t("unknown")} />
                        </Field>

                        <Field label={t("fields.keywords")}>
                            {keywords.join(", ") || t("unknown")}
                        </Field>

                        <Field label={t("fields.checkedAt")}>
                            {item.checkedAt?.slice(0, 10) || t("unknown")}
                        </Field>
                    </dl>

                    {item.additionalPhones.map((phone) => (
                        <p key={phone.phone}>
                            {phone.label}:{" "}
                            <PhoneLink number={phone.phone} fallback={t("unknown")} /> {phone.notes}
                        </p>
                    ))}

                    {item.additionalNotes && (
                        <p className={styles.notice}>{item.additionalNotes}</p>
                    )}

                    <h3>{t("servicesTitle")}</h3>

                    {item.services.map((service, index) => (
                        <details key={service.id} open={index === 0}>
                            <summary>
                                {service.topic ? t(`topics.${service.topic}`) : t("administration")}
                                {" · "}
                                {t(`roles.${service.role}`)}
                            </summary>

                            <p>{service.summary}</p>

                            {service.description && <p>{service.description}</p>}

                            <ServiceInformation service={service} guidance={item.guidance} t={t} />
                        </details>
                    ))}

                    <div className={styles.links}>
                        <Website url={item.websiteUrl}>{t("officialLink")}</Website>

                        {item.sourceUrls.map((source, index) => (
                            <Website key={source} url={source}>
                                {t("sourceLink", {
                                    count: index + 1,
                                })}
                            </Website>
                        ))}
                    </div>

                    {/* 기존 준비 카드 주소에 기관·선택 조건을 전달한다. */}
                    <Link
                        className="button button-primary"
                        to="/service/preparationCard"
                        state={{
                            consultation: {
                                institutionId: item.id,
                                institutionCode: item.code,
                                institutionName: item.name,
                                topic: filters?.topic || "",
                                keywords: filters?.keywords || [],
                                serviceIds: item.services.map((service) => service.id),
                            },
                        }}
                    >
                        {t("prepareCard")}
                    </Link>
                </div>
            )}
        </dialog>
    );
}

export default function ConsultationResults({ filters, visible, reloadKey }) {
    const { t: translate } = useTranslation();
    const t = (key, variables) => translate(`institutionGuide.${key}`, variables);

    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [retry, setRetry] = useState(0);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        // 조건 변경 직후에는 이전 결과와 상세를 숨긴다.
        setSelectedId(null);

        if (!visible) return;

        let active = true;
        setLoading(true);
        setError(null);
        setResult(null);

        getConsultationInstitutions(filters || {})
            .then((data) => {
                if (active) setResult(data);
            })
            .catch((failure) => {
                if (active) setError(failure);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        // 다른 검색이나 화면 이동 뒤 도착한 응답은 반영하지 않는다.
        return () => {
            active = false;
        };
    }, [filters, visible, reloadKey, retry]);

    if (!visible) return null;

    const chart =
        result?.items.slice(0, 5).map((item) => ({
            name: item.name,
            matched: item.match.keywords.length,
        })) || [];

    return (
        <section
            className={styles.results}
            aria-labelledby="institution-results-title"
            aria-busy={loading}
        >
            <h2 id="institution-results-title">{t("resultsTitle")}</h2>

            {loading && <p role="status">{t("loading")}</p>}

            {error && (
                <div role="alert" className={styles.error}>
                    <p>{error.message === "INVALID_INPUT" ? t("invalidInput") : t("loadError")}</p>
                    <button
                        className="button"
                        type="button"
                        onClick={() => setRetry((previous) => previous + 1)}
                    >
                        {t("retry")}
                    </button>
                </div>
            )}

            {result && (
                <>
                    <p role="status">
                        {t("resultCount", {
                            count: result.items.length,
                        })}
                    </p>

                    <p className={styles.notice}>{t("rankingNotice")}</p>

                    {!result.items.length && <p>{t("empty")}</p>}

                    {/* 실제 키워드 일치 개수만 비교한다. */}
                    {result.filters.keywords.length > 0 && chart.length > 0 && (
                        <figure className={styles.chart} aria-label={t("chartTitle")}>
                            <figcaption>{t("chartTitle")}</figcaption>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart
                                    data={chart}
                                    margin={{
                                        bottom: 55,
                                        left: 0,
                                        right: 10,
                                    }}
                                >
                                    <XAxis
                                        dataKey="name"
                                        angle={-15}
                                        textAnchor="end"
                                        interval={0}
                                        height={65}
                                        tick={{
                                            fontSize: 11,
                                        }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        domain={[0, result.filters.keywords.length]}
                                    />
                                    <Tooltip formatter={(count) => [count, t("matchedLabel")]} />
                                    <Bar dataKey="matched" fill="var(--primary)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </figure>
                    )}

                    <div className={styles.grid}>
                        {result.items.map((item) => (
                            <article key={item.id} className={`panel ${styles.card}`}>
                                <h3>{item.name}</h3>

                                <div className={styles.tags}>
                                    {item.featuredKeywords.slice(0, 4).map((keyword) => (
                                        <span key={keyword}>{keyword}</span>
                                    ))}
                                </div>

                                <p>{t(`roles.${item.match.role}`)}</p>

                                {item.match.selectedCount > 0 && (
                                    <p>
                                        {t("matchCount", {
                                            matched: item.match.keywords.length,
                                            total: item.match.selectedCount,
                                            percent: item.match.percent,
                                        })}
                                    </p>
                                )}

                                {item.match.keywords.length > 0 && (
                                    <p className={styles.notice}>
                                        {t("matchedList", {
                                            keywords: item.match.keywords.join(", "),
                                        })}
                                    </p>
                                )}

                                {item.match.unknown.length > 0 && (
                                    <p className={styles.notice}>
                                        {item.match.unknown
                                            .map((field) => t(`pending.${field}`))
                                            .join(" · ")}
                                    </p>
                                )}

                                <ServiceInformation
                                    service={item.preview}
                                    guidance={item.guidance}
                                    t={t}
                                    compact
                                />

                                <p>
                                    {t("fields.phone")}:{" "}
                                    <PhoneLink number={item.phone} fallback={t("unknown")} />
                                </p>

                                <div className={styles.cardActions}>
                                    <button
                                        type="button"
                                        className="button button-primary"
                                        onClick={() => setSelectedId(item.id)}
                                    >
                                        {t("detail")}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {selectedId !== null && (
                <InstitutionDialog
                    id={selectedId}
                    filters={filters}
                    onClose={() => setSelectedId(null)}
                    t={t}
                />
            )}
        </section>
    );
}
