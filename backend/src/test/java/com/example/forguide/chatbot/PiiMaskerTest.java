package com.example.forguide.chatbot;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.forguide.chatbot.service.PiiMasker;
import org.junit.jupiter.api.Test;

/**
 * 개인정보 가리기. 예시 번호는 모두 지어낸 값이다.
 */
class PiiMaskerTest {

    private final PiiMasker masker = new PiiMasker();

    @Test
    void 주민등록번호를_가린다() {
        assertThat(masker.mask("제 주민번호는 900101-1234567 입니다"))
                .isEqualTo("제 주민번호는 ******-******* 입니다");
        assertThat(masker.mask("9001012234567")).isEqualTo("*************");
    }

    @Test
    void 외국인등록번호_뒷자리_5에서_8을_가린다() {
        assertThat(masker.mask("외국인등록번호 950505-5123456")).isEqualTo("외국인등록번호 ******-*******");
        assertThat(masker.mask("ARC 950505-8123456")).isEqualTo("ARC ******-*******");
    }

    @Test
    void 여권번호를_가린다() {
        assertThat(masker.mask("passport M12345678 please")).isEqualTo("passport ********* please");
        assertThat(masker.mask("여권 EA1234567")).isEqualTo("여권 *********");
    }

    @Test
    void 계좌번호를_가린다() {
        assertThat(masker.mask("계좌 123-456789-01-234로")).isEqualTo("계좌 ***-******-**-***로");
        assertThat(masker.mask("계좌 110123456789")).isEqualTo("계좌 ************");
    }

    @Test
    void 전화번호를_가린다() {
        assertThat(masker.mask("연락처 010-1234-5678")).isEqualTo("연락처 ***-****-****");
        assertThat(masker.mask("01012345678")).isEqualTo("***********");
        assertThat(masker.mask("02-123-4567")).isEqualTo("**-***-****");
    }

    @Test
    void 금액_기간_날짜_같은_일반_숫자는_그대로_둔다() {
        String question = "3000만원을 5년 동안 연 4.5%로 빌리면 월 상환액이 얼마인가요? 2026-11-04 기준";
        assertThat(masker.mask(question)).isEqualTo(question);
        assertThat(masker.mask("1,000,000,000원")).isEqualTo("1,000,000,000원");
    }
}
