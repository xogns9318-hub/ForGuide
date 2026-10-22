import { useEffect, useRef, useState } from "react";
import Banner from "../Banner/Banner.jsx";
import JobListingDetailModal from "./JobListingDetailModal.jsx";
import { getJobListingSections } from "../../api/jobListingsApi.js";
import { useTranslation } from "react-i18next";
import "../../styles/job-listings.css";
const iconPaths = {
    building: "M3 21h18 M5 21V9l7-5 7 5v12 M9 21v-5h6v5 M9 12h.01 M15 12h.01",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    briefcase: "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3",
    connection: "M8 12l3 3 5-5 M5 7l2-2 4 4 M19 7l-2-2-4 4 M5 17l2 2 4-4 M19 17l-2 2-4-4",
    graduation: "M2 10l10-5 10 5-10 5z M6 12v5c2 2 8 2 10 0v-5 M22 10v6",
    document: "M6 3h9l4 4v14H6z M15 3v5h4 M9 12h6 M9 16h6",
    location: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    message: "M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-4.2-1L3 20l1.3-3.9A8.3 8.3 0 0 1 3 11.5a8.5 8.5 0 0 1 9-8.5 8.5 8.5 0 0 1 9 8.5z",
};

const regionTranslationKeys = {
    서울: "seoul",
    경기: "gyeonggi",
    인천: "incheon",
    부산: "busan",
    대구: "daegu",
    광주: "gwangju",
    대전: "daejeon",
    울산: "ulsan",
    세종: "sejong",
    강원: "gangwon",
    충북: "chungbuk",
    충남: "chungnam",
    전북: "jeonbuk",
    전남: "jeonnam",
    경북: "gyeongbuk",
    경남: "gyeongnam",
    제주: "jeju",
};

const centerTranslationKeys = {
    수원고용복지센터: "suwon",
    인천고용복지센터: "incheon",
    대구고용복지센터: "daegu",
    광주고용복지센터: "gwangju",
    대전고용복지센터: "daejeon",
    울산고용복지센터: "ulsan",
    세종고용복지센터: "sejong",
    춘천고용복지센터: "chuncheon",
    청주고용복지센터: "cheongju",
    천안고용복지센터: "cheonan",
    전주고용복지센터: "jeonju",
    목포고용복지센터: "mokpo",
    포항고용복지센터: "pohang",
    창원고용복지센터: "changwon",
    제주특별자치도고용복지센터: "jeju",
};

function getLocalizedRegionName(region, t) {
    const regionKey = regionTranslationKeys[region];

    return regionKey
        ? t(`jobListings.content.regions.${regionKey}`, {
            defaultValue: region,
        })
        : region;
}

function getLocalizedListing(listing, t) {
    const translationKey = listing.translationKey ?? listing.id;
    const baseKey = `jobListings.content.listings.${translationKey}`;
    const values = { ...listing.translationValues };

    if (values.region) {
        values.region = getLocalizedRegionName(values.region, t);
    }

    if (values.centerName) {
        const centerKey = centerTranslationKeys[values.centerName];

        values.centerName = centerKey
            ? t(`jobListings.content.centers.${centerKey}`)
            : values.centerName;
    }

    function translate(field, fallback) {
        return t(`${baseKey}.${field}`, {
            ...values,
            defaultValue: fallback,
        });
    }

    return {
        ...listing,
        title: translate("title", listing.title),
        summary: translate("summary", listing.summary),
        language: translate("language", listing.language),
        target: translate("target", listing.target),
        detail: translate("detail", listing.detail),
        caution: translate("caution", listing.caution),
        sourceName: translate("sourceName", listing.sourceName),
        recommendedFor: listing.recommendedFor?.map((recommendation, index) => (
            translate(`recommendedFor.${index}`, recommendation)
        )),
    };
}

function getLocalizedSection(section, t) {
    const baseKey = `jobListings.content.sections.${section.id}`;

    return {
        ...section,
        title: t(`${baseKey}.title`, { defaultValue: section.title }),
        description: t(`${baseKey}.description`, {
            defaultValue: section.description,
        }),
    };
}

function ListingIcon({ type }) {
    return (
        <span className="job-listing-icon" aria-hidden="true">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={iconPaths[type]} />
            </svg>
        </span>
    );
}

function JobListingCard({ listing, onDetailOpen, t }) {
    return (
        <article className="job-listing-card">
            <div className="job-listing-card-heading">
                <ListingIcon type={listing.icon} />
                <div>
                    <h3>{listing.title}</h3>
                    <p>{listing.summary}</p>
                </div>
            </div>

            {/* 목록에서는 비교에 필요한 대상·언어만 간단히 보여준다.
                제공 정보와 상세 안내는 다음 단계의 자세히 보기 모달에서 사용한다. */}
            <div
                className="job-listing-meta"
                aria-label={`${t("jobListings.labels.target")} · ${t(
                    "jobListings.labels.language",
                )}`}
            >
                <div className="job-listing-meta-item">
                    <span className="job-listing-meta-label">
                        {t("jobListings.labels.target")}
                    </span>
                    <span className="job-listing-meta-value">
                        {listing.target}
                    </span>
                </div>
                <div className="job-listing-meta-item">
                    <span className="job-listing-meta-label">
                        {t("jobListings.labels.language")}
                    </span>
                    <span className="job-listing-meta-value">
                        {listing.language}
                    </span>
                </div>
            </div>

            <div className="job-listing-actions">
                <button
                    type="button"
                    className="job-listing-action-button"
                    onClick={() => onDetailOpen(listing)}
                >
                    {t("jobListings.actions.details")}{" "}
                    <span aria-hidden="true">↗</span>
                </button>

                <a
                    className="job-listing-action-button"
                    href={listing.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("jobListings.actions.openOfficialSite")}
                >
                    {t("jobListings.actions.openSite")}{" "}
                    <span aria-hidden="true">↗</span>
                </a>
            </div>
        </article>
    );
}

export default function JobListings() {
    const { t } = useTranslation();
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState("서울");
    const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const regionMenuRef = useRef(null);

    useEffect(() => {
        async function loadJobListings() {
            try {
                const response = await getJobListingSections();
                setSections(response);
            } catch {
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        }

        loadJobListings();
    }, []);

    useEffect(() => {
        function closeRegionMenuWhenClickedOutside(event) {
            if (!regionMenuRef.current?.contains(event.target)) {
                setIsRegionMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", closeRegionMenuWhenClickedOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                closeRegionMenuWhenClickedOutside,
            );
        };
    }, []);

    const regionalSection = sections.find((section) => section.id === "regional");
    const generalSections = sections.filter((section) => section.id !== "regional");
    const regionalListings = regionalSection?.listingsByRegion?.[selectedRegion]
        ?? regionalSection?.listings
        ?? [];

    return (
        <div className="page-stack job-listings-page">
            <Banner
                title={t("jobListings.page.title")}
                description={t("jobListings.page.description")}
            />

            {isLoading &&
                <p className="job-listings-state">
                    {t("jobListings.status.loading")}
                </p>
            }

            {loadError &&
                <p className="job-listings-state">
                    {t("jobListings.status.error")}
                </p>
            }

            {!isLoading && !loadError && <>
                {generalSections.map((section) => {
                    const localizedSection = getLocalizedSection(section, t);

                    return (
                        <section
                            key={section.id}
                            className="job-listings-section"
                            aria-labelledby={`${section.id}-title`}
                        >
                            <div className="job-listings-section-heading">
                                <h2 id={`${section.id}-title`}>
                                    {localizedSection.title}
                                </h2>
                            <p>{localizedSection.description}</p>
                            </div>
                            <div className="job-listings-grid">
                                {section.listings.map((listing) => (
                                    <JobListingCard
                                        key={listing.id}
                                        listing={getLocalizedListing(listing, t)}
                                        onDetailOpen={setSelectedListing}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {regionalSection && (() => {
                    const localizedRegionalSection = getLocalizedSection(
                        regionalSection,
                        t,
                    );

                    return (
                        <section
                            className="job-listings-section"
                            aria-labelledby="regional-title"
                        >
                            <div className="job-listings-section-heading">
                                <h2 id="regional-title">
                                    {localizedRegionalSection.title}
                                </h2>
                                <p>{localizedRegionalSection.description}</p>
                            </div>
                            <div
                                ref={regionMenuRef}
                                className="job-listings-region-control"
                            >
                        <span
                            id="job-listings-region-label">
                            {t("jobListings.labels.region")}
                        </span>

                        <button
                            type="button"
                            className="job-listings-region-trigger"
                            aria-labelledby="job-listings-region-label"
                            aria-haspopup="listbox"
                            aria-expanded={isRegionMenuOpen}
                            onClick={() => setIsRegionMenuOpen((isOpen) => !isOpen)}
                        >
                            {getLocalizedRegionName(selectedRegion, t)}
                            <span aria-hidden="true">⌄</span>
                        </button>

                        {isRegionMenuOpen && (
                            <ul
                                className="job-listings-region-menu"
                                role="listbox"
                                aria-label={t("jobListings.labels.region")}
                            >
                                {regionalSection.regionOptions.map((region) => (
                                    <li key={region}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={region === selectedRegion}
                                            onClick={() => {
                                                setSelectedRegion(region);
                                                setIsRegionMenuOpen(false);
                                            }}
                                        >
                                            {getLocalizedRegionName(region, t)}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                            </div>
                            <div className="job-listings-grid">
                        {regionalListings.map((listing) => (
                            <JobListingCard
                                key={listing.id}
                                listing={getLocalizedListing(listing, t)}
                                onDetailOpen={setSelectedListing}
                                t={t}
                            />
                        ))}
                            </div>
                        </section>
                    );
                })()}
            </>}

            <JobListingDetailModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
            />
        </div>
    );
}
