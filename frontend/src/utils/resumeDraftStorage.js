const RESUME_DRAFT_STORAGE_PREFIX = "forguide:resume-draft:";
const RESUME_DRAFT_DATABASE = "forguide-resume-drafts";
const RESUME_DRAFT_PHOTO_STORE = "temporary-photos";
const RESUME_DRAFT_PHOTO_KEY_PREFIX = "forguide:resume-photo:";

function getResumeDraftPhotoKey(memberId) {
    return `${RESUME_DRAFT_PHOTO_KEY_PREFIX}${memberId}`;
}

function openResumeDraftDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(RESUME_DRAFT_DATABASE, 1);

        request.onupgradeneeded = () => {
            const database = request.result;

            if(!database.objectStoreNames.contains(
                RESUME_DRAFT_PHOTO_STORE,
            )) {
                database.createObjectStore(RESUME_DRAFT_PHOTO_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getResumeDraftStorageKey(memberId) {
    return `${RESUME_DRAFT_STORAGE_PREFIX}${memberId}`;
}

// 같은 로그인 세션에서 새로고침한 경우에만 작성 중 이력서를 복원한다.
export function readResumeTemporaryDraft(memberId) {
    try {
        const savedDraft = sessionStorage.getItem(
            getResumeDraftStorageKey(memberId),
        );

        return savedDraft ? JSON.parse(savedDraft) : null;
    } catch {
        return null;
    }
}

// 확정 저장 전 입력값과 활성 탭만 브라우저 세션에 보관한다.
export function writeResumeTemporaryDraft(memberId, draft) {
    try {
        sessionStorage.setItem(
            getResumeDraftStorageKey(memberId),
            JSON.stringify(draft),
        );
    } catch {
        // 저장소를 쓸 수 없어도 작성 화면 자체는 계속 사용할 수 있다.
    }
}

// 로그아웃하면 작성 중 임시본도 제거해 다음 로그인에 노출되지 않게 한다.
export function clearResumeTemporaryDraft(memberId) {
    try {
        sessionStorage.removeItem(getResumeDraftStorageKey(memberId));
    } catch {
        // 임시본 삭제 실패가 로그아웃 자체를 막지 않는다.
    }

    void clearResumeTemporaryPhoto(memberId);
}

// 저장 전 선택한 사진 파일을 현재 로그인 회원의 브라우저에 보관
export async function writeResumeTemporaryPhoto(memberId, photoFile) {
    const database = await openResumeDraftDatabase();

    try {
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(
                RESUME_DRAFT_PHOTO_STORE,
                "readwrite",
            );

            transaction.objectStore(RESUME_DRAFT_PHOTO_STORE).put(
                photoFile,
                getResumeDraftPhotoKey(memberId),
            );

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        database.close();
    }
}

// 새로고침 뒤에도 선택 전 사진을 다시 미리보기로 만들 수 있게 읽는다.
export async function readResumeTemporaryPhoto(memberId) {
    const database = await openResumeDraftDatabase();

    try {
        return await new Promise((resolve, reject) => {
            let photoFile = null;

            const transaction = database.transaction(
                RESUME_DRAFT_PHOTO_STORE,
                "readonly",
            );

            const request = transaction
                .objectStore(RESUME_DRAFT_PHOTO_STORE)
                .get(getResumeDraftPhotoKey(memberId));

            request.onsuccess = () => {
                photoFile = request.result ?? null;
            };

            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => resolve(photoFile);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        database.close();
    }
}

// 새 사진 저장 성공·사진 삭제·로그아웃 때 임시 사진도 함께 지운다.
export async function clearResumeTemporaryPhoto(memberId) {
    const database = await openResumeDraftDatabase();

    try {
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(
                RESUME_DRAFT_PHOTO_STORE,
                "readwrite",
            );

            transaction.objectStore(RESUME_DRAFT_PHOTO_STORE).delete(
                getResumeDraftPhotoKey(memberId),
            );

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        database.close();
    }
}
