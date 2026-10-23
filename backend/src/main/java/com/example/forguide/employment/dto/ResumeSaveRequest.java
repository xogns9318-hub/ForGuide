package com.example.forguide.employment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeSaveRequest {

    // BASIC : 일반 이력서, BLIND: 블라인드 채용 이력서
    @NotBlank(message = "이력서 양식을 선택해주세요.")
    @Pattern(
            regexp = "BASIC|BLIND",
            message = "올바른 이력서 양식을 선택해주세요."
    )
    private String resumeType;

    // React 화면의 입력값 전체를 JSON 문자열로 받는다.
    @NotBlank(message = "이력서 내용을 입력해주세요.")
    private String resumeData;

    // true면 저장을 확정할 때 기존 사진 연결과 파일 삭제
    private boolean removePhoto;
}
