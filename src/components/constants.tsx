export enum TypesChoiceItem {
    condition = "Условие",
    action = "Действие",
    subprocess = "Подпроцесс",
}


interface SvgType {
    type: TypesChoiceItem;
    svg: React.ReactNode;
}

export const svgTypes: SvgType[] = [
    {
        type: TypesChoiceItem.action,
        svg: <svg width="104" height="43" viewBox="0 0 104 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="103" height="42" rx="4.5" fill="white" stroke="#9ca3af" strokeWidth="2" />
            <text x="52" y="26" textAnchor="middle" fill="#1f2937" fontSize="12" fontWeight="500">⚙ Действие</text>
        </svg>
    },
    {
        type: TypesChoiceItem.condition,
        svg: <svg width="104" height="43" viewBox="0 0 104 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M52 0.5L103.5 21.5L52 42.5L0.5 21.5Z" fill="white" stroke="#9ca3af" strokeWidth="2" />
            <text x="52" y="26" textAnchor="middle" fill="#1f2937" fontSize="12" fontWeight="500">❓ Условие</text>
        </svg>
    },
    {
        type: TypesChoiceItem.subprocess,
        svg: <svg width="104" height="43" viewBox="0 0 104 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="103" height="42" rx="4.5" fill="white" stroke="#9ca3af" strokeWidth="2" />
            <text x="52" y="26" textAnchor="middle" fill="#1f2937" fontSize="12" fontWeight="500">📋 Подпроцесс</text>
        </svg>
    }
]
export function getEnumKeyByValue(value: string): keyof typeof TypesChoiceItem | undefined {
    return Object.keys(TypesChoiceItem).find(key => TypesChoiceItem[key as keyof typeof TypesChoiceItem] === value) as keyof typeof TypesChoiceItem | undefined;
}