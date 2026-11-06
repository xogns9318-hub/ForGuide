import { client } from "../../api/client.js";
import { ApiError } from "../../api/apiError.js";

// 직접 작성한 상세 내용만 보내며 이름·성·생년월일은 요청에 포함하지 않는다.
export async function translatePreparationDetails(sourceText) {
    if (typeof sourceText !== "string" || !sourceText.trim() || sourceText.length > 300) {
        throw new ApiError("INVALID_INPUT", "번역할 상담 내용을 확인해주세요.");
    }

    const data = await client.post(
        "/consultation/preparation-card/translation",
        { sourceText },
        { timeoutMs: 35_000 },
    );

    if (typeof data?.translatedText !== "string" || !data.translatedText.trim()) {
        throw new ApiError("INVALID_RESPONSE", "번역 결과를 받지 못했습니다.");
    }

    // 원문·번역문을 저장소에 기록하지 않고 호출한 화면으로만 돌려준다.
    return data.translatedText;
}
