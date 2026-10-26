package com.example.forguide.community.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class CommunityServiceTest {

    @Mock
    private CommunityMapper communityMapper;

    @InjectMocks
    private CommunityService communityService;

    @Test
    void 작성자_본인은_게시글을_삭제할_수_있다() {
        // Mockito 단위 테스트에서도 삭제 뒤 처리 등록에 필요한 동기화 상태를 준비한다.
        TransactionSynchronizationManager.initSynchronization();

        try {
            CommunityPostResponse post = postOf(1L);
            when(communityMapper.findPostById(10L)).thenReturn(post);
            when(communityMapper.deletePost(10L, 1L)).thenReturn(1);

            communityService.deletePost(10L, 1L);

            verify(communityMapper).deletePost(10L, 1L);
        } finally {
            // 다음 테스트에 현재 스레드의 동기화 상태가 남지 않게 정리한다.
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void 없는_게시글을_삭제하면_404_오류를_반환한다() {
        when(communityMapper.findPostById(10L)).thenReturn(null);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> communityService.deletePost(10L, 1L)
        );

        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
        verify(communityMapper, never()).deletePost(anyLong(), anyLong());
    }

    @Test
    void 다른_회원의_게시글을_삭제하면_403_오류를_반환한다() {
        when(communityMapper.findPostById(10L)).thenReturn(postOf(2L));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> communityService.deletePost(10L, 1L)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        verify(communityMapper, never()).deletePost(anyLong(), anyLong());
    }

    private CommunityPostResponse postOf(Long memberId) {
        CommunityPostResponse post = new CommunityPostResponse();
        post.setMemberId(memberId);
        return post;
    }
}
