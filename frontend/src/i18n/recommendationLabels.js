const residenceStatusKeyByValue = {
    "비전문취업(E-9)": "nonProfessionalEmployment",
    "방문취업(H-2)": "visitingEmployment",
    전문인력: "professional",
    유학생: "student",
    "재외동포(F-4)": "overseasKorean",
    "영주(F-5)": "permanentResident",
    "결혼이민(F-6)": "marriageMigrant",
    기타: "other",
};

// 서버가 보내는 체류자격 원본값을 i18next의 공통 키로 바꾼다.
export function getResidenceStatusKey(value) {
    return residenceStatusKeyByValue[value] ?? null;
}
