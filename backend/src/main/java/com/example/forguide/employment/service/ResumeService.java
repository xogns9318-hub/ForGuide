package com.example.forguide.employment.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.employment.dto.ResumeResponse;
import com.example.forguide.employment.image.ResumeImageStorage;
import com.example.forguide.employment.mapper.ResumeMapper;
import com.example.forguide.employment.dto.ResumeSaveRequest;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.service.TranslationService;
import tools.jackson.databind.ObjectMapper;
import com.example.forguide.common.transaction.AfterCommitExecutor;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.nio.file.Path;

@Service
public class ResumeService {

    private final ResumeMapper resumeMapper;
    private final ResumeImageStorage resumeImageStorage;
    private final ObjectMapper objectMapper;
    private final TranslationService translationService;
    private final AfterCommitExecutor afterCommitExecutor;

    public ResumeService(
            ResumeMapper resumeMapper,
            ResumeImageStorage resumeImageStorage,
            ObjectMapper objectMapper,
            TranslationService translationService,
            AfterCommitExecutor afterCommitExecutor
    ) {
        this.resumeMapper = resumeMapper;
        this.resumeImageStorage = resumeImageStorage;
        this.objectMapper = objectMapper;
        this.translationService = translationService;
        this.afterCommitExecutor = afterCommitExecutor;
    }

    // 로그인한 회원의 일반·블라인드 이력서 목록만 조회
    public List<ResumeResponse> getMyResumes(Long memberId) {
        requireLogin(memberId);
        return resumeMapper.findByMemberId(memberId);
    }

    /*
        이력서의 한 입력값을 한국어 초안으로 번역한다.
        개인정보가 포함될 수 있으므로 Redis 캐시를 사용하지 않는다.
     */

    @Transactional(propagation =  Propagation.NOT_SUPPORTED)
    public TranslationResponse translateMyResumeText(
            Long memberId,
            TranslationRequest request
    ) {
        requireLogin(memberId);

        if (!"ko".equals(request.getTargetLanguage())) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "이력서 번역은 한국어로만 요청할 수 있습니다."
            );
        }

        return translationService.translatePrivateText(request);
    }

    // 로그인한 회원이 작성한 이력서의 증명사진만 조회
    public Path getMyResumePhoto(Long memberId, Long resumeId) {
        ResumeResponse resume = getMyResume(memberId, resumeId);

        Path photoPath = resumeImageStorage.findOwnedFile(
                resume.getPhotoUrl()
        );

        if (photoPath == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "등록된 이력서 사진을 찾을 수 없습니다."
            );
        }

        return photoPath;
    }

    // DB 연결을 먼저 지운 뒤, 커밋이 끝난 경우에만 실제 사진 파일을 삭제한다.
    @Transactional
    public void deleteMyResumePhoto(Long memberId, Long resumeId) {
        ResumeResponse resume = getMyResume(memberId, resumeId);

        if (resume.getPhotoUrl() == null) {
            return;
        }

        if (resumeMapper.clearPhotoByIdAndMemberId(resumeId, memberId) != 1) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "삭제할 이력서를 찾을 수 없습니다."
            );
        }

        afterCommitExecutor.run(
                () -> resumeImageStorage.deleteIfOwned(resume.getPhotoUrl())
        );
    }

    // 로그인한 회원의 이력서 한 건만 조회
    public ResumeResponse getMyResume(Long memberId, Long resumeId) {
        requireLogin(memberId);

        if(resumeId == null || resumeId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "올바른 이력서 번호가 아닙니다."
            );
        }

        ResumeResponse resume =
                resumeMapper.findByIdAndMemberId(resumeId, memberId);

        if(resume == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "저장한 이력서를 찾을 수 없습니다."
            );
        }

        return resume;
    }

    // 이력서 내용과 증명사진을 함께 저장한다.
    @Transactional
    public ResumeResponse saveResume(
            Long memberId,
            ResumeSaveRequest request,
            MultipartFile photo
    ) {
        requireLogin(memberId);
        validateResumeData(request.getResumeData());

        ResumeResponse existingResume =
                resumeMapper.findByMemberIdAndResumeType(
                        memberId,
                        request.getResumeType()
                );

        String previousPhotoUrl = existingResume == null
                ? null
                : existingResume.getPhotoUrl();

        boolean hasNewPhoto = photo != null && !photo.isEmpty();

        // 블라인드 이력서에는 사진을 저장하지 않는다.
        if ("BLIND".equals(request.getResumeType()) && hasNewPhoto) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "블라인드 채용 이력서에는 사진을 등록할 수 없습니다."
            );
        }

        String newPhotoUrl = null;
        String nextPhotoUrl;

        if ("BLIND".equals(request.getResumeType())) {
            nextPhotoUrl = null;
        } else if (hasNewPhoto) {
            // 새 사진을 선택했다면 삭제 예약보다 새 사진을 우선
            newPhotoUrl = resumeImageStorage.store(photo);
            nextPhotoUrl = newPhotoUrl;
        } else if (request.isRemovePhoto()) {
            nextPhotoUrl = null;
        } else {
            // 사진 선택·삭제 모두 하지 않았다면 기존 사진을 유지
            nextPhotoUrl = previousPhotoUrl;
        }

        try {
            resumeMapper.upsertResume(memberId, request, nextPhotoUrl);

            // DB 저장이 성공한 뒤에만 이전 사진 파일을 삭제한다.
            if (previousPhotoUrl != null
                    && !previousPhotoUrl.equals(nextPhotoUrl)) {
                afterCommitExecutor.run(
                        () -> resumeImageStorage.deleteIfOwned(previousPhotoUrl)
                );
            }

            ResumeResponse savedResume =
                    resumeMapper.findByMemberIdAndResumeType(
                            memberId,
                            request.getResumeType()
                    );

            if (savedResume == null) {
                throw new IllegalStateException(
                        "이력서를 저장한 뒤 찾을 수 없습니다."
                );
            }

            return savedResume;
        } catch (RuntimeException exception) {
            // DB 작업 실패·롤백 시 이번 요청에서 새로 저장한 파일만 정리
            if (newPhotoUrl != null) {
                resumeImageStorage.deleteIfOwned(newPhotoUrl);
            }

            throw exception;
        }
    }

    // 로그인한 회원 본인의 이력서와 연결된 증명사진 함께 삭제
    // 로그인한 회원 본인의 이력서와 연결된 증명사진을 함께 삭제한다.
    @Transactional
    public void deleteResume(Long memberId, Long resumeId) {
        ResumeResponse resume = getMyResume(memberId, resumeId);

        if (resumeMapper.deleteByIdAndMemberId(resumeId, memberId) != 1) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "삭제할 이력서를 찾을 수 없습니다."
            );
        }

        // DB 삭제가 최종 반영된 뒤에만 서버 사진 파일을 삭제한다.
        if (resume.getPhotoUrl() != null) {
            afterCommitExecutor.run(
                    () -> resumeImageStorage.deleteIfOwned(resume.getPhotoUrl())
            );
        }
    }


    // DB의 JSON 컬럼 오류가 500으로 노출되지 않도록 저장 전에 형식을 확인
    private void validateResumeData(String resumeData) {
        try {
            if (!objectMapper.readTree(resumeData).isObject()) {
                throw new ApiException(
                        ErrorCode.INVALID_INPUT,
                        "이력서 내용 형식이 올바르지 않습니다."
                );
            }
        } catch (RuntimeException exception) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "이력서 내용 형식이 올바르지 않습니다."
            );
        }
    }

    // 토큰에서 회원 번호를 받지 못했다면 이력서 기능을 사용 할 수 없다.
    private void requireLogin(Long memberId) {
        if (memberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }
}
