import { useNavigate, useParams } from "react-router-dom";
import CommunityPostModal from "./CommunityPostModal.jsx";
import "../../styles/community.css";

// 직접 상세 주소로 들어와도 별도 긴 페이지 대신 동일한 상세 모달을 보여준다.
export default function CommunityPostDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();

    return (
        <CommunityPostModal
            postId={postId}
            onClose={() => navigate("/service/community")}
        />
    );
}
