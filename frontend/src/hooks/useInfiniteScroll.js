import { useEffect, useRef } from "react";

// 감시 대상이 화면 근처에 보이면 다음 목록을 요청한다.
export function useInfiniteScroll({
                                      enabled,
                                      onLoadMore,
                                      rootMargin = "180px",
                                  }) {
    const targetRef = useRef(null);
    const latestLoadMoreRef = useRef(onLoadMore);

    // 렌더링마다 최신 목록 요청 함수를 보관한다.
    useEffect(() => {
        latestLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        if (!enabled || !targetRef.current) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    latestLoadMoreRef.current();
                }
            },
            { rootMargin },
        );

        observer.observe(targetRef.current);

        return () => observer.disconnect();
    }, [enabled, rootMargin]);

    return targetRef;
}