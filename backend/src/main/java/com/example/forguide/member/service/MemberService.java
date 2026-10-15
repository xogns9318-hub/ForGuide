package com.example.forguide.member.service;

import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.common.ErrorCode;
import com.example.forguide.member.dto.MemberResponse;
import com.example.forguide.member.image.ProfileImageStorage;
import com.example.forguide.member.mapper.MemberMapper;
import com.example.forguide.member.mapper.MemberRow;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로그인한 본인의 닉네임·프로필 이미지 저장. 회원 번호는 항상 토큰에서 받은 값만 쓴다.
 */
@Service
public class MemberService {

    // 닉네임: 모든 언어의 글자·결합 기호·숫자·문장부호·기호·일반 공백 (제어 문자·보이지 않는 문자 불가)
    // 프론트 src/auth/utils/authValidation.js의 validateNickname과 같은 규칙
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\p{L}\\p{M}\\p{N}\\p{P}\\p{S} ]+$");

    private final MemberMapper memberMapper;
    private final ProfileImageStorage profileImageStorage;

    public MemberService(MemberMapper memberMapper, ProfileImageStorage profileImageStorage) {
        this.memberMapper = memberMapper;
        this.profileImageStorage = profileImageStorage;
    }

    /** 닉네임 변경 (앞뒤 공백 제거 후 2~20자, 중복 허용) */
    @Transactional
    public MemberResponse updateNickname(Long memberId, String nickname) {
        String text = (nickname == null) ? "" : nickname.trim();
        String problem = checkNickname(text);
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

    private MemberRow findMember(Long memberId) {
        MemberRow member = memberMapper.findById(memberId);
        if (member == null) {
            // 토큰은 유효하지만 회원이 사라진 경우
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
        return member;
    }

    private static String checkNickname(String text) {
        if (text.isEmpty()) return "닉네임을 입력해주세요.";
        int length = text.codePointCount(0, text.length()); // 이모지 등도 한 글자로 센다
        if (length < 2 || length > 20) return "닉네임은 2~20자로 입력해주세요.";
        if (!NICKNAME_PATTERN.matcher(text).matches()) return "닉네임에 쓸 수 없는 문자가 있습니다.";
        return null;
    }
}
