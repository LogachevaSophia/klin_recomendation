export const enum TypesChoiceItem {
    start = "Начало процесса",
    fork = "Эксклюзивная линия",
    action = "Действие",
    newprocess = "Новый процесс"
}


interface SvgType {
    type: TypesChoiceItem;
    svg: React.ReactNode;
}

export  const svgTypes: SvgType[] = [{
    type: TypesChoiceItem.start, svg: <svg width="94" height="41" viewBox="0 0 94 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M93.5 20.5C93.5 23.1645 92.2641 25.7426 89.9476 28.1314C87.6288 30.5226 84.2492 32.6989 80.0341 34.5374C71.6055 38.2137 59.9266 40.5 47 40.5C34.0734 40.5 22.3945 38.2137 13.9659 34.5374C9.75082 32.6989 6.37123 30.5226 4.05244 28.1314C1.73594 25.7426 0.5 23.1645 0.5 20.5C0.5 17.8355 1.73594 15.2574 4.05244 12.8686C6.37123 10.4774 9.75082 8.3011 13.9659 6.46261C22.3945 2.78631 34.0734 0.5 47 0.5C59.9266 0.5 71.6055 2.78631 80.0341 6.46261C84.2492 8.3011 87.6288 10.4774 89.9476 12.8686C92.2641 15.2574 93.5 17.8355 93.5 20.5Z" fill="white" stroke="black" />
    </svg>
}, {
    type: TypesChoiceItem.fork, svg: <svg width="61" height="61" viewBox="0 0 61 61" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.88909 27.2591L27.2591 3.88908C29.0165 2.13172 31.8657 2.13173 33.6231 3.88908L56.9932 27.2591C58.7505 29.0165 58.7505 31.8657 56.9932 33.6231L33.6231 56.9932C31.8657 58.7505 29.0165 58.7505 27.2591 56.9932L3.88908 33.6231C2.13173 31.8657 2.13173 29.0165 3.88909 27.2591Z" fill="white" stroke="black" />
        <path d="M26.3395 17.7273L31.3466 27.2621L36.478 17.7273H44.2372L36.3359 31.3636L44.4503 45H36.7266L31.3466 35.5717L26.0554 45H18.2429L26.3395 31.3636L18.527 17.7273H26.3395Z" fill="black" />
    </svg>
}, {
    type: TypesChoiceItem.action, svg: <svg width="104" height="43" viewBox="0 0 104 43" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="103" height="42" rx="4.5" fill="white" stroke="black" />
    </svg>
}, {
    type: TypesChoiceItem.newprocess, svg: <svg width="104" height="43" viewBox="0 0 104 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="103" height="42" rx="4.5" fill="rgba(255, 0, 0, 0.5)" stroke="rgba(255, 0, 0, 0.5)" />
  </svg>
  
}]