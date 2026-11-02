package com.example.forguide.notification.service;

import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import com.example.forguide.notification.dto.NotificationCreateCommand;
import com.example.forguide.notification.dto.NotificationResourceType;
import com.example.forguide.notification.dto.NotificationType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PopularPostNotificationScheduler {

    private static final int POPULAR_POST_LIMIT = 10;

    private final CommunityMapper communityMapper;
    private final NotificationService notificationService;

    public PopularPostNotificationScheduler(
            CommunityMapper communityMapper,
            NotificationService notificationService
    ) {
        this.communityMapper = communityMapper;
        this.notificationService = notificationService;
    }

    /*
        설정 파일의 popular-check-interval 주기마다 공감순,조회순 Top10을 조회한다.
        조회 작업만 하므로 이 메서드 자체에는 트랜잭션을 걸지 않는다.
     */
    @Scheduled(fixedDelayString = "${forguide.notification.popular-check-interval}")
    public void createPopularPostNotifications() {
        Map<Long, RankedPost> rankedPostsById = new HashMap<>();

        collectBetterRanks(
                communityMapper.findPopularPosts("likes", POPULAR_POST_LIMIT),
                rankedPostsById
        );

        collectBetterRanks(
                communityMapper.findPopularPosts("views", POPULAR_POST_LIMIT),
                rankedPostsById
        );

        rankedPostsById.values().forEach(
                this::createReachedRankNotifications
        );
    }

    /*
        같은 게시글이 공삼순 5위, 조회순 2위라면 더 높은 순위인 2위만 유지
     */
    private void collectBetterRanks(
            List<CommunityPostResponse> posts,
            Map<Long, RankedPost> rankedPostsById
    ) {
        for (int index = 0; index < posts.size(); index++) {
            CommunityPostResponse post = posts.get(index);
            int rankPosition = index + 1;

            rankedPostsById.merge(
                    post.getPostId(),
                    new RankedPost(
                            post.getPostId(),
                            post.getMemberId(),
                            rankPosition
                    ),
                    (current, candidate) -> current.rankPosition()
                            <= candidate.rankPosition()
                            ? current
                            : candidate
            );
        }
    }

    /*
     * 1위로 바로 진입한 게시글은 Top 10·3·2·1 알림을 모두 한 번씩 생성한다.
     * 같은 단계는 event key의 DB UNIQUE 제약조건으로 다음 점검부터 중복 생성되지 않는다.
     */
    private void createReachedRankNotifications(RankedPost post) {
        if (post.rankPosition() <= 10) {
            createRankNotification(
                    post,
                    NotificationType.POPULAR_TOP_10,
                    "top10"
            );
        }

        if (post.rankPosition() <= 3) {
            createRankNotification(
                    post,
                    NotificationType.POPULAR_TOP_3,
                    "top3"
            );
        }

        if (post.rankPosition() <= 2) {
            createRankNotification(
                    post,
                    NotificationType.POPULAR_TOP_2,
                    "top2"
            );
        }

        if (post.rankPosition() <= 1) {
            createRankNotification(
                    post,
                    NotificationType.POPULAR_TOP_1,
                    "top1"
            );
        }
    }

    private void createRankNotification(
            RankedPost post,
            NotificationType notificationType,
            String rankLevel
    ) {
        notificationService.createNotification(
                new NotificationCreateCommand(
                        post.memberId(),
                        null,
                        notificationType,
                        NotificationResourceType.COMMUNITY_POST,
                        post.postId(),
                        post.rankPosition(),
                        "popular:post:"
                                + post.postId()
                                + ":"
                                + rankLevel
                )
        );
    }

    // 공감순,조회순 중 더 높은 순위만 알림 생성 대상으로 남긴다.
    private record RankedPost(
            Long postId,
            Long memberId,
            int rankPosition
    ) {
    }
}
