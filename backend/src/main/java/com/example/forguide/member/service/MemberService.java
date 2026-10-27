package com.example.forguide.member.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.member.dto.MemberProfileRequest;
import com.example.forguide.member.dto.MemberProfileResponse;
import com.example.forguide.member.dto.MemberProfileResponse.Choice;
import com.example.forguide.member.dto.MemberProfileResponse.Choices;
import com.example.forguide.member.dto.MemberResponse;
import com.example.forguide.member.image.ProfileImageStorage;
import com.example.forguide.member.mapper.MemberMapper;
import com.example.forguide.member.mapper.MemberProfileMapper;
import com.example.forguide.member.mapper.MemberProfileRow;
import com.example.forguide.member.mapper.MemberRow;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로그인한 본인의 닉네임·프로필 이미지·프로필(사용 언어·체류 유형·체류자격·직업) 저장.
 * 회원 번호는 항상 토큰에서 받은 값만 쓴다 (다른 회원의 정보는 조회·수정할 수 없다).
 */
@Service
public class MemberService {

    // 사용 언어 선택지 (프론트 routeConfig의 languages, DB chk_profile_language와 같다)
    private static final List<String> LANGUAGES = List.of("ko", "en", "zh", "ja", "vi", "th");
    // 체류 유형 "내국인" 코드 (V27)
    private static final String KOREAN = "KOREAN";

    private final MemberMapper memberMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final ProfileImageStorage profileImageStorage;

    public MemberService(MemberMapper memberMapper, MemberProfileMapper memberProfileMapper,
                         ProfileImageStorage profileImageStorage) {
        this.memberMapper = memberMapper;
        this.memberProfileMapper = memberProfileMapper;
        this.profileImageStorage = profileImageStorage;
    }

    /** 닉네임 변경 (앞뒤 공백 제거 후 2~20자, 중복 허용) */
    @Transactional
    public MemberResponse updateNickname(Long memberId, String nickname) {
        String text = NicknamePolicy.normalize(nickname);
        String problem = NicknamePolicy.check(text);
        if (problem != null) {
            throw new ApiException(ErrorCode.INVALID_INPUT, problem, Map.of("nickname", problem));
        }

        findMember(memberId);
        memberMapper.updateNickname(memberId, text);
        return MemberResponse.from(findMember(memberId));
    }

    /** 프로필 이미지 변경: 새 이미지를 저장하고 이전 이미지 파일은 지운다 */
    @Transactional
    public MemberResponse updateProfileImage(Long memberId, MultipartFile image) {
        MemberRow member = findMember(memberId);

        String newUrl = profileImageStorage.store(image);
        try {
            memberMapper.updateProfileImageUrl(memberId, newUrl);
        } catch (RuntimeException e) {
            profileImageStorage.deleteIfOwned(newUrl); // DB 저장 실패 시 방금 만든 파일 정리
            throw e;
        }
        profileImageStorage.deleteIfOwned(member.getProfileImageUrl());

        return MemberResponse.from(findMember(memberId));
    }

    /** 프로필 조회 (아직 저장한 적 없으면 값은 null, 선택지는 항상 함께) */
    public MemberProfileResponse getProfile(Long memberId) {
        findMember(memberId);
        return MemberProfileResponse.of(memberProfileMapper.findByMemberId(memberId), choices());
    }

    /**
     * 프로필 저장 (처음이면 새로 만든다)
     * - 코드는 선택지 표에 있는 값만, 빈 값은 "모름"(null)
     * - 내국인은 체류자격을 저장하지 않는다
     */
    @Transactional
    public MemberProfileResponse updateProfile(Long memberId, MemberProfileRequest request) {
        findMember(memberId);
        Choices choices = choices();

        MemberProfileRow row = new MemberProfileRow();
        row.setLanguage(checkCode("language", request.language(), choices.languages()));
        row.setResidenceTypeCode(checkCode("residenceTypeCode", request.residenceTypeCode(),
                choices.residenceTypes().stream().map(Choice::code).toList()));
        row.setVisaTypeCode(KOREAN.equals(row.getResidenceTypeCode()) ? null
                : checkCode("visaTypeCode", request.visaTypeCode(),
                        choices.visaTypes().stream().map(Choice::code).toList()));
        String job = request.job() == null ? "" : request.job().trim();
        row.setJob(job.isEmpty() ? null : job);

        // 행이 없으면(처음 저장) 새로 만든다. 회원당 한 행(member_id UNIQUE)
        if (memberProfileMapper.update(memberId, row) == 0) {
            memberProfileMapper.insert(memberId, row);
        }
        return MemberProfileResponse.of(memberProfileMapper.findByMemberId(memberId), choices);
    }

    // 사용 언어는 화면 언어 목록과 같다 (DB CHECK 조건과도 같다), 체류 유형·체류자격은 DB 선택지 표
    private Choices choices() {
        return new Choices(LANGUAGES, memberProfileMapper.findResidenceTypes(), memberProfileMapper.findVisaTypes());
    }

    // 빈 값은 null(모름), 값이 있으면 선택지에 있어야 한다
    private static String checkCode(String field, String value, List<String> allowed) {
        String code = value == null ? "" : value.trim();
        if (code.isEmpty()) {
            return null;
        }
        if (!allowed.contains(code)) {
            String message = "선택지에 없는 값입니다.";
            throw new ApiException(ErrorCode.INVALID_INPUT, message, Map.of(field, message));
        }
        return code;
    }

    private MemberRow findMember(Long memberId) {
        MemberRow member = memberMapper.findById(memberId);
        if (member == null) {
            // 토큰은 유효하지만 회원이 사라진 경우
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
        return member;
    }

}
