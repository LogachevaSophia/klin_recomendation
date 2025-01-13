import { useState } from "react";
import styles from "./Sidebar.module.scss"
import {Tabs, TabsItemProps } from '@gravity-ui/uikit';
import { ChoiceItem } from "../ChoiceItem/ChoiceItem";
import { observer } from "mobx-react-lite";
import { svgTypes, TypesChoiceItem } from "../constants";
import { Attribute, ModalAddNode } from "../ModalAddNode/ModalAddNode";






export const SideBar = observer(() => {
    //items - Это встроенные подпроцессы. Каждая вкладка - новый процесс/новая схема
    const [activeTab, setActiveTab] = useState<string>("main")
    const onSelectTabEvent = (tabId: string) => {
        setActiveTab(tabId)
    }

    const [items, setItems] = useState<TabsItemProps[]>([
        { id: 'main', title: 'Диагностика' },
    ])

    const testaction = (type: TypesChoiceItem, text: string) => {
        console.log(type)
        setOpen(true)
        // if (type==TypesChoiceItem.newprocess){
        //     if (text == "") {
        //         alert("Пустое название")
        //         return 
        //     }
        //     const newTab = {id: text, title: text}
        //     setItems((prevItems) => [...prevItems, newTab]);
        // }
    }

    const [open, setOpen] = useState(false);

    const onAddNewNode = (data: Attribute[]) => {

        

    }

    return (
        <section className={styles.sideBar}>
            <ModalAddNode isOpen={open} setOpen={setOpen} onSave={onAddNewNode}/>
            <Tabs
                activeTab={activeTab}
                items={items}
                onSelectTab={onSelectTabEvent}
            />
            <section className={styles.choice}>
                {svgTypes.map((el, ind) => {
                    return (
                        <ChoiceItem svg={el.svg} type={el.type} key={ind} action={testaction}/>
                    )
                })}






            </section>
        </section>
    )
})

export { TypesChoiceItem };
