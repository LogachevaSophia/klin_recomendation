export enum TypesChoiceItem {
    start = "Начало процесса",
    condition = "Условие",
    action = "Действие",
    subprocess = "Подпроцесс",
    finish = "Конец процесса"
}


interface SvgType {
    type: TypesChoiceItem;
    svg: React.ReactNode;
}

export const svgTypes: SvgType[] = [
    {
        type: TypesChoiceItem.start,
        svg: <svg width="94" height="41" viewBox="0 0 94 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M93.5 20.5C93.5 23.1645 92.2641 25.7426 89.9476 28.1314C87.6288 30.5226 84.2492 32.6989 80.0341 34.5374C71.6055 38.2137 59.9266 40.5 47 40.5C34.0734 40.5 22.3945 38.2137 13.9659 34.5374C9.75082 32.6989 6.37123 30.5226 4.05244 28.1314C1.73594 25.7426 0.5 23.1645 0.5 20.5C0.5 17.8355 1.73594 15.2574 4.05244 12.8686C6.37123 10.4774 9.75082 8.3011 13.9659 6.46261C22.3945 2.78631 34.0734 0.5 47 0.5C59.9266 0.5 71.6055 2.78631 80.0341 6.46261C84.2492 8.3011 87.6288 10.4774 89.9476 12.8686C92.2641 15.2574 93.5 17.8355 93.5 20.5Z" fill="white" stroke="#9ca3af" strokeWidth="2" />
            <text x="47" y="26" textAnchor="middle" fill="#1f2937" fontSize="14" fontWeight="bold">▶ СТАРТ</text>
        </svg>
    },
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
    },
    {
        type: TypesChoiceItem.finish,
        svg: <svg width="94" height="41" viewBox="0 0 94 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M93.5 20.5C93.5 23.1645 92.2641 25.7426 89.9476 28.1314C87.6288 30.5226 84.2492 32.6989 80.0341 34.5374C71.6055 38.2137 59.9266 40.5 47 40.5C34.0734 40.5 22.3945 38.2137 13.9659 34.5374C9.75082 32.6989 6.37123 30.5226 4.05244 28.1314C1.73594 25.7426 0.5 23.1645 0.5 20.5C0.5 17.8355 1.73594 15.2574 4.05244 12.8686C6.37123 10.4774 9.75082 8.3011 13.9659 6.46261C22.3945 2.78631 34.0734 0.5 47 0.5C59.9266 0.5 71.6055 2.78631 80.0341 6.46261C84.2492 8.3011 87.6288 10.4774 89.9476 12.8686C92.2641 15.2574 93.5 17.8355 93.5 20.5Z" fill="white" stroke="#9ca3af" strokeWidth="2" />
            <text x="47" y="26" textAnchor="middle" fill="#1f2937" fontSize="14" fontWeight="bold">🏁 ФИНИШ</text>
        </svg>
    }
]
export function getEnumKeyByValue(value: string): keyof typeof TypesChoiceItem | undefined {
    return Object.keys(TypesChoiceItem).find(key => TypesChoiceItem[key as keyof typeof TypesChoiceItem] === value) as keyof typeof TypesChoiceItem | undefined;
}