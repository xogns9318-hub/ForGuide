import { client } from "./client.js";

const CHATBOT_PATH = "/chatbot/messages";

// OpenAI 답변은 서버에서 최대 30초까지 기다리므로, 화면은 그보다 조금 더 기다린다
const ANSWER_TIMEOUT_MS = 40000;

// 화면을 열 때: { available, dailyLimit, remainingToday, maxQuestionLength, messages: [{ role, content }] }
export function getChatbotMessages() {
    return client.get(CHATBOT_PATH);
}

// 질문 보내기: { question: { role, content }, answer: { role, content }, remainingToday }
// question.content는 서버가 개인정보를 가린 뒤의 내용이다
export function sendChatbotQuestion({ question, language }) {
    return client.post(CHATBOT_PATH, { question, language }, { timeoutMs: ANSWER_TIMEOUT_MS });
}

// 대화 지우기 (오늘 사용한 횟수는 그대로)
export function clearChatbotMessages() {
    return client.delete(CHATBOT_PATH);
}
