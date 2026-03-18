// 1. 카드 UI용 포맷터 (1cm 간격 디자인의 좁은 공간용)
export const formatCardAuthor = (authorStr: string | null | undefined): string => {
    if (!authorStr) return "저자 미상";

    // 1. 콤마(,) 또는 세미콜론(;)을 모두 구분자로 인식하여 배열로 쪼갭니다.
    const parts = authorStr.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    
    // 2. 카드 UI는 가장 핵심인 '맨 앞 1명'만 노출하므로, 첫 번째 데이터만 정제합니다.
    let firstPersonName = parts[0]
        .replace(/^(지은이|저자|글|옮긴이|역자|그림)\s*[:|：]\s*/, '') // (NLK 스타일) 앞쪽 "지은이: " 제거
        .replace(/\s*\([^)]+\)$/, '')                                 // (알라딘 스타일) 뒤쪽 "(지은이)" 제거
        .replace(/(지음|저|옮김|역|그림)$/, '')                         // (네이버 스타일) 뒤쪽 "지음" 제거
        .trim();

    // 3. 2명 이상일 경우 "외 N명" 처리
    return parts.length === 1 ? firstPersonName : `${firstPersonName} 외 ${parts.length - 1}명`;
};

// 2. 상세 페이지 UI용 포맷터 (넓은 공간용 - NLK, 알라딘, 네이버 통합 지원)
export const formatDetailAuthor = (authorStr: string | null | undefined): string => {
    if (!authorStr) return "저자 미상";

    // ▼▼▼ [수정 1] 콤마(,)뿐만 아니라 세미콜론(;)으로도 분리하도록 업그레이드!
    const parts = authorStr.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    
    const authors: string[] = [];
    const translators: string[] = [];
    const illustrators: string[] = [];

    parts.forEach(part => {
        let name = part;
        let role = "";

        // A. 알라딘 스타일: "이름 (직함)"
        const bracketMatch = part.match(/(.+?)\s*\((.+?)\)$/);
        // ▼▼▼ [수정 2] B. NLK 스타일: "직함: 이름" (새로 추가된 캐치 로직!)
        const prefixMatch = part.match(/^(지은이|저자|글|옮긴이|역자|그림)\s*[:|：]\s*(.+)$/);

        if (bracketMatch) {
            name = bracketMatch[1].trim();
            role = bracketMatch[2].trim();
        } else if (prefixMatch) {
            role = prefixMatch[1].trim();
            name = prefixMatch[2].trim();
        } else {
            // C. 네이버 스타일: "이름 지음", "이름 옮김" 형태 처리
            if (part.endsWith('지음') || part.endsWith('저')) {
                name = part.replace(/(지음|저)$/, '').trim();
                role = '지은이';
            } else if (part.endsWith('옮김') || part.endsWith('역')) {
                name = part.replace(/(옮김|역)$/, '').trim();
                role = '옮긴이';
            } else if (part.endsWith('그림')) {
                name = part.replace(/그림$/, '').trim();
                role = '그림';
            }
        }

        // 역할별 배열에 이름 할당
        if (/(지은이|저자|글|지음|저)/.test(role) || !role) {
            authors.push(name); // 직함이 없으면 기본적으로 저자로 취급
        } else if (/(옮긴이|역자|번역|옮김|역)/.test(role)) {
            translators.push(name);
        } else if (/(그림|삽화|일러스트|만화|사진)/.test(role)) {
            illustrators.push(name);
        }
    });

    // 그룹별 텍스트 조립
    const result: string[] = [];
    if (authors.length > 0) result.push(`${authors.join(', ')} 지음`);
    if (translators.length > 0) result.push(`${translators.join(', ')} 옮김`);
    if (illustrators.length > 0) result.push(`${illustrators.join(', ')} 그림`);

    // "J.K. 롤링 지음 | 강동혁 옮김 | 미나리마 그림" 형태로 아름답게 반환
    return result.join(' | ');
};