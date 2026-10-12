import "../../styles/footer.css";

// 페이지 하단 정보 표시
export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                {/* 사이트 소개 */}
                <p>이곳은 Footer입니다. 발냄새가 지독한 곳이죠.</p>

                {/* 하단 문구 */}
                <p>© 이것이 최선입니까 휴먼?</p>
            </div>
        </footer>
    );
}