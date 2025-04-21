import { useEffect, useState } from "react";
import styles from "./Sidebar.module.scss"
import { Button, Tabs, TabsItemProps } from '@gravity-ui/uikit';
import { ChoiceItem } from "../ChoiceItem/ChoiceItem";
import { observer } from "mobx-react-lite";
import { getEnumKeyByValue, svgTypes, TypesChoiceItem } from "../constants";
import { Attribute, ModalAddNode } from "../ModalAddNode/ModalAddNode";
import { bpmnStore } from "../../stores/BpmnStore";
import { v4 as uuidv4 } from 'uuid';






export const SideBar = observer(() => {

    //items - Это встроенные подпроцессы. Каждая вкладка - новый процесс/новая схема
    const [activeTab, setActiveTab] = useState<string>("main")
    const [typeNewNode, setTypeNewNode] = useState<undefined | TypesChoiceItem>(undefined)
    const [newNameNode, setNewNameNode] = useState<undefined | string>(undefined)
    const onSelectTabEvent = (tabId: string) => {
        setActiveTab(tabId)
    }

    const [items, setItems] = useState<TabsItemProps[]>([
        { id: 'main', title: 'Диагностика' },
    ])

    const testaction = (type: TypesChoiceItem, text: string) => {
        setTypeNewNode(type)
        setOpen(true)
        setNewNameNode(text);
        if (type == TypesChoiceItem.newprocess) {
            if (text == "") {
                alert("Пустое название")
                return
            }
            const newTab = { id: text, title: text }
            setItems((prevItems) => [...prevItems, newTab]);
        }
    }

    const [open, setOpen] = useState(false);


    const onAddNewNode = (data: Attribute[]) => {
        console.log("data = ")
        console.log(data)

        if (!typeNewNode) return;

        const uniqueId = uuidv4();
        const findedType = getEnumKeyByValue(typeNewNode);

        // Если findedType === undefined, вы можете вернуть, выбросить ошибку или использовать дефолтное значение.
        if (findedType === undefined) {
            console.error("Invalid type value");
            return;
        }


        const newNode = {
            id: uniqueId.toString(),
            type: findedType, // Теперь findedType гарантированно не undefined
            position: { x: 0, y: 0 },
            data: { attributes: data, label: newNameNode }
        };

        bpmnStore.addNewNode(newNode);
        setNewNameNode(undefined)


    }

    return (
        <section className={styles.sideBar}>
            <ModalAddNode isOpen={open} setOpen={setOpen} onSave={onAddNewNode} />
            <Tabs
                activeTab={activeTab}
                items={items}
                onSelectTab={onSelectTabEvent}
            />
            <section className={styles.choice}>
                {svgTypes.map((el, ind) => {
                    return (
                        <ChoiceItem svg={el.svg} type={el.type} key={ind} action={testaction} />
                    )
                })}






            </section>
            <Button onClick={() => {console.log("My data is"); console.log(bpmnStore.getApiData());}}> Выплюнуть данные</Button>
        </section>
    )
})

export { TypesChoiceItem };
