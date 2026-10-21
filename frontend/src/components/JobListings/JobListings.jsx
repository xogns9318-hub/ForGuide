import { useEffect, useState } from "react";
import Banner from "../Banner/Banner.jsx";
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

function JobListingCard({ listing }) {
    return (
        <article className="job-listing-card">
            <div className="job-listing-card-heading">
                <ListingIcon type={listing.icon} />
                <div>
                    <h3>{listing.title}</h3>
                    <p>{listing.summary}</p>
                </div>
            </div>

            <dl className="job-listing-info">
                <div><dt>지원 언어</dt><dd>{listing.language}</dd></div>
                <div><dt>대상</dt><dd>{listing.target}</dd></div>
                <div><dt>제공 정보</dt><dd>{listing.information}</dd></div>
            </dl>

            <div className="job-listing-actions">
                {/* 상세 모달 연결은 다음 단계에서 직접 추가합니다. */}
                <button type="button" className="job-listing-action-button">
                    자세히 보기 <span aria-hidden="true">↗</span>
                </button>
                {/* 외부 공식 사이트 이동은 다음 단계에서 직접 추가합니다. */}
                <button type="button" className="job-listing-action-button">
                    사이트 바로가기 <span aria-hidden="true">↗</span>
                </button>
            </div>
        </article>
    );
}

export default function JobListings() {
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

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

    const regionalSection = sections.find((section) => section.id === "regional");
    const generalSections = sections.filter((section) => section.id !== "regional");

    return (
        <div className="page-stack job-listings-page">
            <Banner title="일자리 목록" description="나에게 맞는 취업 정보와 지원 기관을 찾아보세요." />
            <p className="job-listings-example-badge">예시 데이터</p>

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
                            {section.listings.map((listing) => <JobListingCard key={listing.id} listing={listing} />)}
                        </div>
                    </section>
                ))}

                {regionalSection && <section className="job-listings-section" aria-labelledby="regional-title">
                    <div className="job-listings-section-heading">
                        <h2 id="regional-title">{regionalSection.title}</h2>
                        <p>{regionalSection.description}</p>
                    </div>
                    <div className="job-listings-region-control">
                        <label htmlFor="job-listings-region">지역 선택</label>
                        {/* 실제 지역별 카드 필터링은 다음 단계에서 직접 연결합니다. */}
                        <select id="job-listings-region" defaultValue="서울">
                            <option value="서울">서울</option>
                            <option value="경기">경기</option>
                            <option value="인천">인천</option>
                            <option value="부산">부산</option>
                            <option value="대구">대구</option>
                            <option value="광주">광주</option>
                            <option value="대전">대전</option>
                            <option value="울산">울산</option>
                        </select>
                    </div>
                    <p className="job-listings-region-result">서울에서 이용할 수 있는 기관</p>
                    <div className="job-listings-grid">
                        {regionalSection.listings.map((listing) => <JobListingCard key={listing.id} listing={listing} />)}
                    </div>
                </section>}
            </>}
        </div>
    );
}
