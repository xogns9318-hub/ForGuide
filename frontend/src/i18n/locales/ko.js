const ko = {
    institutionGuide: {
        // 도움 기관 안내의 검색 조건과 제출 버튼 문구다.
        topicLabel: "상담 분야",
        keywordLabel: "상담 키워드",
        requiredSuffix: " · 필수",
        chooseTopicAndKeywords: "상담 분야와 키워드를 선택해주세요.",
        chooseKeywords: "상담 키워드를 한 개 이상 선택해주세요.",
        selectedKeywords: "키워드 {{count}}개 선택됨",
        submit: "안내받기",
        dbNotice:
            "공식 출처를 바탕으로 등록한 기관을 조회합니다. 확인되지 않은 이용 조건은 ‘확인 필요’로 표시합니다.",
        searchLabel: "기관명·상담 내용 검색",
        searchPlaceholder: "예: 임금체불, 통장 만들기, 외국인등록",
        queryReady: "검색어와 현재 선택 조건으로 기관을 조회합니다.",
        showAll: "전체 기관 보기",
        all: "전체",
        resultsTitle: "도움 기관 조회 결과",
        resultCount: "기관 {{count}}곳",
        loading: "기관 정보를 불러오는 중입니다.",
        loadError: "기관 정보를 불러오지 못했습니다. 서버 연결을 확인하고 다시 시도해주세요.",
        invalidInput: "검색 조건을 확인해주세요.",
        retry: "다시 시도",
        empty: "조건에 맞는 기관이 없습니다. 키워드를 줄이거나 전체 기관을 확인해주세요.",
        unknown: "확인 필요",
        available: "운영",
        unavailable: "미운영",
        required: "예약 필수",
        notRequired: "필수 아님",
        detail: "상세 보기",
        detailTitle: "기관 상세",
        close: "목록으로 돌아가기",
        notFound: "해당 기관을 찾을 수 없습니다.",
        administration: "행정·생활 안내",
        servicesTitle: "상담 업무별 이용 안내",
        partialNotice:
            "일부 정보만 확인된 자료입니다. 실제 이용 전 기관에 최신 조건을 확인해주세요.",
        rankingNotice:
            "직접 상담 기관을 우선하고, 선택 키워드 일치 개수와 조건 확인 여부 순으로 표시합니다. 일치율은 지원 자격이나 승인 확률이 아닙니다.",
        matchCount: "선택 키워드 {{total}}개 중 {{matched}}개 일치 · {{percent}}%",
        matchedList: "일치한 키워드: {{keywords}}",
        chartTitle: "상위 기관의 선택 키워드 일치 개수",
        matchedLabel: "일치 키워드",
        specialHours: "별도 운영: {{scope}} — {{hours}}",
        phoneNationwide: "전화 이용 지역 제한 없음",
        preparationUnknown: "준비물은 이용할 기관과 업무를 정한 뒤 확인해주세요.",
        reservationLink: "예약 안내",
        onlineLink: "온라인 상담",
        serviceSource: "상담 업무 출처",
        officialLink: "공식 홈페이지",
        sourceLink: "공식 출처 {{count}}",
        prepareCard: "상담 준비 카드 만들기",

        roles: {
            direct: "직접 상담",
            related: "관련 상담·민원·기관 안내",
            unknown: "상담 역할 확인 필요",
        },

        methods: {
            phone: "전화",
            visit: "방문",
            online: "온라인",
        },

        pending: {
            method: "상담 방식 확인 필요",
            language: "선택 언어 확인 필요",
            region: "선택 지역 확인 필요",
        },

        fields: {
            location: "기관 위치·전화 지역",
            phoneHours: "전화 상담시간",
            visitHours: "방문 상담시간",
            phoneWeekend: "주말 · 전화 기준",
            phoneHoliday: "공휴일 · 전화 기준",
            phoneLanguages: "전화 지원 언어",
            visitLanguages: "방문 지원 언어",
            methods: "확인된 상담 방식",
            visitAddress: "실제 방문 장소",
            visitWeekend: "주말 방문 운영",
            visitHoliday: "공휴일 방문 운영",
            reservationRequired: "방문 예약 필수 여부",
            branch: "방문 지사·예약 안내",
            languageNotes: "언어 이용 조건",
            contact: "상담 이용 절차",
            target: "상담 대상",
            preparation: "준비물",
            address: "기관 소재지",
            phone: "기관 번호",
            keywords: "전체 상담 키워드",
            checkedAt: "자료 확인일",
        },

        topics: {
            bank: "계좌·은행",
            loan: "대출",
            repayment: "채무·상환",
            credit: "신용관리",
            living: "생활비·지출",
            wages: "급여·임금",
            employment_contract: "근로계약·근무조건",
            retirement: "퇴직·퇴직금",
            employment: "취업·구직",
            remittance: "송금·이체",
            payment: "카드·결제",
            housing: "주거비",
            tax: "세금",
            insurance: "보험·사회보장",
            fraud: "금융사기·피해",
            financial_support: "금융지원·복지",
            financial_information: "금융정보·기초상담",
        },
    },
    header: {
        login: "로그인",
        signup: "회원가입",
        logout: "로그아웃",
        myPage: "마이페이지",
        myFinance: "내 금융 정보",
        language: "언어",

        // 새 헤더 메뉴에서 사용할 한국어 문구
        mega: {
            introduction: "가이드 소개",
            guides: "가이드 목록",
            contact: "문의하기",

            // 클릭할 수 없는 연한 제목
            introductionList: "소개 목록",
            contactGroup: "문의",

            // 아직 페이지를 연결하지 않은 문의 버튼
            myInquiries: "내 문의",
            privateInquiry: "1:1 문의",
            faq: "자주하는 질문",

            // 화면 읽기와 모바일 메뉴용 이름
            home: "ForGuide 홈",
            navigation: "가이드 메뉴",
            open: "메뉴 열기",
            close: "메뉴 닫기",
        },
    },

    navigation: {
        counseling: "상담 가이드",
        recommendation: "추천 가이드",
        repayment: "계산 가이드",
        employment: "취업 가이드",
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
                loan: "대출 상품",
                insurance: "보험 상품",
                account: "계좌 개설",
            },
            repayment: {
                monthlyPayment: "월 상환액",
                totalInterest: "총 이자",
            },
            employment: {
                jobListings: "일자리 찾기",
                employment: "취업 준비 자료",
            },
            simulator: {
                simulator: "시뮬레이터",
            },
            community: {
                community: "커뮤니티",
            },
        },
    },

    footer: {
        description: "빠른 시일 내에 변경될 예정인 Footer 입니다.",
        copyright: "© ForGuide",
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
            like: "공감",
            unlike: "공감 취소",
            likeError: "댓글 공감 처리에 실패했습니다.",
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

    jobListings: {
        page: {
            title: "일자리 목록",
            description: "나에게 맞는 취업 정보와 지원 기관을 찾아보세요.",
        },
        actions: {
            details: "자세히 보기",
            openSite: "사이트 바로가기",
            openOfficialSite: "공식 사이트 바로가기",
            close: "닫기",
        },
        labels: {
            target: "대상",
            language: "언어",
            region: "지역 선택",
        },
        detailModal: {
            about: "어떤 곳인가요?",
            recommendedFor: "이런 분들이 이용하면 좋아요",
            caution: "이용 전 확인",
            source: "정보 출처",
            verifiedAt: "확인일",
            unknown: "확인 필요",
            closeAria: "상세 안내 닫기",
        },
        status: {
            loading: "기관 정보를 불러오는 중입니다.",
            error: "기관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
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

    // 미구현 서비스의 제작 중 안내
    underConstruction: {
        title: "현재 페이지는 제작중입니다.",
        description: "빠른 시일 내에 완성하겠습니다.",
        duckLabel: "고개를 숙여 인사하는 픽셀 오리",
    },

    // 공통 확인창·알림 버튼 (components/Modal)
    modal: {
        confirm: "확인",
        cancel: "취소",
    },

    recommendResult: {
        groups: {
            match: "외국인 가입 가능",
            check: "가입 조건 확인 필요",
            mismatch: "가입이 어려운 상품",
        },
        reasons: {
            high_rate: "같은 조건의 상품 중 금리가 높은 편이에요",
            no_visit: "영업점에 가지 않고 가입할 수 있어요",
            bank: "은행(1금융권) 상품이에요",
        },
        checkReasons: {
            foreigner_unspecified: "외국인 가입 조건이 공시되지 않았어요",
            region_limit: "가입 지역이 정해져 있어요: {{regions}}",
            rate_outlier: "금리가 다른 상품보다 크게 높아요. 특별한 가입 조건이 있는지 확인하세요",
            kakao_withdrawal_only:
                "외국인은 입출금 통장만 안내돼 있어요. 예·적금 가입 여부를 확인하세요",
        },
        mismatchReasons: {
            domestic_only: "내국인만 가입할 수 있어요",
            visit_required: "영업점에 방문해야 가입할 수 있어요",
            term_over_stay: "저축 기간이 남은 체류 기간보다 길어요",
            kbank_not_yet: "외국인 가입 서비스를 준비 중이에요",
        },
        guides: {
            join_at_company:
                "외국인 가입이 가능하다고 안내된 상품이에요. 금융사 앱이나 홈페이지에서 가입하세요.",
            ask_foreigner_eligibility:
                "외국인 가입 조건이 공시되지 않았어요. 가입 전에 금융사에 외국인도 가입할 수 있는지 물어보세요.",
        },
        moreFromCompany: "이 금융사 상품 {{count}}개 더",
        notices: {
            rate_may_change: "금리는 {{month}} 공시 기준이며 바뀔 수 있어요.",
            savings_bank_protected: "저축은행 예·적금도 예금자보호 대상이에요.",
            reference_only:
                "추천은 참고용이에요. 실제 가입 여부와 금리는 금융사 심사에 따라 달라요.",
        },
    },
};

export default ko;
