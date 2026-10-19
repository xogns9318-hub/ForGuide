const ko = {
    header: {
        login: "로그인",
        signup: "회원가입",
        logout: "로그아웃",
        myPage: "마이페이지",
        myFinance: "내 금융 정보",
        language: "언어",
    },

    navigation: {
        counseling: "상담",
        recommendation: "추천",
        repayment: "계산 도우미",
        employment: "취업 도우미",
        simulator: "시뮬레이터",
        community: "커뮤니티",
    },

    home: {
        banner: {
            eyebrow: "한국 생활의 길잡이, ForGuide",
            title: "당신의 행복한 한국 생활을 돕는 곳",
            description:
                "임금·계좌·생활비·상환·취업까지. 낯선 생활에서 겪는 어려움을 정리하고, 내 상황에 맞는 도움을 찾아보세요.",
        },

        services: {
            eyebrow: "ForGuide 서비스",
            title: "어떤 도움이 필요하세요?",
            description: "한국 생활에 필요한 여섯 가지 서비스를 한눈에 살펴보세요.",
        },

        categories: {
            counseling: {
                description: "내 상황에 맞는 상담을 찾고, 상담에 필요한 준비와 설명을 정리하세요.",
            },
            recommendation: {
                description: "대출·보험·계좌를 비교하고, 목적에 맞는 금융 서비스를 살펴보세요.",
            },
            repayment: {
                description: "월 상환액과 총이자, 상환 일정을 확인하며 자금 계획을 세워보세요.",
            },
            employment: {
                description: "취업 준비자료와 일자리 정보를 살펴보고, 다음 단계를 준비하세요.",
            },
            simulator: {
                description: "상환일과 수입·지출을 달력에 정리하고 하루 지출 계획을 세워보세요.",
            },
            community: {
                description: "한국 생활의 경험과 정보를 나누고, 서로의 이야기를 만나보세요.",
            },
        },

        features: {
            counseling: {
                consultation: "도움 기관 안내",
                preparationCard: "상담 준비 카드 만들기",
            },
            recommendation: {
                loan: "대출 상품 추천",
                insurance: "보험 상품 추천",
                account: "계좌 추천",
            },
            repayment: {
                monthlyPayment: "월 상환액 계산기",
                totalInterest: "총 이자 계산기",
            },
            employment: {
                jobListings: "일자리 목록",
                employment: "취업 준비자료",
            },
        },
    },

    footer: {
        description: "이곳은 Footer입니다. 발냄새가 지독한 곳이죠.",
        copyright: "© 이것이 최선입니까 휴먼?",
    },

    community: {
        memberPreview: {
            triggerAria: "{{nickname}} 프로필 미리보기",
            cardAria: "프로필 미리보기",
            loading: "프로필을 불러오는 중입니다.",
            error: "프로필 정보를 불러오지 못했습니다.",
            unnamedMember: "이름 없는 회원",
            defaultIntro: "아직 소개글을 작성하지 않았습니다.",
            postCount: "게시글",
            receivedLikes: "받은 공감",
            postsButtonAria: "{{nickname}}님이 작성한 게시글 {{count}}개 보기",
        },
        memberPosts: {
            title: "{{nickname}}님의 게시글",
            loading: "게시글을 불러오는 중입니다.",
            empty: "작성한 게시글이 없습니다.",
            error: "게시글을 불러오지 못했습니다.",
            close: "닫기",
            imageOnly: "사진 게시글",
            viewCount: "조회 {{count}}",
            commentCount: "댓글 {{count}}",
        },
        postModal: {
            title: "게시글",
            close: "닫기",
            loading: "게시글을 불러오는 중입니다.",
            error: "게시글을 불러오지 못했습니다.",
            viewCount: "조회",
            commentCount: "댓글",
        },

        comments: {
            title: "댓글",
            loading: "댓글을 불러오는 중입니다.",
            empty: "아직 댓글이 없습니다.",
            loadError: "댓글을 불러오지 못했습니다.",
            contentRequired: "댓글 내용을 입력해주세요.",
            maxLength: "댓글은 1000자 이하여야 합니다.",
            loginRequired: "댓글을 작성하려면 로그인이 필요합니다.",
            saveError: "댓글을 저장하지 못했습니다.",
            updateError: "댓글을 수정하지 못했습니다.",
            deleteConfirm: "이 댓글을 삭제할까요?",
            deleteError: "댓글을 삭제하지 못했습니다.",
            deleted: "삭제된 댓글입니다.",
            reply: "댓글",
            edit: "수정",
            cancel: "취소",
            delete: "삭제",
            deleting: "삭제 중",
            submit: "등록",
            submitting: "등록 중",
            replyPlaceholder: "{{nickname}}님에게 댓글 작성",
            writePlaceholder: "댓글을 작성해주세요.",
            writeButton: "댓글 작성",
        },

        postEdit: {
            contentAria: "게시글 내용 수정",
            imageAlt: "기존 게시글 사진",
            invalidImage: "JPG 또는 PNG 사진만, 한 장당 20MB 이하로 올릴 수 있습니다.",
            maxImageCount: "게시글 사진은 최대 4장까지 올릴 수 있습니다.",
            contentRequired: "게시글 내용을 입력해주세요.",
            updateError: "게시글을 수정하지 못했습니다.",
            removeCancel: "삭제 취소",
            removeImage: "사진 삭제",
            addImage: "사진 추가",
            removeNewImage: "제거",
            cancel: "취소",
            submitting: "수정 중...",
            submit: "수정 완료",
        },
    },

    service: {
        consultation: {
            description: "도움이 필요한 문제를 고르고, 상황에 맞는 도움 기관을 찾아보세요.",
        },
        preparationCard: {
            description:
                "정확한 구비서류와 본인 확인 지참물(신분증 등)을 미리 확인하는 데 도움을 드립니다.",
        },
        loan: {
            description: "대출 이용 정보를 입력하고, 목적에 맞는 상품을 살펴보세요.",
        },
        insurance: {
            description: "기본 정보와 필요한 보장을 바탕으로 보험 상품을 살펴보세요.",
        },
        account: {
            description: "급여 수령과 송금 등 이용 목적에 맞는 계좌를 살펴보세요.",
        },
        monthlyPayment: {
            description: "대출금액과 금리, 기간을 입력하고 예상 월 상환액을 확인하세요.",
        },
        totalInterest: {
            description: "상환 기간 동안 발생하는 예상 총 이자와 총 상환액을 확인하세요.",
        },
        jobListings: {
            description: "나에게 맞는 일자리를 살펴보세요.",
        },
        employment: {
            description: "지원 방식에 맞는 이력서를 작성하고 저장하거나 출력하세요.",
        },
    },

    status: {
        loading: {
            title: "이동중입니다! 잠시만 기다려주세요",
        },

        empty: {
            title: "조회된 결과가 없습니다!",
            description: "입력한 조건을 변경하고 다시 조회해주세요.",
            changeButton: "조건 변경하기",
        },

        error: {
            title: "잘못된 접근입니다! 다시 돌아가세요!!",
            homeButton: "홈으로 돌아가기",
        },

        failure: {
            title: "정보를 불러오지 못했습니다! 다시 시도해주세요.",
            description: "잠시 후 다시 시도해주세요.",
            retryButton: "다시 시도",
            retryError: "다시 시도했지만 실패했습니다. 잠시 후 시도해주세요.",
        },

        example: {
            title: "예시 표시와 개인정보 마스킹",
            description: "아래는 실제 개인정보가 없는 표시 예시입니다.",
            nameLabel: "가상 이름",
            accountLabel: "가상 계좌번호",
        },

        input: {
            title: "입력 내용을 확인해주세요.",
            description:
                "필수 입력 검증을 확인하는 초안입니다. 실제 서비스 항목과 범위는 별도로 적용합니다.",
            label: "입력값",
            submitButton: "입력 확인",
            success: "필수 입력 검증을 통과했습니다.",
            requiredError: "필수 입력 항목입니다.",
        },
    },

    // 공통 확인창·알림 버튼 (components/Modal)
    modal: {
        confirm: "확인",
        cancel: "취소",
    },
};

export default ko;
