import { Link } from "react-router-dom";

// 답변 안의 ForGuide 화면 주소(/service/loan 등)만 링크로 바꾼다. 외부 주소는 링크로 만들지 않는다.
const INTERNAL_PATH = /(\/(?:service|contact|mypage)(?:\/[A-Za-z0-9-]+)*)/g;

export default function ChatbotMessageText({ text, linkPaths = false }) {
    if (!linkPaths) {
        return text;
    }

    // split에 묶음 괄호가 있어 주소 조각은 홀수 번째에 들어온다
    return text.split(INTERNAL_PATH).map((part, index) =>
        index % 2 === 1 ? (
            <Link key={index} to={part}>
                {part}
            </Link>
        ) : (
            part
        ),
    );
}
