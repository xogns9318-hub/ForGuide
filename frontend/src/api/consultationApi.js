import { client } from "./client.js";
import consultationOptions from "./consultationOptions.json";

// 선택 목록은 즉시 보여 주고 기관 자료는 실제 DB API에서 읽는다.
export const initialConsultationOptions = structuredClone(consultationOptions);

// 기존 선택 목록 호출부와의 호환을 유지한다.
export async function getConsultationOptions() {
    // MOCK: 선택 목록을 위한 기존 초안이다.
    // 실제 기관 데이터에는 이 지연이나 mock 자료를 사용하지 않는다.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return structuredClone(consultationOptions);
}

export const TOPIC_LABELS = {
    bank: "계좌·은행",
    loan: "대출",
    repayment: "채무·상환",
    credit: "신용관리",
    living: "생활비·지출",
    wages: "급여·임금",
    employment_contract: "근로계약·근무조건",
    retirement: "퇴직·퇴직금",
    employment: "취업·구직",
    remittance: "송금·이체",
    payment: "카드·결제",
    housing: "주거비",
    tax: "세금",
    insurance: "보험·사회보장",
    fraud: "금융사기·피해",
    financial_support: "금융지원·복지",
    financial_information: "금융정보·기초상담",
};

// 띄어쓰기·문장부호 차이만 정규화하고 원본 키워드는 보존한다.
const fold = (input) =>
    String(input ?? "")
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase();

const value = (input) => (input === "전체" ? "" : String(input ?? "").trim());

const unique = (items) => [...new Set(items)];

const flag = (input) =>
    input === 1 || input === true ? true : input === 0 || input === false ? false : null;

const roles = { direct: 0, related: 1, unknown: 2 };

// 일상 표현을 실제 상담 키워드로 보완한다.
// 원래 키워드를 삭제하거나 무관한 상담 분야를 추가하지 않는다.
const aliases = {
    임금체불: ["임금 체불"],
    월급을못받음: ["임금 체불"],
    월급못받음: ["임금 체불"],
    퇴직금을못받음: ["퇴직금 미지급"],
    통장만들기: ["통장 개설"],
    돈보내기: ["송금"],
    대출이자: ["대출 금리", "이자"],
    카드값연체: ["카드 연체"],
    빚갚기: ["채무 상환"],
    신용등급: ["신용점수"],
};

const terms = (input) => unique([fold(input), ...(aliases[fold(input)] ?? []).map(fold)]);

// DB의 0·1·NULL을 true·false·null로 통일한다.
// 미확인을 false로 바꾸지 않는다.
export function normalizeInstitution(item) {
    return {
        ...item,
        aliases: item.aliases ?? [],
        featuredKeywords: item.featuredKeywords ?? [],
        additionalPhones: item.additionalPhones ?? [],
        sourceUrls: unique((item.sourceUrls ?? []).filter(Boolean)),
        services: (item.services ?? [])
            .map((service) => ({
                ...service,
                keywords: service.keywords ?? [],
                languages: service.languages ?? [],
                regions: service.regions ?? [],
                phone: {
                    ...service.phone,
                    available: flag(service.phone?.available),
                    weekend: flag(service.phone?.weekend),
                    holiday: flag(service.phone?.holiday),
                },
                visit: {
                    ...service.visit,
                    available: flag(service.visit?.available),
                    weekend: flag(service.visit?.weekend),
                    holiday: flag(service.visit?.holiday),
                    reservationAvailable: flag(service.visit?.reservationAvailable),
                    reservationRequired: flag(service.visit?.reservationRequired),
                },
                online: {
                    ...service.online,
                    available: flag(service.online?.available),
                },
                specialPhone: {
                    ...service.specialPhone,
                    weekend: flag(service.specialPhone?.weekend),
                    holiday: flag(service.specialPhone?.holiday),
                },
            }))
            .sort((a, b) => a.id - b.id),
    };
}

// 언어·지역·방식을 같은 상담 채널 안에서 평가한다.
// 전화가 전국이라고 방문 장소까지 전국으로 처리하지 않는다.
function channelMatch(service, channel, filters) {
    const information = service[channel];

    if (information?.available === false) return null;

    const unknown = [];

    if (information?.available == null) {
        unknown.push("method");
    }

    if (filters.method === "reservation") {
        if (service.visit.reservationAvailable === false) {
            return null;
        }

        if (service.visit.reservationAvailable == null) {
            unknown.push("method");
        }
    }

    if (filters.language) {
        const supported = service.languages.some(
            (language) =>
                language.method === channel && fold(language.code) === fold(filters.language),
        );

        // 목록에 없다고 미지원이라고 단정하지 않는다.
        if (!supported) unknown.push("language");
    }

    if (filters.province) {
        const nationwide = channel === "phone" && service.phone.regionStatus === "unrestricted";

        const locations = service.regions.filter((region) => region.method === channel);

        if (!nationwide) {
            if (!locations.length) {
                unknown.push("region");
            } else {
                const provinceLocations = locations.filter(
                    (region) => region.province === filters.province,
                );

                if (!provinceLocations.length) return null;

                if (
                    filters.district &&
                    !provinceLocations.some((region) => region.district === filters.district)
                ) {
                    if (provinceLocations.some((region) => !region.district)) {
                        unknown.push("region");
                    } else {
                        return null;
                    }
                }
            }
        }
    }

    return {
        channel,
        unknown: unique(unknown),
    };
}

// 분야 AND 키워드 OR AND 검색어 조건을 적용한다.
// 같은 기관이 여러 업무에 해당해도 기관 카드는 한 번만 반환한다.
export function filterInstitutions(data, input = {}) {
    const topicValue = value(input.topic);

    // 화면의 6개 분야는 기존 DB 분야 코드를 묶는 선택 그룹이다.
    // 이전 분야 코드로 전달된 조건도 계속 처리한다.
    const group = consultationOptions.topics.find(
        (item) => item.code === topicValue || item.name === topicValue,
    );

    const topic =
        group?.name ??
        Object.keys(TOPIC_LABELS).find(
            (code) => code === topicValue || TOPIC_LABELS[code] === topicValue,
        ) ??
        "";

    if (topicValue && !topic) {
        throw new Error("INVALID_INPUT");
    }

    const methodValues = {
        전화: "phone",
        방문: "visit",
        예약: "reservation",
        모름: "",
    };

    const rawMethod = value(input.method);
    const method = methodValues[rawMethod] ?? rawMethod;

    if (!["", "phone", "visit", "reservation"].includes(method)) {
        throw new Error("INVALID_INPUT");
    }

    const keywords = unique((input.keywords ?? []).map(value).filter(Boolean));
    // 선택한 분야에 속하지 않는 대표 키워드는 조회 조건으로 받지 않는다.
    if (group && keywords.some((keyword) => !group.keywords.includes(keyword))) {
        throw new Error("INVALID_INPUT");
    }

    const filters = {
        topic,
        keywords,
        method,
        query: value(input.query),
        province: value(input.province),
        district: value(input.district),
        language: value(input.language),
    };

    if (filters.query.length > 100 || keywords.length > 50) {
        throw new Error("INVALID_INPUT");
    }

    const queryTerms = filters.query ? terms(filters.query).filter(Boolean) : [];
    // 입력은 있지만 기호를 제외한 검색 내용이 없으면 잘못된 입력이다.
    // 검색 조건이 없는 전체 조회로 바뀌지 않도록 막는다.
    if (filters.query && queryTerms.length === 0) {
        throw new Error("INVALID_INPUT");
    }

    const channels =
        method === "reservation" ? ["visit"] : method ? [method] : ["phone", "visit", "online"];

    const items = data.map(normalizeInstitution).flatMap((institution) => {
        // 새 조사 자료의 대표 상담 키워드도 검색어로 찾을 수 있게 한다.
        // 분야별 선택 키워드 일치 계산은 기존 업무 연결을 사용한다.
        const institutionText = [
            institution.name,
            institution.phone,
            ...institution.aliases,
            ...institution.featuredKeywords,
        ].map(fold);

        const candidates = institution.services.flatMap((service) => {
            // 대표 키워드는 같은 상담 업무의 분야·세부 키워드로 확인한다.
            // 기관 전체의 키워드를 모든 업무에 복사해 일치율을 높이지 않는다.
            const matchesRule = (rule) => {
                if (!rule || !rule.topics.includes(service.topic ?? null)) {
                    return false;
                }

                return rule.terms.some((term) =>
                    service.keywords.some((actual) => fold(actual) === fold(term)),
                );
            };

            if (group) {
                if (!Object.values(group.rules).some(matchesRule)) {
                    return [];
                }
            } else if (topic && service.topic !== topic) {
                return [];
            }

            // 대표 항목 하나는 세부 표현이 여러 개 맞아도 한 번만 센다.
            const matched = keywords.filter((keyword) =>
                group
                    ? matchesRule(group.rules[keyword])
                    : terms(keyword).some((term) =>
                          service.keywords.some((actual) => fold(actual) === term),
                      ),
            );

            if (keywords.length && !matched.length) {
                return [];
            }

            const searchable = [
                ...institutionText,
                TOPIC_LABELS[service.topic],
                service.summary,
                ...service.keywords,
            ].map(fold);

            if (
                queryTerms.length &&
                !queryTerms.some((term) => searchable.some((text) => text.includes(term)))
            ) {
                return [];
            }

            const channelMatches = channels
                .map((channel) => channelMatch(service, channel, filters))
                .filter(Boolean)
                .sort((a, b) => a.unknown.length - b.unknown.length);

            if (!channelMatches.length) return [];

            return [
                {
                    service,
                    matched,
                    ...channelMatches[0],
                },
            ];
        });

        if (!candidates.length) return [];

        candidates.sort(
            (a, b) =>
                (roles[a.service.role] ?? 2) - (roles[b.service.role] ?? 2) ||
                b.matched.length - a.matched.length ||
                a.unknown.length - b.unknown.length ||
                a.service.id - b.service.id,
        );

        const matchedKeywords = unique(candidates.flatMap((candidate) => candidate.matched));

        return [
            {
                ...institution,
                preview: candidates[0].service,
                match: {
                    role: candidates[0].service.role,
                    keywords: matchedKeywords,
                    selectedCount: keywords.length,
                    percent: keywords.length
                        ? Math.round((matchedKeywords.length / keywords.length) * 100)
                        : null,
                    unknown: candidates[0].unknown,
                },
            },
        ];
    });

    // 직접 상담 → 일치 개수 → 미확인 조건 수 → 기관 ID 순이다.
    // 같은 입력이면 같은 순서를 반환한다.
    items.sort(
        (a, b) =>
            (roles[a.match.role] ?? 2) - (roles[b.match.role] ?? 2) ||
            b.match.keywords.length - a.match.keywords.length ||
            a.match.unknown.length - b.match.unknown.length ||
            a.id - b.id,
    );

    return { items, filters };
}

// 공통 client가 토큰·오류·시간 초과를 처리한다.
// 연결 실패를 mock 기관이나 빈 결과로 바꾸지 않는다.
export async function getConsultationInstitutions(filters = {}) {
    const institutions = await client.get("/consultation/institutions");

    if (!Array.isArray(institutions)) {
        throw new Error("INVALID_RESPONSE");
    }

    return filterInstitutions(institutions, filters);
}

export async function getConsultationInstitution(id) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        throw new Error("INVALID_INPUT");
    }

    return normalizeInstitution(await client.get(`/consultation/institutions/${id}`));
}
