package com.example.forguide.inquiry.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.transaction.AfterCommitExecutor;
import com.example.forguide.inquiry.dto.InquiryAnswerRequest;
import com.example.forguide.inquiry.dto.InquiryCreateRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryImageResponse;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.dto.InquiryStatus;
import com.example.forguide.inquiry.image.InquiryImageStorage;
import com.example.forguide.inquiry.mapper.InquiryMapper;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.dto.TranslationTargetRequest;
import com.example.forguide.translation.service.TranslationService;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryMapper inquiryMapper;
    private final InquiryImageStorage inquiryImageStorage;
    private final TranslationService translationService;
    private final AfterCommitExecutor afterCommitExecutor;

    // 문의 작성은 INSERT 작업이므로 트랜잭션으로 처리한다.
    @Transactional
    public void createInquiry(
            Long memberId,
            InquiryCreateRequest request,
            List<MultipartFile> images
    ) {
        requireLogin(memberId);

        List<MultipartFile> imageFiles = images == null
                ? List.of()
                : images.stream()
                        .filter(image -> !image.isEmpty())
                        .toList();

        if (inquiryMapper.insert(memberId, request) != 1
                || request.getInquiryId() == null) {
            throw new IllegalStateException("문의를 저장하지 못했습니다.");
        }

        List<String> storedImageUrls = new ArrayList<>();

        try {
            for (int displayOrder = 0;
                    displayOrder < imageFiles.size();
                    displayOrder++) {
                String imageUrl = inquiryImageStorage.store(
                        imageFiles.get(displayOrder)
                );
                storedImageUrls.add(imageUrl);

                if (inquiryMapper.insertImage(
                        request.getInquiryId(),
                        imageUrl,
                        displayOrder
                ) != 1) {
                    throw new IllegalStateException("문의 사진을 저장하지 못했습니다.");
                }
            }
        } catch (RuntimeException exception) {
            // DB 트랜잭션이 롤백될 때 이번 요청에서 저장한 파일도 함께 정리한다.
            storedImageUrls.forEach(inquiryImageStorage::deleteIfOwned);
            throw exception;
        }
    }

    public TranslationResponse translateMyInquiryText(
            Long memberId,
            Long inquiryId,
            String field,
            TranslationTargetRequest request
    ) {
        InquiryResponse inquiry = getMyInquiry(memberId, inquiryId);

        return translateInquiryField(inquiry, field, request);
    }

    // 목록 조회는 DB 상태를 바꾸지 않으므로 트랜잭션이 필요 없다.
    public List<InquiryResponse> getMyInquiries(
            Long memberId,
            InquiryCursorRequest cursor
    ) {
        requireLogin(memberId);

        return attachImages(
                inquiryMapper.findByMemberIdAndCursor(memberId, cursor)
        );
    }

    public InquiryResponse getMyInquiry(
            Long memberId,
            Long inquiryId
    ) {
        requireLogin(memberId);
        requireInquiryId(inquiryId);

        InquiryResponse inquiry = inquiryMapper.findByIdAndMemberId(
                inquiryId,
                memberId
        );

        if (inquiry == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        return attachImages(List.of(inquiry)).get(0);
    }

    // 답변이 등록되기 전의 본인 문의만 삭제할 수 있다.
    @Transactional
    public void deleteMyReceivedInquiry(Long memberId, Long inquiryId) {
        requireLogin(memberId);
        requireInquiryId(inquiryId);

        InquiryResponse inquiry = inquiryMapper.findByIdAndMemberId(
                inquiryId,
                memberId
        );

        if (inquiry == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "문의 내용을 찾을 수 없습니다.");
        }

        if (inquiry.getInquiryStatus() != InquiryStatus.RECEIVED) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "답변이 등록된 문의는 삭제할 수 없습니다."
            );
        }

        List<String> imageUrls = inquiryMapper.findImagesByInquiryIds(
                        List.of(inquiryId)
                ).stream()
                .map(InquiryImageResponse::getImageUrl)
                .toList();

        if (inquiryMapper.deleteReceivedByIdAndMemberId(inquiryId, memberId) != 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "문의 상태가 변경되어 삭제할 수 없습니다."
            );
        }

        // DB 삭제가 커밋된 뒤에만 실제 첨부 파일을 제거한다.
        afterCommitExecutor.run(
                () -> imageUrls.forEach(inquiryImageStorage::deleteIfOwned)
        );
    }

    // 관리자 전체 목록 조회도 SELECT만 수행한다.
    public List<InquiryResponse> getAllInquiries(
            InquiryCursorRequest cursor
    ) {
        return attachImages(inquiryMapper.findAllByCursor(cursor));
    }

    public InquiryResponse getInquiryForAdmin(Long inquiryId) {
        requireInquiryId(inquiryId);

        InquiryResponse inquiry = inquiryMapper.findById(inquiryId);

        if (inquiry == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        return attachImages(List.of(inquiry)).get(0);
    }

    public TranslationResponse translateInquiryTextForAdmin(
            Long inquiryId, String field, TranslationTargetRequest request
    ) {
        InquiryResponse inquiry = getInquiryForAdmin(inquiryId);

        return translateInquiryField(inquiry, field, request);
    }

    private TranslationResponse translateInquiryField(
            InquiryResponse inquiry, String field, TranslationTargetRequest request
    ) {
        String sourceText = switch (field) {
            case "title" -> inquiry.getTitle();
            case "content" -> inquiry.getContent();
            case "answer" -> inquiry.getAnswerContent();
            default -> throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "번역할 문의 항목이 올바르지 않습니다."
            );
        };

        if (sourceText == null || sourceText.isBlank()) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "번역할 내용이 없습니다."
            );
        }

        TranslationRequest translationRequest = new TranslationRequest();
        translationRequest.setSourceLanguage("auto");
        translationRequest.setTargetLanguage(request.getTargetLanguage());
        translationRequest.setSourceText(sourceText);

        return translationService.translatePrivateText(translationRequest);

    }

    // 답변 등록은 문의 상태·답변 내용을 함께 바꾸므로 트랜잭션으로 처리한다.
    @Transactional
    public void answerInquiry(
            Long adminMemberId,
            Long inquiryId,
            InquiryAnswerRequest request
    ) {
        requireLogin(adminMemberId);
        requireInquiryId(inquiryId);

        int updatedCount = inquiryMapper.answer(
                inquiryId,
                adminMemberId,
                request.getAnswerContent().trim()
        );

        if (updatedCount > 0) {
            return;
        }

        if (inquiryMapper.findById(inquiryId) == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        throw new ApiException(
                ErrorCode.INVALID_INPUT,
                "이미 답변이 등록된 문의입니다."
        );
    }

    // 작성자 본인만 문의 첨부 파일을 읽을 수 있다.
    public Path getMyInquiryImage(
            Long memberId,
            Long inquiryId,
            Long inquiryImageId
    ) {
        requireLogin(memberId);
        requireInquiryId(inquiryId);
        requireInquiryImageId(inquiryImageId);

        if (inquiryMapper.findByIdAndMemberId(inquiryId, memberId) == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "문의 내용을 찾을 수 없습니다.");
        }

        return findInquiryImageFile(inquiryId, inquiryImageId);
    }

    // 관리자 API는 작성자 소유권 대신 관리자 주소의 권한 규칙을 사용한다.
    public Path getInquiryImageForAdmin(
            Long inquiryId,
            Long inquiryImageId
    ) {
        requireInquiryId(inquiryId);
        requireInquiryImageId(inquiryImageId);
        getInquiryForAdmin(inquiryId);

        return findInquiryImageFile(inquiryId, inquiryImageId);
    }

    private Path findInquiryImageFile(
            Long inquiryId,
            Long inquiryImageId
    ) {
        InquiryImageResponse image = inquiryMapper.findImageByIdAndInquiryId(
                inquiryId,
                inquiryImageId
        );

        if (image == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "문의 사진을 찾을 수 없습니다.");
        }

        Path imagePath = inquiryImageStorage.findOwnedFile(image.getImageUrl());

        if (imagePath == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "문의 사진을 찾을 수 없습니다.");
        }

        return imagePath;
    }

    private List<InquiryResponse> attachImages(
            List<InquiryResponse> inquiries
    ) {
        if (inquiries.isEmpty()) {
            return inquiries;
        }

        List<Long> inquiryIds = inquiries.stream()
                .map(InquiryResponse::getInquiryId)
                .toList();

        Map<Long, List<InquiryImageResponse>> imagesByInquiryId =
                inquiryMapper.findImagesByInquiryIds(inquiryIds).stream()
                        .collect(Collectors.groupingBy(
                                InquiryImageResponse::getInquiryId,
                                HashMap::new,
                                Collectors.toList()
                        ));

        inquiries.forEach(inquiry -> inquiry.setImages(
                imagesByInquiryId.getOrDefault(
                        inquiry.getInquiryId(),
                        List.of()
                )
        ));

        return inquiries;
    }

    private void requireLogin(Long memberId) {
        if (memberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }

    private void requireInquiryId(Long inquiryId) {
        if (inquiryId == null || inquiryId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "문의 번호가 올바르지 않습니다."
            );
        }
    }

    private void requireInquiryImageId(Long inquiryImageId) {
        if (inquiryImageId == null || inquiryImageId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "문의 사진 번호가 올바르지 않습니다."
            );
        }
    }
}
