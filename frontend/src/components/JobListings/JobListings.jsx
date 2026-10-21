import { useEffect, useRef, useState } from "react";
import Banner from "../Banner/Banner.jsx";
import JobListingDetailModal from "./JobListingDetailModal.jsx";
import { getJobListingSections } from "../../api/jobListingsApi.js";
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

function ListingIcon({ type }) {
    return (
        <span className="job-listing-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPaths[type]} />
            </svg>
        </span>
    );
}

function JobListingCard({ listing, onDetailOpen }) {
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
            <div className="job-listing-meta" aria-label="이용 정보 요약">
                <div className="job-listing-meta-item">
                    <span className="job-listing-meta-label">대상</span>
                    <span className="job-listing-meta-value">{listing.target}</span>
                </div>
                <div className="job-listing-meta-item">
                    <span className="job-listing-meta-label">언어</span>
                    <span className="job-listing-meta-value">{listing.language}</span>
                </div>
            </div>

            <div className="job-listing-actions">
                <button
                    type="button"
                    className="job-listing-action-button"
                    onClick={() => onDetailOpen(listing)}
                >
                    자세히 보기 <span aria-hidden="true">↗</span>
                </button>

                <a
                    className="job-listing-action-button"
                    href={listing.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${listing.title} 공식 사이트 새 탭에서 열기`}
                >
                    사이트 바로가기 <span aria-hidden="true">↗</span>
                </a>
            </div>
        </article>
    );
}

export default function JobListings() {
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
            <Banner title="일자리 목록" description="나에게 맞는 취업 정보와 지원 기관을 찾아보세요." />

            {isLoading && <p className="job-listings-state">기관 정보를 불러오는 중입니다.</p>}
            {loadError && <p className="job-listings-state">기관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}

            {!isLoading && !loadError && <>
                {generalSections.map((section) => (
                    <section key={section.id} className="job-listings-section" aria-labelledby={`${section.id}-title`}>
                        <div className="job-listings-section-heading">
                            <h2 id={`${section.id}-title`}>{section.title}</h2>
                            <p>{section.description}</p>
                        </div>
                        <div className="job-listings-grid">
                            {section.listings.map((listing) => (
                                <JobListingCard
                                    key={listing.id}
                                    listing={listing}
                                    onDetailOpen={setSelectedListing}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {regionalSection && <section className="job-listings-section" aria-labelledby="regional-title">
                    <div className="job-listings-section-heading">
                        <h2 id="regional-title">{regionalSection.title}</h2>
                        <p>{regionalSection.description}</p>
                    </div>
                    <div
                        ref={regionMenuRef}
                        className="job-listings-region-control"
                    >
                        <span id="job-listings-region-label">지역 선택</span>
                        <button
                            type="button"
                            className="job-listings-region-trigger"
                            aria-labelledby="job-listings-region-label"
                            aria-haspopup="listbox"
                            aria-expanded={isRegionMenuOpen}
                            onClick={() => setIsRegionMenuOpen((isOpen) => !isOpen)}
                        >
                            {selectedRegion}
                            <span aria-hidden="true">⌄</span>
                        </button>

                        {isRegionMenuOpen && (
                            <ul
                                className="job-listings-region-menu"
                                role="listbox"
                                aria-label="지역 선택"
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
                                            {region}
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
                                listing={listing}
                                onDetailOpen={setSelectedListing}
                            />
                        ))}
                    </div>
                </section>}
            </>}

            <JobListingDetailModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
            />
        </div>
    );
}
