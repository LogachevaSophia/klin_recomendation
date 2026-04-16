import { useState } from "react";
import styles from "./Sidebar.module.scss"
import { Tabs, TabsItemProps } from '@gravity-ui/uikit';
import { ChoiceItem } from "../ChoiceItem/ChoiceItem";
import { observer } from "mobx-react-lite";
import { getEnumKeyByValue, svgTypes, TypesChoiceItem } from "../constants";
import { Attribute, ModalAddNode } from "../ModalAddNode/ModalAddNode";
import { bpmnStore } from "../../stores/BpmnStore";
import { v4 as uuidv4 } from 'uuid';

export const SideBar = observer(() => {
    const [activeTab, setActiveTab] = useState<string>("main");
    const [typeNewNode, setTypeNewNode] = useState<undefined | TypesChoiceItem>(undefined);
    const [newNameNode, setNewNameNode] = useState<undefined | string>(undefined);
    const [open, setOpen] = useState(false);

    // Получаем список доступных процессов из store
    const processes = bpmnStore.availableProcesses;
    const items: TabsItemProps[] = processes.map(process => ({
        id: process.id,
        title: process.name
    }));

    const onSelectTabEvent = (tabId: string) => {
        setActiveTab(tabId);
        bpmnStore.setActiveProcess(tabId);
    };

    const testaction = (type: TypesChoiceItem, text: string) => {
        setTypeNewNode(type);
        setOpen(true);
        setNewNameNode(text);
    };

    const onAddNewNode = (attributes: Attribute[]) => {
        if (!typeNewNode) return;

        const uniqueId = uuidv4();
        const findedType = getEnumKeyByValue(typeNewNode);

        if (findedType === undefined) {
            console.error("Invalid type value");
            return;
        }

        const newNode = {
            id: uniqueId.toString(),
            type: findedType,
            position: { x: 0, y: 0 }, // Позиция будет установлена при перетаскивании
            data: {
                label: newNameNode,
                attributes: attributes
            }
        };
        console.log('newNode', newNode);

        bpmnStore.addNewNode(newNode);
        setNewNameNode(undefined);
        setOpen(false);
    };

    return (
        <section className={styles.sideBar}>
            <ModalAddNode 
                isOpen={open} 
                setOpen={setOpen} 
                onSave={onAddNewNode}
                attributes={[]}
                type="create"
            />
            <Tabs
                activeTab={activeTab}
                items={items}
                onSelectTab={onSelectTabEvent}
            />
            <section className={styles.choice}>
                {svgTypes.map((el, ind) => (
                    <ChoiceItem svg={el.svg} type={el.type} key={ind} action={testaction} />
                ))}
            </section>
        </section>
    );
});

export { TypesChoiceItem };
