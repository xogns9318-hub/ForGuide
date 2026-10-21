import { useEffect, useState } from "react";
import Banner from "../Banner/Banner.jsx";
import SelectBox from "../SelectBox/SelectBox.jsx";
import { categories } from "../../routes/routeConfig.js";
import {
    initialConsultationOptions,
    getConsultationOptions,
} from "../../api/consultationApi.js"; import "../../styles/consultation.css";

// 기존 경로 설정에서 배너 제목과 설명을 가져옴
const consultationRoute = categories
    .flatMap((category) => category.children)
    .find((item) => item.id === "consultation");

// 문자열 목록을 공통 선택창이 사용하는 구조로 변환
function makeOptions(values = []) {
    return [
        { value: "", label: "전체" },
        ...values.map((value) => ({ value, label: value })),
    ];
}

export default function Consultation() {
    // 선택 목록을 불러오는 상태와 재시도 횟수 관리
    // 첫 화면부터 선택창을 표시하도록 준비된 목록으로 시작한다.
    // 화면마다 복사본을 사용해 공통 원본 데이터를 보호한다.
    const [options, setOptions] = useState(() =>
        structuredClone(initialConsultationOptions),
    ); const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    // 상담 분야는 하나, 키워드는 여러 개 선택
    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState([]);

    // 부가 조건의 빈 문자열은 전체를 의미
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [language, setLanguage] = useState("");
    const [method, setMethod] = useState("");

    // 안내받기를 눌러 확정한 조건을 별도로 보관
    const [confirmed, setConfirmed] = useState(null);
    // 입력 조건이 달라지면 이전 조회 결과는 더 이상 유효하지 않다.
    // 현재 화면에서는 confirmed가 결과 표시 여부를 결정한다.
    // 값을 null로 바꾸면 이전 조건 확인 영역이 즉시 사라진다.
    function clearPreviousResult() {
        // 사용자가 안내받기를 다시 누를 때까지 이전 결과를 숨긴다.
        setConfirmed(null);
    }

    useEffect(() => {
        // 화면을 떠난 뒤 완료된 요청이 상태를 바꾸지 않도록 처리
        let active = true;

        async function loadOptions() {
            setIsLoading(true);
            setLoadError("");

            try {
                // 선택 목록은 API 함수를 통해 가져옴
                const data = await getConsultationOptions();

                if (active) {
                    setOptions(data);
                }
            } catch {
                if (active) {
                    setLoadError("선택 항목을 불러오지 못했습니다.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        loadOptions();

        return () => {
            active = false;
        };
    }, [retryCount]);

    // 선택한 상담 분야에 연결된 전체 키워드 확인
    const selectedTopic = options?.topics.find(
        (item) => item.name === topic,
    );

    // 선택한 시·도에 연결된 전체 하위 지역 확인
    const selectedRegion = options?.regions.find(
        (item) => item.name === province,
    );

    // 기존 공통 선택창에 전달할 목록 구성
    const provinceOptions = makeOptions(
        options?.regions.map((item) => item.name),
    );
    const districtOptions = makeOptions(selectedRegion?.districts);
    const languageOptions = makeOptions(options?.languages);
    const methodOptions = makeOptions(options?.methods);

    // 상담 분야와 키워드가 있어야 안내받기 활성화
    const canSubmit = Boolean(selectedTopic && keywords.length > 0);

    function handleTopicChange(value) {
        // 현재 선택과 같은 분야라면 조건이 바뀐 것이 아니다.
        // 불필요하게 키워드와 결과를 초기화하지 않는다.
        if (topic === value) {
            return;
        }

        // 새 분야를 현재 선택값으로 반영한다.
        setTopic(value);

        // 이전 분야에서 선택한 키워드를 새 분야에 그대로 사용하지 않는다.
        // 분야마다 선택할 수 있는 키워드가 다르기 때문이다.
        setKeywords([]);

        // 이전 결과는 이전 분야와 키워드로 만든 결과다.
        // 새 조건으로 다시 안내받기 전까지 숨긴다.
        clearPreviousResult();
    }

    function handleKeywordChange(keyword) {
        // 현재 선택 목록을 기준으로 다음 선택 목록을 만든다.
        // 이미 선택한 키워드를 다시 누르면 선택을 해제한다.
        // 선택하지 않은 키워드라면 기존 목록에 추가한다.
        setKeywords((previous) =>
            previous.includes(keyword)
                ? previous.filter((item) => item !== keyword)
                : [...previous, keyword],
        );

        // 키워드를 추가하거나 해제하면 검색 조건이 달라진다.
        // 이전 조건으로 표시한 결과는 바로 숨긴다.
        clearPreviousResult();
    }

    function handleProvinceChange(value) {
        // 같은 시·도를 다시 선택한 경우에는 기존 상태를 유지한다.
        if (province === value) {
            return;
        }

        // 새 시·도를 현재 선택값으로 반영한다.
        setProvince(value);

        // 이전 시·도에 속한 시·군·구가 남지 않도록 초기화한다.
        // 빈 문자열은 기존 선택창에서 '전체'를 의미한다.
        setDistrict("");

        // 지역이 달라졌으므로 이전 결과를 숨긴다.
        clearPreviousResult();
    }

    function handleDistrictChange(value) {
        // 같은 시·군·구를 다시 선택하면 기존 결과를 유지한다.
        if (district === value) {
            return;
        }

        // 변경한 하위 지역을 반영한다.
        setDistrict(value);

        // 이전 지역 조건의 결과를 숨긴다.
        clearPreviousResult();
    }

    function handleLanguageChange(value) {
        // 같은 언어를 다시 선택하면 조건이 바뀌지 않은 것이다.
        if (language === value) {
            return;
        }

        // 새 상담 언어를 반영한다.
        setLanguage(value);

        // 다른 언어 조건으로 조회한 이전 결과를 숨긴다.
        clearPreviousResult();
    }

    function handleMethodChange(value) {
        // 같은 상담 방식을 다시 선택하면 기존 상태를 유지한다.
        if (method === value) {
            return;
        }

        // 새 상담 방식을 반영한다.
        setMethod(value);

        // 이전 상담 방식으로 만든 결과를 숨긴다.
        clearPreviousResult();
    }

    function handleSubmit(event) {
        // 폼 제출에 따른 페이지 새로고침 방지
        event.preventDefault();

        // 필수 항목이 없으면 확인 내용을 만들지 않음
        if (!canSubmit) return;

        // 실제 기관을 조회하지 않고 현재 선택 조건만 표시
        setConfirmed({
            topic,
            keywords: [...keywords],
            province: province || "전체",
            district: district || "전체",
            language: language || "전체",
            method: method || "전체",
        });
    }

    return (
        <div className="page-stack">
            {/* 기존 공통 배너 유지 */}
            <Banner
                title={consultationRoute.label}
                description={consultationRoute.description}
            />

            <section
                className="panel consultation-panel"
                aria-labelledby="consultation-title"
            >
                <div className="consultation-heading">
                    <h2 id="consultation-title">
                        어떤 상담이 필요하신가요?
                    </h2>
                </div>

                {/* 선택 목록과 실제 기관 조회를 구분해서 안내 */}
                <p className="form-help consultation-notice">
                    초안의 전체 선택 항목을 사용합니다.
                    실제 기관 조회는 아직 연결하지 않았습니다.
                </p>

                {/* 표시할 목록이 이미 있으면 조회 중에도 선택창을 계속 보여준다. */}
                {isLoading && !options ? null : loadError ? (
                    <div>
                        {/* 목록을 불러오지 못하면 재시도 제공 */}
                        <p className="form-error" role="alert">
                            {loadError}
                        </p>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="button"
                                onClick={() =>
                                    setRetryCount((previous) => previous + 1)
                                }
                            >
                                다시 불러오기
                            </button>
                        </div>
                    </div>
                ) : !options?.topics.length ? (
                    <p role="status">등록된 상담 분야가 없습니다.</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* 상담 분야는 라디오 입력으로 하나만 선택 */}
                        <fieldset className="consultation-group">
                            <legend>상담 분야 · 필수</legend>

                            <div className="consultation-choices">
                                {options.topics.map((item) => (
                                    <label
                                        key={item.name}
                                        className="consultation-choice"
                                    >
                                        <input
                                            type="radio"
                                            name="consultation-topic"
                                            value={item.name}
                                            checked={topic === item.name}
                                            onChange={() =>
                                                handleTopicChange(item.name)
                                            }
                                            required
                                        />
                                        <span>{item.name}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* 선택한 분야의 전체 키워드를 표시하고 복수 선택 */}
                        <fieldset className="consultation-group">
                            <legend>
                                상담 키워드 · 필수
                                <small> (여러 개 선택 가능)</small>
                            </legend>

                            {selectedTopic ? (
                                <div className="consultation-choices">
                                    {selectedTopic.keywords.map((keyword) => (
                                        <label
                                            key={keyword}
                                            className="consultation-choice"
                                        >
                                            <input
                                                type="checkbox"
                                                name="consultation-keyword"
                                                value={keyword}
                                                checked={keywords.includes(keyword)}
                                                onChange={() =>
                                                    handleKeywordChange(keyword)
                                                }
                                            />
                                            <span>{keyword}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="form-help">
                                    상담 분야를 먼저 선택해주세요.
                                </p>
                            )}
                        </fieldset>

                        {/* 지역·언어·상담 방식은 기존 공통 선택창 사용 */}
                        <div className="consultation-filters">
                            <div className="form-field">
                                <span id="consultation-province-label">
                                    희망 지역 · 시·도
                                </span>
                                <SelectBox
                                    id="consultation-province"
                                    labelledBy="consultation-province-label"
                                    value={province}
                                    options={provinceOptions}
                                    onChange={handleProvinceChange}
                                />
                            </div>

                            <div className="form-field">
                                <span id="consultation-district-label">
                                    희망 지역 · 시·군·구
                                </span>
                                <SelectBox
                                    // 시·도 변경 시 열린 목록 상태도 초기화
                                    key={province}
                                    id="consultation-district"
                                    labelledBy="consultation-district-label"
                                    value={district}
                                    options={districtOptions}
                                    // 지역 변경과 이전 결과 숨김을 함께 처리한다.
                                    onChange={handleDistrictChange}
                                />
                            </div>

                            <div className="form-field">
                                <span id="consultation-language-label">
                                    상담 언어
                                </span>
                                <SelectBox
                                    id="consultation-language"
                                    labelledBy="consultation-language-label"
                                    value={language}
                                    options={languageOptions}
                                    // 언어 변경과 이전 결과 숨김을 함께 처리한다.
                                    onChange={handleLanguageChange}
                                />
                            </div>

                            <div className="form-field">
                                <span id="consultation-method-label">
                                    상담 방식
                                </span>
                                <SelectBox
                                    id="consultation-method"
                                    labelledBy="consultation-method-label"
                                    value={method}
                                    options={methodOptions}
                                    // 상담 방식 변경과 이전 결과 숨김을 함께 처리한다.
                                    onChange={handleMethodChange}
                                />
                            </div>
                        </div>

                        {/* 필수 선택 상태에 따라 안내 문구와 버튼 상태 변경 */}
                        <p
                            className="form-help consultation-required"
                            aria-live="polite"
                        >
                            {!topic
                                ? "상담 분야와 키워드를 선택해주세요."
                                : keywords.length === 0
                                    ? "상담 키워드를 한 개 이상 선택해주세요."
                                    : `키워드 ${keywords.length}개 선택됨`}
                        </p>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="button button-primary"
                                disabled={!canSubmit}
                            >
                                안내받기
                            </button>
                        </div>

                        {/* 안내받기를 누르면 선택 조건만 확인 */}
                        <div aria-live="polite">
                            {confirmed && (
                                <section className="consultation-summary">
                                    <h3>선택한 상담 조건</h3>
                                    <p className="form-help">
                                        조건을 변경하면 이전 결과가 숨겨집니다.
                                        안내받기를 눌러 다시 확인해주세요.
                                    </p>

                                    <dl>
                                        <div>
                                            <dt>상담 분야</dt>
                                            <dd>{confirmed.topic}</dd>
                                        </div>
                                        <div>
                                            <dt>상담 키워드</dt>
                                            <dd>
                                                {confirmed.keywords.join(", ")}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>희망 지역</dt>
                                            <dd>
                                                {confirmed.province}
                                                {" / "}
                                                {confirmed.district}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>상담 언어</dt>
                                            <dd>{confirmed.language}</dd>
                                        </div>
                                        <div>
                                            <dt>상담 방식</dt>
                                            <dd>{confirmed.method}</dd>
                                        </div>
                                    </dl>
                                </section>
                            )}
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}