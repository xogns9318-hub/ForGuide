package com.example.forguide.employment.mapper;

import com.example.forguide.employment.dto.ResumeResponse;
import com.example.forguide.employment.dto.ResumeSaveRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ResumeMapper {

    // 로그인한 회원의 일반·블라인드 이력서 목록을 조회
    List<ResumeResponse> findByMemberId(
            @Param("memberId") Long memberId
    );

    //로그인한 회원의 이력서 한 건만 조회
    ResumeResponse findByIdAndMemberId(
            @Param("resumeId") Long resumeId,
            @Param("memberId") Long memberId
    );

    // 사진 유지·교체·삭제 판단을 위해 회원의 양식별 기존 이력서를 조회
    ResumeResponse findByMemberIdAndResumeType(
            @Param("memberId") Long memberId,
            @Param("resumeType") String resumeType
    );

    // 같은 회원·양식이면 갱신하고, 없으면 새 이력서를 저장
    int upsertResume(
            @Param("memberId") Long memberId,
            @Param("request")ResumeSaveRequest request,
            @Param("photoUrl") String photoUrl
    );

    // 로그인한 회원의 이력서만 삭제
    int deleteByIdAndMemberId(
            @Param("resumeId") Long resumeId,
            @Param("memberId") Long memberId
    );

    // 로그인한 회원 이력서의 사진 연결만 제거
    int clearPhotoByIdAndMemberId(
            @Param("resumeId") Long resumeId,
            @Param("memberId") Long memberId
    );
}
