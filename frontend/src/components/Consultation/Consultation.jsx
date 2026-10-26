import { useEffect, useState } from "react";
import SelectBox from "../SelectBox/SelectBox.jsx";
import { initialConsultationOptions, getConsultationOptions } from "../../api/consultationApi.js";
import "../../styles/consultation.css";
import { useTranslation } from "react-i18next";
import ConsultationResults from "./ConsultationResults.jsx";

// 문자열 목록을 공통 선택창이 사용하는 구조로 변환
function makeOptions(values = []) {
    return [{ value: "", label: "전체" }, ...values.map((value) => ({ value, label: value }))];
}

export default function Consultation() {
    const { t } = useTranslation();

    // 사용자가 입력 중인 기관명·상담 내용 검색어다.
    const [query, setQuery] = useState("");

    // 실제 조회에 사용할 확정 조건이다.
    // 처음에는 조건 없이 전체 기관을 조회한다.
    // 입력 중인 조건과 분리해 입력할 때마다 조회되지 않게 한다.
    const [requestedFilters, setRequestedFilters] = useState({});

    // 기관 결과 영역을 보여줄지 결정한다.
    // 처음에는 전체 기관을 보여주고, 조건이 바뀌면 숨긴다.
    const [resultsVisible, setResultsVisible] = useState(true);

    // 같은 조건으로 다시 안내받기를 눌러도 재조회하도록 사용한다.
    const [reloadKey, setReloadKey] = useState(0);

    // 선택 목록을 불러오는 상태와 재시도 횟수 관리
    // 첫 화면부터 선택창을 표시하도록 준비된 목록으로 시작한다.
    // 화면마다 복사본을 사용해 공통 원본 데이터를 보호한다.
    const [options, setOptions] = useState(() => structuredClone(initialConsultationOptions));
    const [isLoading, setIsLoading] = useState(true);
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

    // 안내받기를 눌렀을 때 선택한 조건을 확인 영역에 표시한다.
    const [confirmed, setConfirmed] = useState(null);

    function clearPreviousResult() {
        // 입력 조건이 바뀌면 이전 선택 조건 확인 내용을 지운다.
        setConfirmed(null);

        // 기관 목록과 상세 팝업도 함께 숨긴다.
        // 새 조건으로 안내받기를 누르기 전까지 자동 조회하지 않는다.
        setResultsVisible(false);
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
    const selectedTopic = options?.topics.find((item) => item.name === topic);

    // 선택한 시·도에 연결된 전체 하위 지역 확인
    const selectedRegion = options?.regions.find((item) => item.name === province);

    // 기존 공통 선택창에 전달할 목록 구성
    const provinceOptions = makeOptions(options?.regions.map((item) => item.name));
    const districtOptions = makeOptions(selectedRegion?.districts);
    const languageOptions = makeOptions(options?.languages);
    const methodOptions = makeOptions(options?.methods);

    // 검색어만 입력하거나 분야와 키워드를 함께 선택하면 조회할 수 있다.
    // 검색어는 API가 허용하는 최대 100자까지만 받는다.
    const canSubmit =
        query.trim().length <= 100 &&
        Boolean(query.trim() || (selectedTopic && keywords.length > 0));

    function handleTopicChange(value) {
        // 같은 분야를 다시 누르면 해제하고, 다른 분야를 누르면 교체한다.
        // 저장하는 값은 하나이므로 동시에 여러 분야가 선택되지는 않는다.
        setTopic((previous) => (previous === value ? "" : value));

        // 분야를 바꾸거나 해제하면 기존 키워드도 함께 초기화한다.
        setKeywords([]);

        // 이전 조건으로 만든 선택 확인 내용과 기관 결과를 숨긴다.
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
        // 폼을 제출해도 페이지 전체를 새로고침하지 않는다.
        event.preventDefault();

        // 검색어 또는 분야·키워드가 준비된 경우에만 조회한다.
        if (!canSubmit) return;

        // 입력 중인 상태를 복사해 이번 조회에 사용할 조건을 확정한다.
        // 이후 입력값이 바뀌어도 이 객체의 내용은 바뀌지 않는다.
        const filters = {
            topic,
            keywords: [...keywords],
            province,
            district,
            language,
            method,
            query: query.trim(),
        };

        // API에 전달하는 조건에는 빈 문자열을 그대로 사용한다.
        // 빈 문자열은 해당 조건으로 제한하지 않는다는 뜻이다.
        setRequestedFilters(filters);

        // 기존 선택 조건 확인 영역은 화면 표시용 문구로 유지한다.
        const all = t("institutionGuide.all");

        setConfirmed({
            ...filters,
            topic: topic || all,
            keywords: keywords.length ? [...keywords] : [all],
            province: province || all,
            district: district || all,
            language: language || all,
            method: method || all,
        });

        // 조건 변경으로 숨겨 두었던 결과 영역을 다시 표시한다.
        setResultsVisible(true);

        // 같은 조건으로 다시 제출해도 새로 조회하도록 갱신한다.
        setReloadKey((previous) => previous + 1);
    }

    function handleShowAll() {
        // 전체 기관 보기는 입력 조건과 검색어를 모두 초기화한다.
        setQuery("");
        setTopic("");
        setKeywords([]);
        setProvince("");
        setDistrict("");
        setLanguage("");
        setMethod("");

        // 이전 선택 조건 확인 영역을 지운다.
        setConfirmed(null);

        // 조건 없는 조회를 새로 실행한다.
        setRequestedFilters({});

        // 전체 기관 결과를 표시한다.
        setResultsVisible(true);

        // 이미 전체 목록을 보고 있더라도 다시 조회한다.
        setReloadKey((previous) => previous + 1);
    }

    return (
        <div className="page-stack">
            <section className="panel consultation-panel" aria-labelledby="consultation-title">
                <div className="consultation-heading">
                    <h2 id="consultation-title">어떤 상담이 필요하신가요?</h2>
                </div>

                {/* 선택 목록과 별개로 기관 결과는 실제 DB에서 조회한다. */}
                <p className="form-help consultation-notice">{t("institutionGuide.dbNotice")}</p>

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
                                onClick={() => setRetryCount((previous) => previous + 1)}
                            >
                                다시 불러오기
                            </button>
                        </div>
                    </div>
                ) : !options?.topics.length ? (
                    <p role="status">등록된 상담 분야가 없습니다.</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* 검색어 입력도 다른 선택 조건처럼 이전 결과를 즉시 숨긴다. */}
                        <div className="form-field consultation-group">
                            <label htmlFor="consultation-query">
                                {t("institutionGuide.searchLabel")}
                            </label>

                            <input
                                id="consultation-query"
                                type="search"
                                maxLength={100}
                                value={query}
                                placeholder={t("institutionGuide.searchPlaceholder")}
                                onChange={(event) => {
                                    // 검색창에 입력한 내용을 상태에 반영한다.
                                    setQuery(event.target.value);

                                    // 입력이 바뀌었으므로 이전 조건의 결과를 숨긴다.
                                    clearPreviousResult();
                                }}
                            />
                        </div>
                        {/* 해제 가능한 입력을 사용하되 선택 상태는 한 분야만 유지한다. */}
                        <fieldset className="consultation-group">
                            <legend>
                                {t("institutionGuide.topicLabel")}
                                {!query.trim() && t("institutionGuide.requiredSuffix")}
                            </legend>

                            <div className="consultation-choices">
                                {options.topics.map((item) => (
                                    <label key={item.name} className="consultation-choice">
                                        <input
                                            type="checkbox"
                                            name="consultation-topic"
                                            value={item.name}
                                            checked={topic === item.name}
                                            onChange={() => handleTopicChange(item.name)}
                                        />
                                        <span>
                                            {t(`institutionGuide.selectionLabels.${item.name}`)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* 선택한 분야의 대표 키워드 세 개를 표시하고 복수 선택한다. */}
                        <fieldset className="consultation-group">
                            <legend>
                                {t("institutionGuide.keywordLabel")}
                                {!query.trim() && t("institutionGuide.requiredSuffix")}
                                <small> {t("institutionGuide.multipleKeywords")}</small>
                            </legend>

                            {selectedTopic ? (
                                <div className="consultation-choices">
                                    {selectedTopic.keywords.map((keyword) => (
                                        <label key={keyword} className="consultation-choice">
                                            <input
                                                type="checkbox"
                                                name="consultation-keyword"
                                                value={keyword}
                                                checked={keywords.includes(keyword)}
                                                onChange={() => handleKeywordChange(keyword)}
                                            />
                                            <span>
                                                {t(`institutionGuide.selectionLabels.${keyword}`)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="form-help">
                                    {t("institutionGuide.chooseTopicFirst")}
                                </p>
                            )}
                        </fieldset>

                        {/* 지역·언어·상담 방식은 기존 공통 선택창 사용 */}
                        <div className="consultation-filters">
                            <div className="form-field">
                                <span id="consultation-province-label">희망 지역 · 시·도</span>
                                <SelectBox
                                    id="consultation-province"
                                    labelledBy="consultation-province-label"
                                    value={province}
                                    options={provinceOptions}
                                    onChange={handleProvinceChange}
                                />
                            </div>

                            <div className="form-field">
                                <span id="consultation-district-label">희망 지역 · 시·군·구</span>
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
                                <span id="consultation-language-label">상담 언어</span>
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
                                <span id="consultation-method-label">상담 방식</span>
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

                        {/* 검색어가 있으면 분야·키워드 선택 없이도 검색할 수 있다. */}
                        <p className="form-help consultation-required" aria-live="polite">
                            {query.trim()
                                ? t("institutionGuide.queryReady")
                                : !topic
                                  ? t("institutionGuide.chooseTopicAndKeywords")
                                  : keywords.length === 0
                                    ? t("institutionGuide.chooseKeywords")
                                    : t("institutionGuide.selectedKeywords", {
                                          count: keywords.length,
                                      })}
                        </p>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="button button-primary"
                                disabled={!canSubmit}
                            >
                                {t("institutionGuide.submit")}
                            </button>

                            {/* 전체 보기는 필수 선택 없이 실행할 수 있다. */}
                            <button type="button" className="button" onClick={handleShowAll}>
                                {t("institutionGuide.showAll")}
                            </button>
                        </div>

                        {/* 안내받기를 누르면 선택 조건만 확인 */}
                        <div aria-live="polite">
                            {confirmed && (
                                <section className="consultation-summary">
                                    <h3>선택한 상담 조건</h3>
                                    <p className="form-help">
                                        조건을 변경하면 이전 결과가 숨겨집니다. 안내받기를 눌러 다시
                                        확인해주세요.
                                    </p>

                                    <dl>
                                        <div>
                                            <dt>{t("institutionGuide.topicLabel")}</dt>
                                            <dd>
                                                {t(
                                                    `institutionGuide.selectionLabels.${confirmed.topic}`,
                                                    { defaultValue: confirmed.topic },
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>{t("institutionGuide.keywordLabel")}</dt>
                                            <dd>
                                                {confirmed.keywords
                                                    .map((keyword) =>
                                                        t(
                                                            `institutionGuide.selectionLabels.${keyword}`,
                                                            { defaultValue: keyword },
                                                        ),
                                                    )
                                                    .join(", ")}
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

            {/* 확정 조건으로 DB 기관 목록을 조회한다. */}
            {/* 조건이 바뀌면 visible이 false가 되어 이전 결과를 숨긴다. */}
            <ConsultationResults
                filters={requestedFilters}
                visible={resultsVisible}
                reloadKey={reloadKey}
            />
        </div>
    );
}
