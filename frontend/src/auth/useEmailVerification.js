import { useEffect, useRef, useState } from "react";
import { sendEmailCode, verifyEmailCode } from "./api/authApi.js";
import { apiErrorMessage, apiFieldErrors } from "./utils/authMessages.js";
import { validateEmail, validateVerificationCode } from "./utils/authValidation.js";

// 이메일 비교용 (서버와 같이 앞뒤 공백 제거 + 소문자)
export function normalizeEmail(value) {
    return value.trim().toLowerCase();
}

// 이메일 인증 초기 상태
// status: idle(코드 받기 전) / sending / sent(코드 입력 대기) / verifying / verified
// email: 코드를 받은 이메일(정규화). 입력칸의 이메일이 바뀌면 인증은 처음부터 다시
// expiresAt·resendAt: 코드 만료 시각·다시 받기 가능 시각(ms), token: 인증 완료 토큰
const emptyCheck = { status: "idle", email: "", token: "", expiresAt: 0, resendAt: 0 };

// 이메일 인증 코드 받기·확인 (회원가입·비밀번호 찾기 공통)
// purpose: "SIGNUP" | "PASSWORD_RESET"
// 이메일 칸의 오류는 화면이 관리한다: sendCode가 돌려준 메시지를 화면이 이메일 칸 아래에 보여 준다
export function useEmailVerification(purpose) {
    const [check, setCheck] = useState(emptyCheck);
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState("");

    // 남은 시간 표시용 현재 시각 (코드 입력 대기 중에만 1초마다 갱신)
    const [now, setNow] = useState(() => Date.now());

    const codeInputRef = useRef(null);
    const mounted = useRef(false);

    // 지금 입력칸에 있는 이메일 (인증 응답이 늦게 와도 현재 값과 비교하기 위해)
    const latestEmail = useRef("");

    // 화면을 떠난 뒤 끝난 요청이 상태를 바꾸지 않도록 표시
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 코드를 보낸 뒤 확인 전까지 1초마다 시계를 돌린다 (남은 시간·다시 받기 대기 표시)
    const isWaitingCode = check.status === "sent" || check.status === "verifying";
    useEffect(() => {
        if (!isWaitingCode) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isWaitingCode]);

    // 새 코드를 받으면 코드 입력칸으로 포커스 (입력칸은 코드를 받은 뒤에 그려지므로 그린 다음에 옮긴다)
    useEffect(() => {
        if (check.expiresAt) {
            codeInputRef.current?.focus();
        }
    }, [check.expiresAt]);

    // 처음 상태로 (완료 후 토큰을 화면 상태에 남기지 않거나, 토큰이 무효가 됐을 때)
    function reset() {
        setCheck(emptyCheck);
        setCode("");
        setCodeError("");
    }

    // 이메일 입력이 바뀔 때: 코드를 받은 이메일과 달라지면 인증은 처음부터 다시 (받은 코드·토큰은 그 이메일 전용)
    function handleEmailChange(value) {
        latestEmail.current = normalizeEmail(value);
        if (check.status !== "idle" && check.email !== latestEmail.current) {
            reset();
        }
    }

    // 인증 코드 받기 (다시 받기도 같은 함수) → 이메일 칸에 보여 줄 오류 메시지, 없으면 ""
    async function sendCode(rawEmail) {
        const problem = validateEmail(rawEmail);
        if (problem) return problem;

        const email = normalizeEmail(rawEmail);
        latestEmail.current = email;
        const previous = check;
        setCheck((prev) => ({ ...prev, status: "sending", email }));
        setCodeError("");

        try {
            const { expiresInSeconds, resendAfterSeconds } = await sendEmailCode({
                email,
                purpose,
            });
            // 보내는 동안 이메일을 바꿨다면 이 결과는 버린다
            if (!mounted.current || latestEmail.current !== email) return "";

            const sentAt = Date.now();
            setNow(sentAt);
            setCheck({
                status: "sent",
                email,
                token: "",
                expiresAt: sentAt + expiresInSeconds * 1000,
                resendAt: sentAt + resendAfterSeconds * 1000,
            });
            setCode("");
            return "";
        } catch (error) {
            if (!mounted.current || latestEmail.current !== email) return "";

            // 보내지 못했으면 이전 상태로 (이미 받은 코드가 있으면 그 코드는 계속 쓸 수 있다)
            setCheck(previous.status === "sent" ? previous : emptyCheck);
            return (
                apiFieldErrors(error).email ??
                apiErrorMessage(error, "auth.emailVerification.failed")
            );
        }
    }

    // 인증 코드 확인 → 성공하면 다음 요청(가입·재설정)에 쓸 토큰을 받아 둔다
    async function verifyCode() {
        const problem = validateVerificationCode(code);
        if (problem) {
            setCodeError(problem);
            codeInputRef.current?.focus();
            return;
        }

        const email = check.email;
        setCheck((prev) => ({ ...prev, status: "verifying" }));
        setCodeError("");

        try {
            const { verificationToken } = await verifyEmailCode({
                email,
                purpose,
                code: code.trim(),
            });
            if (!mounted.current || latestEmail.current !== email) return;

            setCheck((prev) => ({ ...prev, status: "verified", token: verificationToken }));
            setCode("");
        } catch (error) {
            if (!mounted.current || latestEmail.current !== email) return;

            setCheck((prev) => ({ ...prev, status: "sent" }));
            setCodeError(apiErrorMessage(error, "auth.emailVerification.failed"));
            codeInputRef.current?.focus();
        }
    }

    function changeCode(value) {
        setCode(value);
        setCodeError("");
    }

    return {
        purpose,
        status: check.status,
        email: check.email,
        token: check.token,
        isWaitingCode,
        // 입력칸의 이메일로 인증을 마쳤는지
        isVerifiedFor: (rawEmail) =>
            check.status === "verified" && check.email === normalizeEmail(rawEmail),
        secondsLeft: Math.max(0, Math.ceil((check.expiresAt - now) / 1000)),
        resendWait: Math.max(0, Math.ceil((check.resendAt - now) / 1000)),
        code,
        codeError,
        codeInputRef,
        changeCode,
        handleEmailChange,
        sendCode,
        verifyCode,
        reset,
    };
}
