import { client } from "../../api/client.js";
import consultationOptions from "./consultationOptions.json";

// 선택 목록은 즉시 보여 주고 기관 검색은 Elasticsearch API에서 처리한다.
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

// 검색과 정렬은 서버에서 처리하고 화면에서는 표시 형식만 맞춘다.
export async function getConsultationInstitutions(filters = {}) {
    // 전체 기관 보기에서만 MySQL 카드 API를 사용한다.
    const showAll = filters === null;
    filters = filters ?? {};
    const params = new URLSearchParams();

    for (const key of ["query", "topic", "province", "district", "language", "method"]) {
        const selected = value(filters[key]);
        if (selected) params.set(key, selected);
    }

    if (filters.keywords != null && !Array.isArray(filters.keywords)) {
        throw new Error("INVALID_INPUT");
    }

    for (const keyword of unique((filters.keywords ?? []).map(value).filter(Boolean))) {
        params.append("keywords", keyword);
    }

    const query = params.toString();
    const path = showAll
        ? "/consultation/institutions/cards"
        : `/consultation/institutions/search${query ? `?${query}` : ""}`;
    const result = await client.get(path);

    if (!Array.isArray(result?.items) || !Array.isArray(result?.filters?.keywords)) {
        throw new Error("INVALID_RESPONSE");
    }

    const institutionIds = new Set();
    const items = result.items.map((entry) => {
        const id = entry?.institution?.id;

        if (
            !Number.isSafeInteger(id) ||
            id < 1 ||
            institutionIds.has(id) ||
            !Array.isArray(entry.institution.services) ||
            !Array.isArray(entry.match?.keywords) ||
            !Array.isArray(entry.match?.unknown) ||
            entry.match.selectedCount !== result.filters.keywords.length
        ) {
            throw new Error("INVALID_RESPONSE");
        }

        institutionIds.add(id);
        const institution = normalizeInstitution(entry.institution);

        // 서버에서 고른 대표 업무도 0·1·NULL 정규화 후 화면에 전달한다.
        const preview = institution.services.find((service) => service.id === entry.preview?.id);

        if (!preview) throw new Error("INVALID_RESPONSE");

        return {
            ...institution,
            preview,
            match: entry.match,
        };
    });

    // Elasticsearch 결과를 기존 문자열 검색으로 다시 거르거나 순서를 바꾸지 않는다.
    return { items, filters: result.filters };
}

export async function getConsultationInstitution(id) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        throw new Error("INVALID_INPUT");
    }
    return normalizeInstitution(await client.get(`/consultation/institutions/${id}`));
}

// 검색 화면과 같은 6개 분야·18개 대표 키워드로 기관 안내를 구성한다.
// DB 원문과 검색용 업무는 지우지 않고, 화면에 반복되는 운영정보만 묶는다.
export function getInstitutionGuide(institution) {
    const services = normalizeInstitution(institution).services;
    const topicGroups = consultationOptions.topics.flatMap((group) => {
        const keywords = group.keywords.filter((keyword) => {
            const rule = group.rules[keyword];

            return services.some(
                (service) =>
                    rule.topics.includes(service.topic ?? null) &&
                    rule.terms.some((term) =>
                        service.keywords.some((actual) => fold(actual) === fold(term)),
                    ),
            );
        });

        return keywords.length ? [{ code: group.code, name: group.name, keywords }] : [];
    });

    const usageByContent = new Map();

    for (const service of services) {
        // 표시되는 조건이나 출처가 다르면 다른 이용 안내로 남긴다.
        const key = JSON.stringify({
            phone: service.phone,
            visit: service.visit,
            online: service.online,
            specialPhone: service.specialPhone,
            languages: service.languages,
            regions: service.regions,
            languageNotes: service.languageNotes,
            contactDescription: service.contactDescription,
            targetDescription: service.targetDescription,
            sourceUrl: service.sourceUrl,
        });

        if (!usageByContent.has(key)) {
            usageByContent.set(key, { id: service.id, service, labels: [] });
        }

        usageByContent.get(key).labels.push(service.summary);
    }

    return {
        topicGroups,
        keywords: unique(topicGroups.flatMap((group) => group.keywords)),
        // 분야를 묶더라도 실제 처리기관이나 상담 범위에 관한 설명은 보존한다.
        scopeNotes: unique(
            services
                .flatMap((service) => [
                    service.summary,
                    ...String(service.description ?? "").split(/\r?\n/),
                ])
                .map((text) => String(text ?? "").trim())
                .filter(Boolean),
        ),
        usageGroups: [...usageByContent.values()].map((group) => ({
            ...group,
            labels: unique(group.labels.filter(Boolean)),
        })),
    };
}

export function translateInstitutionText(id, field, targetLanguage) {
    return client.post(
        `/consultation/institutions/${id}/translation/${field}`,
        { targetLanguage },
    );
}
