const en = {
    header: {
        login: "Log In",
        signup: "Sign Up",
        logout: "Log Out",
        myPage: "My Page",
        myFinance: "My Financial Information",
        adminPage: "Administrator",
        language: "Language",

        mega: {
            serviceList: "Service List",
            contactMenu: "Inquiries",
            inquiry: "Contact",
            chatbot: "AI Chatbot",
            extendedServices: "Extended Guides",

            contact: "Contact",
            contactGroup: "Inquiries",
            myInquiries: "My Inquiries",
            privateInquiry: "1-on-1 Inquiry",
            faq: "Frequently Asked Questions",
            home: "ForGuide Home",
            navigation: "Guide Menu",
            open: "Open Menu",
            close: "Close Menu",
        },
    },

    homeMain: {
        duckLabel: "A duck walking in from the side and greeting in the center",
        navigationLabel: "Navigate home sections",
        sections: {
            main: "Main",
            translation: "Translation",
            counseling: "Consultation",
            recommendation: "Recommendations",
            repayment: "Calculators",
            employment: "Employment",
            extendedServices: "More",
            contact: "Contact",
        },
    },

    preparationCard: {
        title: "Tell us what you would like to discuss.",
        givenName: "Given names",
        surname: "Surname",
        birthDate: "Date of birth",
        gender: "Gender",
        male: "Male",
        female: "Female",
        occurrence: "When the issue occurred",
        choose: "Select an option",
        issue: "Issue",
        other: "Other",
        taxKeyword: "Tax filing and payment",
        keywordHelp: "Select the specific issues that apply. You may select more than one.",
        details: "Details",
        characterCount: "{{count}}/300 characters",
        guidanceTitle: "Before your consultation",
        acknowledge: "I have read this.",
        translationQuestion: "Would you like a Korean translation?",
        yes: "Yes",
        no: "No",
        complete: "Create consultation card",
        incomplete:
            "Your consultation preparation is not complete.\nPlease complete all fields and selections.",
        results: "Completed consultation cards",
        print: "Print cards",
        originalTitle: "Consultation Preparation Card - Original",
        translatedTitle: "Consultation Preparation Card - Korean Translation",
        translating: "Translating into Korean.",
        retryTranslation: "Retry translation",
        translationFailed:
            "The Korean translation failed. Your original text has been kept. Please try again shortly.",
        translationTimeout:
            "The translation is taking longer than expected. Your original text has been kept. Please try again shortly.",
        translationUnavailable:
            "The translation service is temporarily unavailable. Your original text has been kept. Please try again shortly.",
        translationRateLimited:
            "Translation usage is currently limited. Your original text has been kept. Please try again later.",
        translationConnectionFailed:
            "Unable to connect to the server. Your original text has been kept. Check your connection and try again.",
        translationReview: "This is an AI translation. Please compare it with the original text.",
        translationNotice:
            "If you request a Korean translation, your details will be sent to Google Gemini when you create the card. The given names, surname, and date of birth fields will not be sent.",
        institution: "Selected organization: {{name}}",
        nameRule:
            "Enter up to 20 characters without spaces, numbers, or special characters. Letters from other languages are accepted.",
        birthYear: "Year",
        birthMonth: "Month",
        birthDay: "Day",
        birthYearPlaceholder: "YYYY",
        birthMonthValue: "{{value}}",
        birthDayValue: "{{value}}",
        birthDateInvalid: "Enter a valid date of birth between January 1, 1900 and today.",
        periods: {
            under1: "Less than 1 month",
            months1to3: "1 to 3 months",
            months3to6: "3 to 6 months",
            months6to12: "6 months to 1 year",
            years1: "1 year or more",
            years3: "3 years or more",
            years5: "5 years or more",
            years10: "10 years or more",
        },

        notices: {
            1: "Photography and filming may be restricted in security-sensitive facilities, government offices, and research facilities.\nCheck the rules at each facility and follow security staff instructions.",
            2: "Do not verbally abuse, assault, threaten, or repeatedly harass staff.\nSuch behavior may result in the consultation being ended or action being taken under applicable laws.",
            3: "Not all requests can be processed immediately.\nCheck the processing time and any additional document requirements, and apply well before you need the result.",
            4: "Consultation hours and lunch closures vary by organization and service.\nCheck opening hours and whether an appointment is required before visiting.",
            5: "Documents required for an application by a representative vary by service.\nCheck whether a representative may apply and which documents are required, such as authorization and identification for both people.",
        },
    },

    homeOverview: {
        translation: {
            title: "Translation",
            headline: "No worries, even when languages differ",
            description:
                "Use ForGuide in a language you are comfortable with.\nWhen you select a language, the page is translated automatically.",
        },
        consultation: {
            headline: "Not sure where to ask for help?",
            description:
                "Find an organization that fits your situation\nand see what kind of support it can provide.",
        },
        preparationCard: {
            headline: "Prepare for a consultation with ease",
            description:
                "Organize what you need to discuss and your questions in advance,\nand create your own consultation preparation card.",
        },
        loan: {
            headline: "Find a loan product that suits you",
            description:
                "Compare conditions across different loan products\nand explore options that fit your situation.",
        },
        insurance: {
            headline: "Insurance does not have to be complicated",
            description:
                "Compare coverage and conditions across insurance products\nand find the coverage you need.",
        },
        account: {
            headline: "Want to open a bank account in Korea?",
            description:
                "Learn everything step by step, from what to prepare\nto the account-opening process.",
        },
        monthlyPayment: {
            headline: "How much will I need to repay each month?",
            description:
                "Enter your loan amount and interest rate\nto calculate your monthly repayment.",
        },
        totalInterest: {
            headline: "How much interest will I pay?",
            description:
                "Check the total interest over your loan term\nand plan your repayments ahead.",
        },
        jobListings: {
            headline: "Looking for a job in Korea?",
            description:
                "Browse a variety of job listings in one place\nand find work that suits you.",
        },
        employment: {
            headline: "Not sure where to begin preparing for employment?",
            description:
                "Find useful information for working in Korea\nand employment preparation materials.",
        },
        simulator: {
            headline: "How much can I spend today?",
            description:
                "Enter your monthly expenses, loan amount, and interest\nto see your daily spending amount on a calendar.",
        },
        community: {
            headline: "Share your questions and concerns together",
            description:
                "Ask questions about life in Korea\nand share experiences and useful information.",
        },
        chatbot: {
            headline: "Start with the AI chatbot",
            description:
                "Ask the AI chatbot about using the service\nand quickly find the information you need.",
        },
        inquiry: {
            headline: "Feel free to ask if you have questions",
            description: "If you have questions while using the service,\nleave an inquiry for us.",
        },
    },

    loanChart: {
        title: "{{method}} Result Amount Comparison",
        amount: "Amount",
        items: {
            firstPayment: "First Payment",
            averagePayment: "Average Payment",
            maximumPayment: "Maximum Payment",
            totalPayment: "Total Payment",
            regularPayment: "Monthly Payment",
            firstMonthPayment: "First Month Payment",
            totalInterest: "Total Interest",
        },
    },

    loanCalculator: {
        titles: {
            monthly: "Monthly Payment",
            interest: "Total Interest",
        },
        fields: {
            loanAmount: "Loan Amount",
            annualInterestRate: "Annual Interest Rate",
            loanMonths: "Loan Term",
            graceMonths: "Grace Period",
            repaymentMethod: "Repayment Method",
        },
        units: {
            tenThousandWon: "10,000 KRW",
            months: "months",
            percent: "%",
        },
        methods: {
            bullet: "Bullet Repayment",
            equalPayment: "Equal Payment",
            equalPrincipal: "Equal Principal",
        },
        descriptions: {
            bullet: "Pay interest until the end of the loan term and repay the principal at maturity.",
            equalPayment: "Pay the same total amount of principal and interest each month.",
            equalPrincipal:
                "Repay the same amount of principal each month while interest gradually decreases.",
            equalPaymentWithGrace:
                "Pay interest only during the grace period, then pay the same total amount of principal and interest each month.",
            equalPrincipalWithGrace:
                "Pay interest only during the grace period, then repay the same amount of principal each month while interest gradually decreases.",
        },
        schedule: {
            title: "Monthly Repayment Schedule",
            summary: "{{method}} · {{count}} payments",
            ariaLabel: "{{method}} monthly repayment schedule table",
            columns: {
                month: "Payment No.",
                principal: "Principal",
                interest: "Interest",
                payment: "Total Payment",
                repayment: "Repayment",
                cumulativePrincipal: "Cumulative Principal",
                balance: "Remaining Balance",
            },
        },
        calculate: "Calculate",
        fallbackError: "Unable to calculate. Please check your input.",
    },

    institutionGuide: {
        title: "What kind of consultation do you need?",
        optionsLoadError: "Unable to load selection options.",
        reloadOptions: "Reload options",
        noTopics: "No consultation categories are available.",
        provinceLabel: "Preferred region · Province/Metropolitan city",
        districtLabel: "Preferred region · City/County/District",
        consultationLanguageLabel: "Consultation language",
        consultationMethodLabel: "Consultation method",
        selectedConditionsTitle: "Selected consultation conditions",
        conditionsChanged:
            "Changing the conditions hides the previous results. Select Get Guidance to check them again.",
        selectedProvinceLabel: "Preferred region",
        languages: {
            ko: "Korean",
            en: "English",
            zh: "Chinese",
            ja: "Japanese",
            vi: "Vietnamese",
            th: "Thai",
        },
        topicLabel: "Consultation category",
        keywordLabel: "Consultation keywords",
        chooseTopicAndKeywords: "Select a consultation category and keywords.",
        chooseKeywords: "Select at least one consultation keyword.",
        selectedKeywords: "{{count}} keyword(s) selected",
        submit: "Get Guidance",
        searchLabel: "Search organizations or consultation topics",
        searchPlaceholder:
            "e.g. 임금체불 (unpaid wages), 통장 만들기 (opening an account), 외국인등록 (foreigner registration)",
        queryReady: "Search organizations using your keyword and current selections.",
        showAll: "View All Organizations",
        all: "All",
        resultsTitle: "Support Organization Results",
        resultCount: "{{count}} organization(s)",
        loading: "Loading organization information.",
        loadError:
            "Unable to load organization information. Check the server connection and try again.",
        invalidInput: "Check your search conditions.",
        retry: "Retry",
        empty: "No organizations match your conditions. Use fewer keywords or view all organizations.",
        unknown: "Needs confirmation",
        multilingual: "Multiple languages",
        available: "Available",
        unavailable: "Unavailable",
        phoneAgentUnavailable: "Phone consultation unavailable",
        phone24Hours: "Open 24 hours",
        phoneOpenWithinHours: "Available during consultation hours",
        required: "Reservation required",
        notRequired: "Not required",
        detail: "View Details",
        detailTitle: "Organization Details",
        close: "Back to List",
        notFound: "Organization not found.",
        administration: "Administrative and daily-life guidance",
        servicesTitle: "Consultation categories and keywords",
        scopeNotesTitle: "Consultation scope and notes",
        usageInfoTitle: "How to use this service",
        usageVariant: "Usage guide {{count}}",
        partialNotice:
            "Only partial information has been confirmed. Check the latest conditions with the organization before using the service.",
        rankingNotice:
            "Direct consultation organizations are listed first, followed by keyword matches and verified conditions. The match rate is not an eligibility or approval probability.",
        matchCount: "{{matched}} of {{total}} selected keywords matched · {{percent}}%",
        matchedList: "Matched keywords: {{keywords}}",
        chartTitle: "Selected keyword matches for top organizations",
        matchedLabel: "Matched keywords",
        specialHours: "Special hours: {{scope}} — {{hours}}",
        phoneNationwide: "No regional restriction for phone access",
        preparationUnknown:
            "Check the required documents after choosing the organization and service you need.",
        reservationLink: "Reservation information",
        onlineLink: "Online consultation",
        serviceSource: "Service source",
        officialLink: "Official website",
        sourceLink: "Reference {{count}}",
        prepareCard: "Create a Consultation Preparation Card",

        translation: {
            show: "Show translation",
            hide: "Show original",
            translating: "Translating...",
            label: "AI translation",
            error: "Translation failed. Please try again shortly.",
        },

        roles: {
            direct: "Direct consultation",
            related: "Related consultation, service, or institution guidance",
            unknown: "Consultation role needs confirmation",
        },

        methods: {
            phone: "Phone",
            visit: "Visit",
            online: "Online",
            reservation: "Reservation",
            unknown: "Needs confirmation",
        },

        pending: {
            method: "Consultation method needs confirmation",
            language: "Selected language needs confirmation",
            region: "Selected region needs confirmation",
        },

        fields: {
            location: "Service area and visit guidance",
            phoneHours: "Phone consultation hours",
            visitHours: "In-person consultation hours",
            phoneWeekend: "Weekend phone consultation",
            phoneHoliday: "Holiday phone consultation",
            phoneLanguages: "Phone consultation languages",
            visitLanguages: "In-person consultation languages",
            methods: "Consultation methods",
            visitAddress: "Consultation location",
            visitWeekend: "Weekend in-person consultation",
            visitHoliday: "Holiday in-person consultation",
            reservationRequired: "Visit reservation",
            branch: "Branch and reservation guidance",
            languageNotes: "Language-specific guidance",
            contact: "How to use the service",
            target: "Eligible users",
            preparation: "Required documents and preparation",
            address: "Institution address",
            phone: "Contact number",
            keywords: "Main consultation keywords",
            checkedAt: "Information checked on",
        },
        multipleKeywords: "(Multiple selections allowed)",

        selectionLabels: {
            "출입국·행정": "Immigration & Administration",
            "비자·체류": "Visa & Stay",
            외국인등록: "Foreigner Registration",
            "민원·증명서": "Civil Services & Certificates",

            "노동·취업": "Labor & Employment",
            "임금·퇴직금": "Wages & Severance Pay",
            "근로계약·근무조건": "Employment Contracts & Working Conditions",
            "취업·고용": "Jobs & Hiring",

            "금융·채무": "Finance & Debt",
            "대출·서민금융": "Loans & Financial Support",
            "채무·신용회복": "Debt & Credit Recovery",
            "금융민원·피해": "Financial Complaints & Damage",

            "보험·연금": "Insurance & Pensions",
            건강보험: "National Health Insurance",
            국민연금: "National Pension",
            "산재·고용보험": "Industrial Accident & Employment Insurance",

            세금: "Taxes",
            "세금신고·납부": "Tax Filing & Payment",
            연말정산: "Year-end Tax Settlement",
            세금환급: "Tax Refund",

            "생활·복지·법률": "Daily Life, Welfare & Legal Services",
            복지지원: "Welfare Support",
            "가족·생활상담": "Family & Daily Life Counseling",
            "법률·주거분쟁": "Legal & Housing Disputes",
        },
        topics: {
            bank: "Accounts & Banking",
            loan: "Loans",
            repayment: "Debt & Repayment",
            credit: "Credit Management",
            living: "Living Expenses & Spending",
            wages: "Wages & Pay",
            employment_contract: "Employment Contracts & Working Conditions",
            retirement: "Retirement & Severance Pay",
            employment: "Jobs & Job Seeking",
            remittance: "Remittance & Transfers",
            payment: "Cards & Payments",
            housing: "Housing Costs",
            tax: "Taxes",
            insurance: "Insurance & Social Security",
            fraud: "Financial Fraud & Damage",
            financial_support: "Financial Support & Welfare",
            financial_information: "Financial Information & Basic Consultation",
        },
    },

    admin: {
        dashboard: {
            eyebrow: "Operations Overview",
            title: "Admin Dashboard",
            description: "View the current operational status of ForGuide.",
            loading: "Loading operations overview.",
            loadError: "Failed to load operations overview.",
            retry: "Try Again",
            metrics: {
                members: "Total Members",
                posts: "Total Posts",
                comments: "Total Comments",
            },
            management: {
                title: "Management",
                members: {
                    title: "Member Management",
                    description: "View members and manage account status.",
                },
                inquiries: {
                    title: "Inquiry Management",
                    description: "Review member inquiries and submit answers.",
                },
                community: {
                    title: "Community Management",
                    description: "Review posts and comments and manage visibility.",
                },
            },
        },

        inquiries: {
            title: "Inquiry Management",
            description: "Review member inquiries and submit answers.",
            filter: {
                all: "All",
                received: "Received",
                answered: "Answered",
            },
            loading: "Loading inquiries.",
            empty: "There are no inquiries to display.",
            loadError: "Failed to load inquiries.",
            retry: "Try Again",
            loadMore: "Load More Inquiries",
            member: "Member",
            answer: "Submit Answer",
            answerPlaceholder: "Write an answer for the member.",
            submitting: "Submitting...",
            answerSuccess: "The answer has been submitted.",
            answerError: "Failed to submit the answer.",
            alreadyAnswered: "This inquiry has already been answered.",
            answerRequired: "Please enter an answer.",
        },

        members: {
            eyebrow: "Member Management",
            title: "Manage Member Status",
            description: "Search members and suspend or activate their accounts.",
            statusLabel: "Member Status",
            statusAll: "All Statuses",
            statusActive: "Active Members",
            statusSuspended: "Suspended Members",
            searchLabel: "Search Members",
            searchPlaceholder: "ID, name, nickname, or email",
            search: "Search",
            loading: "Loading members.",
            empty: "There are no members to display.",
            loadError: "Failed to load members.",
            retry: "Try Again",
            updateError: "Failed to change member status.",
            suspend: "Suspend",
            activate: "Activate",
            updating: "Updating...",
            suspendSuccess: "The member has been suspended.",
            activateSuccess: "The member has been activated.",
            joinedAt: "Joined At",
            status: {
                ACTIVE: "Active",
                SUSPENDED: "Suspended",
            },
            role: {
                USER: "Member",
                ADMIN: "Administrator",
            },
        },

        community: {
            eyebrow: "Community Management",
            title: "Manage Community Content",
            description: "Review posts and comments, then hide or restore them when necessary.",

            resourceTypeLabel: "Content Type",
            resourceTypeAll: "All Content",
            resourceTypePost: "Posts",
            resourceTypeComment: "Comments",

            statusLabel: "Visibility",
            statusAll: "All Statuses",
            statusVisible: "Visible",
            statusHidden: "Hidden",
            confirmHide: "Hide Content",
            cancel: "Cancel",

            searchLabel: "Search Content",
            searchPlaceholder: "Content, author ID, or nickname",
            search: "Search",

            loading: "Loading community content.",
            empty: "There is no community content to display.",
            loadError: "Failed to load community content.",
            retry: "Try Again",
            loadMore: "Load More Content",

            reportsTitle: "Submitted Reports",
            reportsLoading: "Loading reports.",
            reportsLoadError: "Failed to load reports.",
            reportsEmpty: "There are no submitted reports.",
            targetLabel: "Reported author",
            reportStatusLabel: "Report status",
            handledAtLabel: "Handled at",
            reportStatus: {
                PENDING: "Pending",
                HIDDEN: "Content hidden",
                DISMISSED: "Report dismissed",
            },
            hideReportedContent: "Hide Content",
            dismissReport: "Dismiss Report",
            openMemberManagement: "Open Member Management",
            reportHiddenSuccess: "The content was hidden and related reports were processed.",
            reportDismissSuccess: "The report was dismissed.",
            reportActionError: "Failed to process the report.",
            reportReasonLabel: "Report reason",
            reporterLabel: "Reporter",
            viewEvidence: "View evidence",

            evidenceTitle: "Report Evidence Images",
            evidenceLoading: "Loading evidence images.",
            evidenceEmpty: "There are no attached evidence images.",
            evidenceImageAlt: "Report evidence image {{index}}",
            reportImagesLoadError: "Failed to load evidence images.",
            close: "Close",

            hide: "Hide",
            restore: "Restore",
            updating: "Updating...",
            updateError: "Failed to change visibility.",
            hideSuccess: "The content has been hidden.",
            restoreSuccess: "The content has been restored.",

            reasonLabel: "Management Reason",
            reasonPlaceholder: "Optionally enter a reason for hiding.",
            reasonNone: "No management reason was recorded.",
            createdAt: "Created At",
            moderatedAt: "Moderated At",
        },

        recommendationUsage: {
            eyebrow: "Recommendation Usage",
            title: "Recommendation Operations",
            description:
                "Usage statistics for loan, insurance, and account recommendations recorded without personal information.",
            periodLabel: "Period",
            period7: "Last 7 Days",
            period30: "Last 30 Days",
            period90: "Last 90 Days",
            totalUsage: "Total Recommendations",
            loanUsage: "Loan Recommendations",
            insuranceUsage: "Insurance Recommendations",
            accountUsage: "Account Recommendations",
            latestUsedAt: "Latest Recommendation",
            outcomeTitle: "Recommendation Outcome",
            productResult: "Product Results",
            consultationRedirect: "Consultation Redirect",
            chartTitle: "Daily Recommendation Trend",
            chartTotal: "Total",
            chartLoan: "Loans",
            chartInsurance: "Insurance",
            chartAccount: "Accounts",
            chartTooltip: "Usage Count",
            loading: "Loading recommendation usage.",
            loadError: "Failed to load recommendation usage.",
            retry: "Try Again",
            emptyLatestUsedAt: "No recommendation activity yet.",
            dashboardTitle: "Recommendation Usage",
            dashboardDescription:
                "View usage statistics for loan, insurance, and account recommendations.",
        },
    },

    inquiry: {
        title: "Contact Us",
        description: "Leave your questions or requests for help while using the service.",
        form: {
            category: "Inquiry type",
            title: "Title",
            content: "Inquiry details",
            titlePlaceholder: "Enter an inquiry title.",
            contentPlaceholder:
                "Describe your inquiry in detail. An administrator will review it and reply.",
            submit: "Submit Inquiry",
            submitting: "Submitting...",
            success: "Your inquiry has been submitted.",
            submitError: "Unable to submit your inquiry. Please try again shortly.",
        },
        images: {
            add: "Add Image",
            help: "JPG/PNG · Up to 4 images · 4 MB each",
            selected: "{{count}} image(s) selected.",
            label: "Inquiry attachments",
            alt: "Inquiry attachment {{index}}",
            previewLabel: "Selected inquiry image preview",
            previewAlt: "Selected inquiry image {{index}}",
        },
        category: {
            SERVICE: "Using the service",
            ACCOUNT: "Account & login",
            FINANCE: "Financial information",
            OTHER: "Other",
        },
        myList: {
            title: "My Inquiries",
            loading: "Loading your inquiries...",
            empty: "You have not submitted any inquiries.",
            loadError: "Unable to load your inquiries.",
            retry: "Try Again",
            loadMore: "Load More Inquiries",
            delete: "Delete",
            deleting: "Deleting...",
            deleteConfirm: "Delete this unanswered inquiry? Its attachments will also be deleted.",
            deleteError: "Unable to delete the inquiry. Please try again later.",
        },
        status: {
            RECEIVED: "Received",
            ANSWERED: "Answered",
        },
        answer: {
            title: "Administrator Reply",
        },

        translation: {
            show: "Show translation",
            hide: "Show original",
            translating: "Translating...",
            label: "AI translation",
            error: "Translation failed. Please try again shortly.",
        },
    },

    notification: {
        bellAria: "Notifications, {{count}} unread",
        title: "Notifications",
        markAllRead: "Mark all as read",
        loading: "Loading notifications.",
        empty: "No new notifications.",
        loadError: "Unable to load notifications.",
        retry: "Retry",
        loadMore: "Show more notifications",
        unread: "Unread",
        unknownActor: "Unknown user",

        postLiked: "{{actor}} liked your post.",
        postUnliked: "{{actor}} removed a like from your post.",
        postReposted: "{{actor}} reposted your post.",
        postUnreposted: "{{actor}} removed a repost from your post.",
        postCommented: "{{actor}} commented on your post.",
        commentReplied: "{{actor}} replied to your comment.",
        commentMentioned: "{{actor}} mentioned you.",

        popularTop10: "Your post has reached 10th place in popular posts.",
        popularTop3: "Your post has reached 3rd place in popular posts.",
        popularTop2: "Your post has reached 2nd place in popular posts.",
        popularTop1: "Your post has reached 1st place in popular posts.",
    },

    navigation: {
        counseling: "Consultation",
        recommendation: "Recommendations",
        repayment: "Calculation Helper",
        employment: "Employment Helper",
        simulator: "Simulator",
        community: "Community",
    },

    home: {
        features: {
            counseling: {
                consultation: "Find Support Organizations",
                preparationCard: "Create a Consultation Checklist",
            },
            recommendation: {
                loan: "Loan Recommendations",
                insurance: "Insurance Recommendations",
                account: "Bank Account Recommendations",
            },
            repayment: {
                monthlyPayment: "Monthly Payment",
                totalInterest: "Total Interest",
            },
            employment: {
                jobListings: "Job Listings",
                employment: "Job Preparation Resources",
            },
            simulator: {
                simulator: "Simulator",
            },
            community: {
                community: "Community",
            },
        },
    },

    community: {
        navigation: {
            allPosts: "All Posts",
            questionAnswer: "Q&A",
            reviewRecommend: "Reviews & Recommendations",
            freeTalk: "Free Talk",
        },

        topics: {
            title: "Main Topics",
            account: "Open an Account",
            loan: "Loans",
            insurance: "Insurance",
            visaStay: "Visa & Stay",
            lifeTip: "Korea Living Tips",
        },

        board: {
            title: "Community",
            searchPlaceholder: "Search posts.",
            searchAria: "Search post content",
            searchSubmitAria: "Search",
            writePlaceholder: "Share useful information about life in Korea.",
            writeAria: "Post content",
            categoryLabel: "Category",
            questionAnswer: "Q&A",
            reviewRecommend: "Reviews & Recommendations",
            freeTalk: "Free Talk",
            relatedServiceLabel: "Related Service",
            noRelatedService: "No Link",
            addImage: "Add Image",
            imageGuide: "JPG/PNG · Up to 4 images · 4 MB each",
            submit: "Post",
            submitting: "Posting...",
        },

        relatedServices: {
            account: "Open an Account",
            loan: "Explore Loans",
            insurance: "Explore Insurance",
            employment: "Employment Helper",
        },
        report: {
            action: "Report",
            title: "Report content",
            description: "Choose a reason and an administrator will review it.",
            reason: "Reason",
            reasons: {
                SPAM_AD: "Spam or advertising",
                ABUSE_HATE: "Abusive or hateful content",
                SEXUAL_CONTENT: "Sexual content",
                MISINFORMATION: "Misinformation",
                OTHER: "Other",
            },
            cancel: "Cancel",
            submit: "Submit report",
            submitting: "Submitting...",
            addImage: "Add image",
            imageGuide: "JPG/PNG · Up to 4 images · 4 MB each",
            maxImageCount: "You can attach up to {{count}} images.",
            selectedImageAlt: "Selected report evidence image {{index}}",
            removeImage: "Remove image",
            error: "We could not submit the report. Please try again shortly.",
        },

        post: {
            reposted: "Reposted by me",
            edit: "Edit",
            delete: "Delete",
            deleting: "Deleting...",
            detailsAria: "View post details",
            imageAlt: "Post image {{index}}",
            like: "Like",
            unlike: "Unlike",
            repost: "Repost",
            unrepost: "Undo repost",
            viewAria: "{{count}} views",
            views: "Views",
            comments: "Comments",
            closeComments: "Close comments",
            likeLoadError: "Unable to load like information.",
            likeLoginRequired: "Please log in to like this post.",
            likeActionError: "Unable to process the like.",
            repostLoadError: "Unable to load repost information.",
            repostLoginRequired: "Please log in to repost this post.",
            repostActionError: "Unable to process the repost.",
        },

        feed: {
            selectedImageAlt: "Selected image: {{name}}",
            deleteImageAria: "Delete {{name}}",
            tabsAria: "Select community feed",
            allPosts: "All Posts",
            myReposts: "My Reposts",
            loading: "Loading posts...",
            retry: "Try Again",
            popularAreaAria: "Recent posts",
            popularTitle: "Popular Posts",
            popularSortAria: "Sort popular posts",
            sortByLikes: "Most Liked",
            sortByViews: "Most Viewed",
            popularDetailsAria: "View details for {{preview}}",
            likeCount: "Likes {{count}}",
            viewCount: "Views {{count}}",
            popularEmpty: "There are no posts to display yet.",
        },

        memberPreview: {
            triggerAria: "Preview {{nickname}}'s profile",
            cardAria: "Profile preview",
            loading: "Loading profile...",
            error: "Unable to load profile information.",
            unnamedMember: "Unnamed member",
            defaultIntro: "This member has not written an introduction yet.",
            postCount: "Posts",
            receivedLikes: "Likes received",
            postsButtonAria: "View {{count}} posts by {{nickname}}",
        },

        memberPosts: {
            title: "Posts by {{nickname}}",
            loading: "Loading posts...",
            empty: "There are no posts yet.",
            error: "Unable to load posts.",
            close: "Close",
            imageOnly: "Photo post",
            viewCount: "{{count}} views",
            commentCount: "{{count}} comments",
        },

        postModal: {
            title: "Post",
            close: "Close",
            loading: "Loading post...",
            error: "Unable to load post.",
            viewCount: "Views",
            commentCount: "Comments",
            reactionLoadError: "Unable to load reaction information.",
            likeLoginRequired: "Please log in to like this post.",
            likeActionError: "Unable to process the like.",
            repostLoginRequired: "Please log in to repost this post.",
            repostActionError: "Unable to process the repost.",
            imageAlt: "Post image {{index}}",
            like: "Like",
            unlike: "Unlike",
            repost: "Repost",
            unrepost: "Undo repost",
            showTranslation: "Show translation",
            hideTranslation: "Hide translation",
            translating: "Translating...",
            aiTranslation: "AI translation",
            translationError: "Unable to translate this post. Please try again shortly.",
        },

        comments: {
            title: "Comments",
            loading: "Loading comments...",
            empty: "No comments yet.",
            loadError: "Unable to load comments.",
            contentRequired: "Please enter a comment.",
            maxLength: "Comments must be 1,000 characters or fewer.",
            loginRequired: "Please log in to write a comment.",
            saveError: "Unable to save the comment.",
            updateError: "Unable to update the comment.",
            deleteConfirm: "Delete this comment?",
            deleteError: "Unable to delete the comment.",
            deleted: "Deleted comment",
            reply: "Reply",
            like: "Like",
            unlike: "Unlike",
            likeError: "Unable to process the comment like.",
            edit: "Edit",
            cancel: "Cancel",
            delete: "Delete",
            deleting: "Deleting...",
            showTranslation: "Show translation",
            hideTranslation: "Hide translation",
            translating: "Translating...",
            aiTranslation: "AI translation",
            translationError: "Unable to translate this comment. Please try again shortly.",
            submit: "Submit",
            submitting: "Submitting...",
            replyPlaceholder: "Write a reply to {{nickname}}",
            writePlaceholder: "Write a comment.",
            writeButton: "Write Comment",
        },

        postEdit: {
            contentAria: "Edit post content",
            imageAlt: "Existing post image",
            invalidImage: "Only JPG or PNG images up to 4 MB each can be uploaded.",
            maxImageCount: "You can upload up to 5 images per post.",
            contentRequired: "Please enter post content.",
            updateError: "Unable to update the post.",
            removeCancel: "Cancel removal",
            removeImage: "Remove image",
            addImage: "Add image",
            removeNewImage: "Remove",
            cancel: "Cancel",
            submitting: "Updating...",
            submit: "Save Changes",
        },

        feedback: {
            popularLoadError: "Unable to load popular posts.",
            optionsLoadError: "Unable to load community options. Please try again.",
            myRepostsLoginRequired: "Please log in to view your reposts.",
            postsLoadError: "Unable to load posts.",
            imageCountLimit: "You can attach up to {{count}} images.",
            imageValidation: "Only JPG or PNG files up to 4 MB each can be attached.",
            writeLoginRequired: "Please log in to create a post.",
            contentRequired: "Add post content or an image.",
            writeFailed: "Unable to create the post.",
            deleteConfirm: "Delete this post?",
            deleteFailed: "Unable to delete the post.",
            imageOnlyPost: "Post with images",
        },

        accessibility: {
            explore: "Explore community",
            postTypeNavigation: "Post categories",
            board: "Community board",
        },
    },

    service: {
        consultation: {
            description:
                "Choose the issue you need help with and find support organizations that match your situation.",
        },
        preparationCard: {
            description:
                "Check the required documents and identification items before your consultation.",
        },
        loan: {
            description:
                "Enter your loan information and explore products that match your purpose.",
        },
        insurance: {
            description:
                "Explore insurance products that match your basic information and coverage needs.",
        },
        account: {
            description:
                "Explore bank accounts that suit purposes such as receiving wages and sending money.",
        },

        monthlyPayment: {
            description:
                "Enter the loan amount, interest rate, and term to check an estimated monthly payment.",
        },
        totalInterest: {
            description:
                "Check the estimated total interest and total repayment amount for the repayment period.",
        },
        jobListings: {
            description: "Explore job listings that match your needs.",
        },
        employment: {
            description: "Create, save, or print a resume that fits your application method.",
        },
        simulator: {
            description:
                "Organize repayment dates, income, and expenses on a calendar to plan your daily spending.",
        },
        community: {
            description:
                "Share experiences and information about life in Korea and connect with others.",
        },
    },

    simulator: {
        title: "Spending Plan Simulator",
        period: "Calculation Period",
        dateFormat: "YYYY-MM-DD",
        fields: {
            payment: "Monthly Loan Payment",
            start: "Start Date",
            end: "End Date",
            cash: "Current Cash",
            income: "Monthly Income",
            fixed: "Monthly Fixed Expenses",
            food: "Monthly Food Expenses",
            living: "Monthly Living Expenses",
        },
        units: {
            won: "KRW",
            tenThousand: "ten thousand",
            hundredMillion: "hundred million",
            trillion: "trillion",
        },
        calculate: "Calculate",
        calendar: "Daily Spending Calendar",
        previous: "Previous Month",
        next: "Next Month",
        weekdays: {
            0: "Sun",
            1: "Mon",
            2: "Tue",
            3: "Wed",
            4: "Thu",
            5: "Fri",
            6: "Sat",
        },
        calendarHint:
            "Use the wheel or swipe to move by month. Select a date to allocate an extra amount.",
        dayLabel: "{{date}} · Additional amount available: {{amount}} · Set as a large-expense day",
        outsideDay: "{{date}} · Outside the calculation period",
        extraTitle: "Set large-expense day: {{date}}",
        extraAmount: "Additional amount to allocate on this date",
        extraHint:
            "The base budget for other days is reduced by this amount. Apply 0 KRW or remove the allocation.",
        apply: "Apply",
        remove: "Remove Allocation",
        close: "Close",
        results: "Calculation Results",
        available: "Total Additional Amount Available",
        days: "Calculation Days",
        daily: "Daily Base Additional Budget",
        extraTotal: "Total Large-Expense Allocation",
        dayCount: "{{count}} days",
        formula:
            "Cash {{cash}} + Period income {{income}} − Payment {{payment}} − Fixed expenses {{fixed}} − Food {{food}} − Living expenses {{living}} = {{balance}}",
        dailyFormula:
            "({{available}} − Extra allocation {{extra}}) ÷ {{days}} days = Daily base amount {{daily}}.",
        remainder:
            "The remaining amount is distributed by adding 1 KRW to each of the first {{count}} days.",
        shortfall:
            "You are short by {{amount}} compared with planned expenses. Additional daily budgets are shown as 0 KRW.",
        assumption:
            "The start and end dates are included. Monthly income and expenses are prorated for partial months and rounded to the nearest KRW. Cash is also allocated across the full period. Actual deposit and withdrawal dates are not reflected.",
        chartLabel: "Comparison of planned expenses and additional amount available for the period",
        chartLegend: "Light mint: planned expenses · Dark green: additional amount available",
        errors: {
            required: "Enter an amount. Enter 0 if there is no amount.",
            digits: "Only numbers can be entered.",
            limit: "The maximum amount is KRW 10 trillion.",
            dates: "Enter valid start and end dates.",
            dateOrder: "The end date must be the same as or later than the start date.",
            extraLimit: "The total extra allocation exceeds the total available amount.",
            outside: "Select a date within the calculation period.",
        },
    },

    resume: {
        page: {
            title: "Employment Preparation",
            description: "Create, save, or print an A4 resume that fits your application method.",
            tabListAria: "Select a resume format",
            basicTab: "Standard Resume",
            blindTab: "Blind Recruitment Resume",
            basicSheetTitle: "Resume",
            blindSheetTitle: "Blind Recruitment Resume",
        },

        actions: {
            save: "Save",
            saving: "Saving...",
            load: "Load",
            print: "Print",
            translateToKorean: "Create Korean Draft",
        },

        translation: {
            eyebrow: "AI Translation Draft",
            title: "Review Korean Translation",
            description: "Review and edit the translation draft before applying it.",
            original: "Original",
            koreanDraft: "Korean Translation Draft",
            translating: "Creating a Korean translation draft.",
            translate: "Translate to Korean",
            cancel: "Cancel",
            retry: "Try Again",
            apply: "Apply Translation",
            closeAria: "Close translation dialog",
            failed: "Unable to translate. Please try again shortly.",
            progress: "Reviewing item {{current}} of {{total}}",
            applyAndNext: "Apply and Continue",
            noContent: "Enter content to translate into Korean first.",
        },
        personal: {
            basicTitle: "Personal Information",
            blindTitle: "Application Information",
            photoPreviewAlt: "Selected photo preview",
            selectPhoto: "Select Photo",
            removingPhoto: "Removing...",
            removePhoto: "Remove",
            name: "Name",
            koreanNamePlaceholder: "(Korean)",
            englishNamePlaceholder: "(English)",
            birthDate: "Date of Birth",
            phone: "Phone",
            phonePlaceholder: "Mobile phone",
            email: "Email",
            address: "Address",
            receiptNumber: "Application Number",
            targetJob: "Position Applied For",
        },
        sections: {
            education: "Education",
            career: "Work Experience",
            certificates: "Certificates",
            awards: "Awards",
            jobEducation: "Job-related Education",
        },
        columns: {
            schoolName: "School",
            major: "Major",
            degree: "Degree",
            period: "Period",
            companyName: "Company",
            jobDuty: "Responsibilities",
            position: "Position",
            certificateName: "Certificate",
            grade: "Grade",
            issuer: "Issuing Organization",
            acquiredAt: "Date Acquired",
            awardName: "Award",
            organization: "Awarding Organization",
            awardedAt: "Date Received",
            jobField: "Job Field",
            field: "Training Field",
            courseName: "Course",
            completionStatus: "Completion Status",
        },
        table: { cellAria: "{{title}}, row {{row}}, {{column}}" },
        messages: {
            temporaryPhotoSaveFailed: "Unable to temporarily save the selected photo.",
            photoDeleted: "Photo removed.",
            photoDeleteFailed: "Unable to remove the photo. Please try again.",
            saved: "{{resumeName}} has been saved.",
            saveFailed: "Unable to save. Please try again.",
            libraryLoadFailed: "Unable to load the saved resume list.",
            draftNotFound: "Saved resume not found.",
            draftLoaded: "Saved resume loaded.",
            draftLoadFailed: "Unable to load the saved resume.",
        },
        library: {
            title: "Load Saved Resume",
            description: "Selecting a saved resume replaces the current content with that draft.",
            close: "Close",
            loading: "Loading saved resumes...",
            empty: "No saved resumes.",
        },
    },

    jobListings: {
        page: {
            title: "Job Listings",
            description:
                "Find employment information and support organizations that fit your needs.",
        },
        actions: {
            details: "View Details",
            openSite: "Open Site",
            openOfficialSite: "Open Official Site",
            close: "Close",
        },
        labels: {
            target: "Who It's For",
            language: "Languages",
            region: "Select Region",
        },
        detailModal: {
            about: "What Is This Service?",
            recommendedFor: "Who May Find This Useful?",
            caution: "Before You Use It",
            source: "Source",
            verifiedAt: "Verified",
            unknown: "Needs Confirmation",
            closeAria: "Close details",
        },
        content: {
            sections: {
                public: {
                    title: "Public Employment Support for Foreign Nationals",
                    description:
                        "Public employment services and support organizations for foreign nationals.",
                },
                worker: {
                    title: "Job Information for Foreign Workers",
                    description:
                        "Job postings and employer connection services for foreign workers.",
                },
                student: {
                    title: "Employment Support for International Students",
                    description:
                        "Employment information and support for international students studying in Korea.",
                },
                regional: {
                    title: "Regional Employment and Counseling Support",
                    description:
                        "Employment support centers and counseling organizations by region.",
                },
            },
            regions: {
                seoul: "Seoul",
                gyeonggi: "Gyeonggi",
                incheon: "Incheon",
                busan: "Busan",
                daegu: "Daegu",
                gwangju: "Gwangju",
                daejeon: "Daejeon",
                ulsan: "Ulsan",
                sejong: "Sejong",
                gangwon: "Gangwon",
                chungbuk: "North Chungcheong",
                chungnam: "South Chungcheong",
                jeonbuk: "North Jeolla",
                jeonnam: "South Jeolla",
                gyeongbuk: "North Gyeongsang",
                gyeongnam: "South Gyeongsang",
                jeju: "Jeju",
            },
            listings: {
                work24: {
                    title: "Public Employment Service for Foreign Nationals",
                    summary: "Find public job information and employment support services.",
                    language: "Check the official website",
                    target: "Foreign nationals living in Korea",
                    detail: "Employment24 provides job information and public employment support services.",
                    recommendedFor: {
                        0: "Foreign nationals starting a job search in Korea",
                        1: "Job seekers looking for public job postings",
                        2: "Users checking employment support programs",
                    },
                    caution:
                        "Some services may require sign-in or confirmation of personal eligibility.",
                },
                eps: {
                    title: "Employment Support Guide for Foreign Workers",
                    summary:
                        "Guidance on employment procedures and stay-related support for foreign workers.",
                    language: "Check the official website",
                    target: "Foreign workers and employers",
                    detail: "The Employment Permit System (EPS) provides official information on working in Korea and online employment services for foreign workers.",
                    recommendedFor: {
                        0: "Foreign workers checking Korean employment procedures",
                        1: "Users seeking E-9 or H-2 information",
                        2: "Employers hiring foreign workers",
                    },
                    caution:
                        "Eligibility, eligible countries, and permitted industries differ by individual circumstances.",
                },
                kowork: {
                    title: "Job Platform for Foreign Nationals",
                    summary: "Browse a range of job postings for foreign job seekers.",
                    language: "Korean · English",
                    target: "Foreign nationals seeking employment",
                    detail: "KOWORK offers job postings and career support information for foreign nationals seeking work in Korea.",
                    recommendedFor: {
                        0: "Job seekers looking for foreigner-friendly postings",
                        1: "Users needing resume or interview preparation support",
                        2: "Users checking visa-support information in postings",
                    },
                    caution: "Eligibility, visa support, and working conditions vary by posting.",
                },
                kwork: {
                    title: "Foreign Talent Recruitment Matching",
                    summary:
                        "Employment matching information connecting international students with Korean companies.",
                    language: "Check the official website",
                    target: "International students and small-to-medium enterprises",
                    detail: "K-WORK connects international students with Korean SMEs through job postings, resume registration, and employment counseling.",
                    recommendedFor: {
                        0: "International students preparing for work in Korea",
                        1: "SMEs seeking foreign talent",
                        2: "Users looking for both postings and employment support",
                    },
                    caution:
                        "Service eligibility and visa-related conditions may differ by program and posting.",
                },
                "study-prep": {
                    title: "International Student Employment Support Portal",
                    summary:
                        "Find information and support programs for preparing to work in Korea.",
                    language: "Check the official website",
                    target: "International students in Korea",
                    detail: "Study in Korea is a government portal with information on job types, job preparation, hiring platforms, and employment systems.",
                    recommendedFor: {
                        0: "International students new to the Korean job-search process",
                        1: "Students exploring roles that match their major or experience",
                        2: "Users seeking both hiring platforms and support information",
                    },
                    caution:
                        "Visa changes, part-time work permits, and eligible jobs depend on individual circumstances.",
                },
                "study-jobs": {
                    title: "International Student Internships and Jobs",
                    summary:
                        "Find internship and employment information for international students.",
                    language: "Check the official website",
                    target: "International students in Korea",
                    detail: "Study in Korea job information helps international students search postings and review internship and employment guidance.",
                    recommendedFor: {
                        0: "Users looking for postings for international students",
                        1: "Students considering internships and full-time jobs",
                        2: "Users checking visa support in each posting",
                    },
                    caution: "Eligibility, working conditions, and visa support vary by posting.",
                },
                "seoul-student-center": {
                    title: "Seoul Global International Student Support Center",
                    summary:
                        "Employment preparation and counseling for international students in Seoul.",
                    language:
                        "Korean · English · Chinese for selected programs; check each program",
                    target: "International students living in Seoul",
                    detail: "The center provides job-preparation education, career counseling, and resume and personal-statement consulting information for international students in Seoul.",
                    recommendedFor: {
                        0: "International students beginning job preparation in Seoul",
                        1: "Students needing resume or personal-statement consulting",
                        2: "Users seeking career counseling and employment education",
                    },
                    caution: "Application periods, languages, and eligibility differ by program.",
                },
                "seoul-global-center": {
                    title: "Seoul Global Center Resident Support",
                    summary:
                        "Settlement, daily-life, and counseling support for foreign residents in Seoul.",
                    language: "Check the official website",
                    target: "Foreign residents living in Seoul",
                    detail: "Seoul Global Center provides information on daily-life, administrative, and specialist counseling services for foreign residents.",
                    recommendedFor: {
                        0: "Foreign residents checking settlement information in Seoul",
                        1: "Users looking for specialist counseling",
                        2: "Users who need daily-life or administrative support before job preparation",
                    },
                    caution: "Available counseling areas and languages differ by service.",
                },
                "busan-worker-center": {
                    title: "Busan Foreign Workers Support Center",
                    summary:
                        "Employment, legal, and daily-life counseling for foreign workers in Busan.",
                    language: "Multilingual counseling and interpretation in 20 languages",
                    target: "Foreign workers in Busan",
                    detail: "The center provides employment, legal, and daily-life counseling and settlement information for foreign workers in Busan.",
                    recommendedFor: {
                        0: "Foreign workers employed or preparing to work in Busan",
                        1: "Users needing employment or daily-life counseling",
                        2: "Users checking interpretation or multilingual counseling",
                    },
                    caution:
                        "Available languages, reservations, and support vary by time and counseling topic.",
                },
                "busan-resident-center": {
                    title: "Busan Foreign Residents Support Center",
                    summary:
                        "Daily-life, labor, and medical counseling information for foreign residents in Busan.",
                    language: "Korean · English · Chinese · Vietnamese and more",
                    target: "Foreign residents living in Busan",
                    detail: "The center provides information on labor, industrial accidents, medical care, and daily-life counseling for foreign residents in Busan.",
                    recommendedFor: {
                        0: "Foreign residents in Busan needing labor or daily-life counseling",
                        1: "Users seeking basic medical or industrial-accident guidance",
                        2: "Users looking for multilingual counseling",
                    },
                    caution: "Counseling topics and available hours differ by language.",
                },
                employmentCenter: {
                    title: "{{region}} Employment Welfare Plus Center",
                    summary:
                        "Check job information, employment support, and counseling in {{region}}.",
                    language: "Confirm with the center",
                    target: "Job seekers in {{region}}",
                    detail: "The center provides job information, employment support programs, and counseling guidance for {{region}}.",
                    recommendedFor: {
                        0: "Users starting a job search in {{region}}",
                        1: "Users looking for local employment support and counseling",
                        2: "Users checking public job information and support together",
                    },
                    caution:
                        "Available services and counseling languages must be confirmed with each center.",
                },
                epsRegional: {
                    title: "Employment Permit System (EPS) Regional Guide",
                    summary:
                        "Check employment procedures and jurisdictional centers for foreign workers in {{region}}.",
                    language:
                        "Native-language service available; confirm in-person counseling language with the center",
                    target: "Foreign workers with E-9 or H-2 status and employers",
                    detail: "EPS provides employment procedures and jurisdictional employment-center information for foreign workers in {{region}}.",
                    recommendedFor: {
                        0: "Foreign workers checking EPS procedures",
                        1: "Users seeking E-9 or H-2 guidance",
                        2: "Employers checking foreign-worker employment procedures",
                    },
                    caution:
                        "Eligibility, countries, industries, and in-person counseling availability differ by individual case and center.",
                },
            },
        },
        status: {
            loading: "Loading organization information.",
            error: "We could not load the organization information. Please try again later.",
        },
    },

    status: {
        loading: {
            title: "Moving you now. Please wait.",
        },

        empty: {
            title: "No results were found.",
            description: "Change your conditions and try again.",
            changeButton: "Change Conditions",
        },

        error: {
            title: "This page cannot be accessed.",
            homeButton: "Back to Home",
        },

        failure: {
            title: "We could not load the information. Please try again.",
            description: "Please try again shortly.",
            retryButton: "Try Again",
            retryError: "The retry failed. Please try again later.",
        },

        example: {
            title: "Example Display and Privacy Masking",
            description: "The following is an example without real personal information.",
            nameLabel: "Sample Name",
            accountLabel: "Sample Account Number",
        },

        input: {
            title: "Please check your input.",
            description:
                "This is a draft for required-input validation. Actual service fields and rules will be added separately.",
            label: "Input",
            submitButton: "Check Input",
            success: "Required input validation passed.",
            requiredError: "This field is required.",
        },
    },

    exampleBadge: {
        value: "Example Value",
        data: "Sample Data",
    },

    modal: {
        confirm: "Confirm",
        cancel: "Cancel",
    },

    underConstruction: {
        title: "This page is under construction.",
        description: "We will complete it as soon as possible.",
        duckLabel: "A pixel duck bowing its head",
    },

    auth: {
        common: {
            show: "Show",
            hide: "Hide",
            save: "Save",
            saving: "Saving…",
            cancel: "Cancel",
            loginId: "User ID",
            password: "Password",
            optional: "(optional)",
            visaType: "Visa status",
        },
        emailVerification: {
            email: "Email",
            sendCode: "Get code",
            resendCode: "Resend",
            resendIn: "Resend in {{seconds}}s",
            sendingCode: "Sending…",
            codeSent:
                "We sent a verification code to {{email}}. If you don't see it, check your spam folder.",
            codeSentIfRegistered:
                "If {{email}} is registered, we sent a verification code. If you don't see it, check your spam folder.",
            code: "Verification code",
            verifyCode: "Verify",
            verifyingCode: "Verifying…",
            codeTimeLeft: "Time left {{time}}",
            verified: "Your email has been verified.",
            failed: "We couldn't process your request. Please try again shortly.",
        },
        passwordReset: {
            title: "Reset Password",
            description: "Get a verification code at your registered email and set a new password.",
            allDevicesNotice:
                "After the change, you'll be logged out on all devices and need to log in with your new password.",
            submit: "Change password",
            backToLogin: "Back to log in",
            failed: "We couldn't change your password. Please try again shortly.",
        },
        findId: {
            title: "Find User ID",
            description: "Get a verification code at your registered email to see your user ID.",
            result: "Your user ID is {{loginId}}.",
            maskedNotice: "To protect your privacy, only part of your user ID is shown.",
            goLogin: "Log in",
            goPasswordReset: "Reset password",
            failed: "We couldn't find your user ID. Please try again shortly.",
        },
        myFinance: {
            title: "My Financial Information",
            description:
                "You can leave anything you don't know blank. Blank items are marked 'Needs checking'.",
            needCheck: "Needs checking",
            annualIncome: "Annual income (10,000 KRW)",
            manwonHelp: "Enter in units of 10,000 KRW. e.g. 36,000,000 KRW → 3600",
            employmentType: "Employment type",
            existingLoan: "Existing loans (10,000 KRW)",
            existingLoanHelp: "Enter 0 if you have no loans.",
            creditScoreBand: "Credit score range (optional)",
            unknown: "Don't know",
            mainBank: "Main bank",
            visaHelp:
                "This is the same visa status as in your profile. Changing it here also updates your profile.",
            amountInvalid: "Please enter a number from 0 to {{max}}.",
            saved: "Your financial information has been saved.",
            backToMyPage: "Back to My Page",
            loadFailed: "We couldn't load your financial information. Please try again shortly.",
            saveFailed: "We couldn't save your financial information. Please try again shortly.",
            employment: {
                REGULAR: "Full-time",
                CONTRACT: "Contract",
                DAILY: "Day labor",
                SELF_EMPLOYED: "Self-employed",
                FREELANCER: "Freelancer",
                STUDENT: "Student",
                UNEMPLOYED: "Unemployed",
                OTHER: "Other",
            },
            creditBand: {
                GT900: "Over 900",
                "801_900": "801–900",
                "701_800": "701–800",
                "601_700": "601–700",
                "501_600": "501–600",
                "401_500": "401–500",
                "301_400": "301–400",
                LE300: "300 or below",
            },
            bank: {
                OTHER: "Other",
                NONE: "None",
            },
        },
        signup: {
            title: "Sign Up",
            heading: "Get started with ForGuide.",
            givenName: "Given name",
            familyName: "Family name",
            nickname: "Nickname",
            nicknameHelp:
                "This name is shown in the community. 2–20 characters; letters, numbers, and symbols in any language.",
            loginIdHelp: "4–20 lowercase letters (a–z) and numbers",
            nameHelp: "Up to 50 characters",
            familyNameHelp: "Up to 50 characters. Leave blank if you have no family name.",
            emailHelp: "Verify your email with a code to sign up.",
            charCount: "{{count}}/{{max}}",
            charLimitReached: "You can enter up to {{max}} characters. The extra text was removed.",
            passwordRules: {
                length: "8–32 characters",
                lower: "Lowercase",
                upper: "Uppercase",
                digit: "Number",
                special: "Special character",
                met: "(met)",
                notMet: "(not met)",
            },
            checkingLoginId: "Checking your user ID…",
            loginIdAvailable: "This user ID is available.",
            submit: "Sign Up",
            submitting: "Signing up…",
            haveAccount: "Already have an account?",
            goLogin: "Log In",
            failed: "Sign-up failed. Please try again shortly.",
        },
        login: {
            title: "Log In",
            heading: "Welcome back.",
            signedUp: "You're signed up. Enter your password to log in.",
            passwordReset: "Your password has been changed. Log in with your new password.",
            findId: "Find user ID",
            findPassword: "Reset password",
            submit: "Log In",
            submitting: "Logging in…",
            noAccount: "Don't have an account yet?",
            goSignup: "Sign Up",
            failed: "Login failed. Please try again shortly.",
        },
        myPage: {
            title: "My Page",
            description: "Manage your profile and information.",
            selectImage: "Choose image",
            imageSaved: "Your profile image has been saved.",
            imageSaveFailed: "We couldn't save your profile image. Please try again shortly.",
            goProfileEdit: "Edit profile",
            goMyFinance: "My Financial Information",
            goPasswordChange: "Change password",
            passwordChanged:
                "Your password has been changed. You'll need to log in again on other devices.",
        },
        passwordChange: {
            title: "Change Password",
            description: "Confirm your current password, then set a new one.",
            currentPassword: "Current password",
            newPassword: "New password",
            newPasswordConfirm: "Confirm new password",
            otherDevicesNotice: "After the change, you'll be logged out on other devices.",
            submit: "Change",
            failed: "We couldn't change your password. Please try again shortly.",
        },
        profileEdit: {
            title: "Edit Profile",
            description:
                "Update your nickname and information. You can leave anything you're unsure of blank.",
            nickname: "Nickname",
            nicknameHelp: "2–20 characters; letters, numbers, and symbols in any language.",
            language: "Preferred language",
            residenceType: "Residence type",
            job: "Occupation",
            notSelected: "Not selected",
            loginId: "User ID",
            loadFailed: "We couldn't load your information. Please try again shortly.",
            saveFailed: "We couldn't save your profile. Please try again shortly.",
        },
        profileImage: {
            help: "{{formats}}, up to {{maxMb}}MB",
            required: "Please choose an image file.",
            empty: "You can't upload an empty file.",
            invalid: "Please upload a {{formats}} image of {{maxMb}}MB or less.",
            alt: "Profile image",
            altWithName: "{{name}}'s profile image",
        },
        requireAuth: {
            checking: "Checking your login status…",
        },
        validation: {
            listSeparator: ", ",
            loginIdRequired: "Please enter your user ID.",
            loginIdFormat: "Use 4–20 lowercase letters and numbers only.",
            passwordRequired: "Please enter your password.",
            passwordLength: "Your password must be 8–32 characters.",
            passwordCharacters:
                "Your password can't contain spaces or characters outside the English keyboard.",
            passwordMissing: "Your password still needs: {{items}}.",
            passwordParts: {
                lower: "a lowercase letter",
                upper: "an uppercase letter",
                digit: "a number",
                special: "a special character",
            },
            givenNameRequired: "Please enter your given name.",
            nameLength: "Please enter {{max}} characters or fewer.",
            emailRequired: "Please enter your email.",
            emailFormat: "Please enter a valid email address.",
            nicknameRequired: "Please enter a nickname.",
            nicknameLength: "Your nickname must be 2–20 characters.",
            nicknameCharacters: "Your nickname contains characters that aren't allowed.",
            currentPasswordRequired: "Please enter your current password.",
            passwordSameAsCurrent: "Please choose a password different from your current one.",
            passwordConfirmMismatch: "The new passwords don't match.",
            codeRequired: "Please enter the verification code.",
            codeFormat: "The verification code is 6 digits.",
        },
        // 서버 오류 코드별 안내 (src/auth/utils/authMessages.js의 KNOWN_ERROR_CODES)
        errors: {
            LOGIN_FAILED: "Your user ID or password is incorrect.",
            LOGIN_LOCKED:
                "Login is temporarily locked after 5 failed attempts. Please try again in 15 minutes.",
            CURRENT_PASSWORD_INVALID: "Your current password is incorrect.",
            LOGIN_ID_DUPLICATED: "This user ID is already in use.",
            EMAIL_DUPLICATED: "This email is already registered.",
            EMAIL_NOT_VERIFIED: "Please verify your email.",
            VERIFICATION_CODE_INVALID: "The verification code is incorrect.",
            VERIFICATION_EXPIRED: "The verification code has expired. Please request a new one.",
            VERIFICATION_ATTEMPTS_EXCEEDED:
                "Too many incorrect attempts. Please request a new code.",
            VERIFICATION_RESEND_TOO_SOON: "Please wait a moment and try again.",
            VERIFICATION_DAILY_LIMIT:
                "You've reached today's limit for verification codes. Please try again tomorrow.",
            MAIL_SEND_FAILED: "We couldn't send the verification email. Please try again shortly.",
            INVALID_IMAGE: "Please upload a JPG or PNG image of 4MB or less.",
            AUTH_REQUIRED: "Please log in.",
            INTERNAL_ERROR: "We couldn't process your request. Please try again shortly.",
            NETWORK_ERROR: "Couldn't connect to the server. Please check your network.",
            TIMEOUT: "The response is taking too long. Please try again shortly.",
        },
    },

    recommendForm: {
        choose: "Select",
        submit: "Get Recommendations",
        required: "Complete all fields to get recommendations.",
        changed: "Your conditions have changed. Please get recommendations again.",
        residenceStatus: "Residence Status",
        loading: "Loading recommendations.",
        loadingChoices: "Loading questions.",
        loadError: "Could not load recommendations.",
        invalidInput: "Please check your input.",
        retry: "Try Again",
        resultsTitle: "Recommendation Results",
        empty: "No products match your conditions. Try changing them.",
        groupCount: "{{companies}} financial institutions · {{total}} products",
        productCount: "{{total}} products",
        showMore: "Show More",
        showLess: "Show Less",
        mismatchToggle: "View products that may be difficult to join ({{count}})",
        detail: "View Details",
        close: "Close",
        reasonsTitle: "Why We Recommend This",
        checksTitle: "Things to Check Before Joining",
        nextTitle: "Next Steps",
        homepage: "Website",
        phone: "Phone",
        noContact: "No contact information is available.",
        residenceStatuses: {
            nonProfessionalEmployment: "Non-professional Employment (E-9)",
            visitingEmployment: "Visiting Employment (H-2)",
            professional: "Professional",
            student: "Student",
            overseasKorean: "Overseas Korean (F-4)",
            permanentResident: "Permanent Resident (F-5)",
            marriageMigrant: "Marriage Migrant (F-6)",
            other: "Other",
        },
    },

    recommendAccount: {
        title: "Account Recommendations",
        description:
            "Answer a few questions to compare deposits and savings accounts available to foreigners.",
        gateTitle: "Let’s check this first",
        fastTitle: "What product are you looking for?",
        ownAccount: "Do you have a bank account in your name?",
        visit: "Branch Visit",
        purpose: "Purpose",
        term: "Savings Period",
        institution: "Financial Institution",
        yes: "Yes",
        no: "No",
        visitOptions: {
            상관없음: "A branch visit is okay",
            "원치 않음": "I do not want to visit a branch",
        },
        purposeOptions: {
            예금: "Deposit · One lump sum",
            적금: "Savings · A small amount every month",
        },
        termOption: "{{count}} months",
        termNotice:
            "Do not choose a term longer than your remaining stay. Early cancellation may apply a lower early-termination rate and reduce your interest.",
        institutionOptions: {
            "은행 선호": "I prefer a bank",
            상관없음: "No preference",
        },
        noAccountTitle: "Please open a bank account first",
        noAccountBody:
            "Deposits and savings accounts are opened by linking your own bank account. Ask a nearby bank about the documents required for a foreigner to open an account.",
        noAccountAction: "Find Support Institutions",
        rate: "Base Interest Rate",
        rateValue: "Annual {{rate}}% · {{type}}",
        period: "Term",
        joinWay: "How to Apply",
        institutionType: "Financial Institution Type",
        visitRequired: "Branch visit required",
        chartTitle: "Estimated Interest Comparison (Before Tax)",
        chartDeposit: "When depositing KRW 10 million for {{term}} months",
        chartSaving: "When saving KRW 500,000 each month for {{term}} months",
        interest: "Estimated Interest (Before Tax)",
        interestValue: "{{amount}} KRW",
    },

    recommendInsurance: {
        title: "Indemnity Insurance Recommendations",
        description:
            "Answer a few questions to compare indemnity insurance with the same coverage by premium.",
        gateTitle: "Let’s check this first",
        healthInsurance: "Are you enrolled in National Health Insurance?",
        healthOptions: {
            예: "Yes",
            아니오: "No",
            모름: "I’m not sure",
        },
        fastTitle: "Tell us what we need to calculate your premium",
        sex: "Sex",
        sexOptions: {
            남: "Male",
            여: "Female",
        },
        age: "Age",
        agePlaceholder: "Example: 30",
        ageError: "Enter a number between {{min}} and {{max}}.",
        noInsuranceTitle: "Please check your health insurance enrollment first",
        noInsuranceBody:
            "What you need to review depends on your health insurance status. First, get guidance suited to your situation from a support institution.",
        noInsuranceAction: "Find Support Institutions",
        premium: "Monthly Premium",
        premiumValue: "{{amount}} KRW",
        breakdown: "Premium Breakdown",
        breakdownValue: "Basic {{basic}} · Rider 1 {{rider1}} · Rider 2 {{rider2}}",
        insurerType: "Insurance Type",
        joinWay: "How to Apply",
        online: "Online enrollment available",
        offline: "Contact an insurer or insurance agent",
        chartTitle: "Monthly Premium Comparison",
        chartBasis: "Based on {{sex}}, age {{age}}",
        basic: "Basic",
        rider1: "Rider 1",
        rider2: "Rider 2",
    },

    recommendLoan: {
        title: "Loan Recommendations",
        description:
            "Choose your purpose to compare loans available to foreigners by average interest rate.",
        fastTitle: "What type of loan are you looking for?",
        purpose: "Purpose",
        purposeOptions: {
            생활비: "Living Expenses (Credit Loan)",
            "전세 보증금": "Jeonse Deposit (Secured Loan)",
        },
        visit: "Branch Visit",
        visitOptions: {
            상관없음: "A branch visit is okay",
            "원치 않음": "I do not want to visit a branch",
        },
        rateAvg: "Average Interest Rate Last Month",
        rateValue: "Annual {{rate}}%",
        rateRange: {
            credit: "Interest Rate by Credit Score",
            jeonse: "Current Interest Rate Range",
        },
        rateRangeValue: "Annual {{min}}–{{max}}%",
        noRate: "Not Disclosed",
        kind: "Product Type",
        joinWay: "How to Apply",
        visitRequired: "Branch visit required",
        limit: "Loan Limit",
        repay: "Repayment Method",
        chartTitle: "Average Interest Rate Comparison Last Month",
        chartBasis: "A lower rate generally means a lower interest burden.",
    },

    recommendResult: {
        groups: {
            match: "Available to Foreigners",
            check: "Eligibility Check Required",
            mismatch: "Products Difficult to Join",
        },

        reasons: {
            high_rate:
                "This product has a relatively high interest rate under the same conditions.",
            no_visit: "You can apply without visiting a branch.",
            bank: "This is a bank product.",
            low_premium: "This product has a relatively low premium for similar coverage.",
            online_join: "You can apply online.",
            low_rate:
                "This product has a relatively low average interest rate among similar loans.",
        },

        checkReasons: {
            foreigner_unspecified: "Foreign eligibility requirements have not been disclosed.",
            region_limit: "Enrollment is limited to these regions: {{regions}}",
            rate_outlier:
                "Its interest rate is much higher than other products. Check whether special eligibility requirements apply.",
            kakao_withdrawal_only:
                "Only a basic transaction account is currently available to foreigners. Check whether you can also join this product.",
            insurer_review: "Foreign eligibility review standards vary by insurer.",
            limit_after_review: "The loan limit is determined after review.",
            special_target:
                "This product is intended for specific groups, such as young adults or newlyweds. Check whether you are eligible.",
            rate_not_disclosed: "The average interest rate has not been disclosed.",
            rate_inconsistent:
                "Last month's average rate differs significantly from the current rate range. Check the actual rate with the financial institution.",
        },

        mismatchReasons: {
            domestic_only: "This product is available only to Korean nationals.",
            visit_required: "You must visit a branch to apply.",
            term_over_stay: "The savings period is longer than your remaining stay period.",
            kbank_not_yet: "Foreign enrollment service is still being prepared.",
        },

        guides: {
            join_at_company:
                "This product is indicated as available to foreigners. Apply through the financial institution's app or website.",
            ask_foreigner_eligibility:
                "Foreign eligibility requirements have not been disclosed. Ask the financial institution whether foreigners can join before applying.",
            ask_insurer_eligibility:
                "Before joining, ask the insurer whether you can apply based on your visa status and stay period.",
            ask_loan_eligibility:
                "Foreign loan requirements have not been disclosed. Before applying, ask the financial institution whether you are eligible based on your visa status, income, and stay period.",
        },

        moreFromCompany: "{{count}} more products from this financial institution",

        separate: {
            title: "Other Products You May Consider",
            senior: "Senior Indemnity Insurance",
            simplified: "Simplified Underwriting Indemnity Insurance",
            description:
                "These are shown separately because their eligibility requirements and coverage differ from standard indemnity insurance.",
        },

        notices: {
            rate_may_change: "Interest rates are based on the {{month}} disclosure and may change.",
            savings_bank_protected:
                "Deposits and savings products from savings banks are also protected by deposit insurance.",
            reference_only:
                "Recommendations are for reference only. Actual eligibility and terms depend on the financial institution's review.",
            premium_may_change: "Premiums are based on the {{date}} disclosure and may change.",
            insurance_age_basis:
                "Premiums use insurance age, so the actual premium may differ slightly.",
            rate_by_credit:
                "The average rate is based on people who borrowed last month. Your actual rate depends on credit review.",
        },
    },

    footer: {
        description: "This is the footer. It smells terribly of feet here.",
        copyright: "© Is this the best you can do, human?",
    },
    // 문의 챗봇 화면 (/contact/chatbot)
    chatbot: {
        title: "AI Chatbot",
        description:
            "Ask the AI chatbot how to use ForGuide. It answers in the language you ask in. AI answers are for reference only; check real figures such as interest rates and eligibility on the relevant screen.",
        loading: "Loading the conversation.",
        loadError: "Could not load the conversation.",
        retry: "Try again",
        unavailable:
            "The AI chatbot is not available right now. Please use 'Contact us directly' below.",
        empty: "Type your question.\nE.g. Where can I compare loan products?",
        remaining: "Questions left today: {{count}} / {{limit}}",
        clear: "Clear conversation",
        clearConfirm:
            "Clear the whole conversation? Questions already used today will not be restored.",
        inputLabel: "Question",
        placeholder: "Type your question. (Enter to send, Shift+Enter for a new line)",
        count: "{{count}} / {{max}} characters",
        send: "Send",
        sending: "Waiting for the answer...",
        answering: "Preparing an answer...",
        resend: "Send again",
        privacyNotice:
            "Resident registration, alien registration, passport, account and phone numbers are hidden automatically before being sent to the AI. It is safest not to enter personal information.",
        speaker: {
            user: "Me",
            assistant: "AI chatbot",
        },
        error: {
            dailyLimit:
                "You have used all of today's questions. Please try again tomorrow or contact us directly.",
            tooLong: "Please keep your question to {{max}} characters or fewer.",
            unavailable: "The AI chatbot is not available right now.",
            timeout: "The answer is taking longer than usual. Please try again shortly.",
            network: "Could not connect to the server. Please check your network.",
            failed: "Could not get an answer. Please try again shortly.",
            interrupted:
                "The answer was cut off. Your question was not counted, so please try again.",
            clearFailed: "Could not clear the conversation. Please try again shortly.",
        },
        handoff: {
            title: "Didn't find the answer you need?",
            description: "Our staff will check and reply to you directly.",
            link: "Contact us directly",
        },
    },
};

export default en;
