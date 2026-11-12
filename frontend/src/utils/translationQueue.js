const MAX_CONCURRENT_TRANSLATIONS = 2;

let activeCount = 0;
const queuedTasks = [];
const cachedResults = new Map();
const pendingResults = new Map();

function runNext() {
    if (activeCount >= MAX_CONCURRENT_TRANSLATIONS || queuedTasks.length === 0) {
        return;
    }

    const task = queuedTasks.shift();
    activeCount += 1;

    task().finally(() => {
        activeCount -= 1;
        runNext();
    });
}

/**
 * 같은 화면에서 쏟아지는 LLM 번역 요청을 제한하고, 현재 브라우저 탭에서 얻은 결과는 재사용한다.
 * 개인정보가 포함될 수 있는 문의 내용도 브라우저 메모리에만 두며 저장소에는 기록하지 않는다.
 */
export function queueTranslation(cacheKey, request) {
    if (cachedResults.has(cacheKey)) {
        return Promise.resolve(cachedResults.get(cacheKey));
    }

    if (pendingResults.has(cacheKey)) {
        return pendingResults.get(cacheKey);
    }

    const result = new Promise((resolve, reject) => {
        queuedTasks.push(async () => {
            try {
                const response = await request();
                cachedResults.set(cacheKey, response);
                resolve(response);
            } catch (error) {
                reject(error);
            } finally {
                pendingResults.delete(cacheKey);
            }
        });
        runNext();
    });

    pendingResults.set(cacheKey, result);
    return result;
}
