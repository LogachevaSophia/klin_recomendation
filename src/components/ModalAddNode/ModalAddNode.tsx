import { Button, Icon, Label, Modal, TextInput } from "@gravity-ui/uikit"
import { useState } from "react";
import { TrashBin } from '@gravity-ui/icons';

import styles from "./ModalAddNode.module.css"
import { observer } from "mobx-react-lite";

export interface Attribute {
    name: string;
    value: string;
}

interface AttributeModalProps {
    isOpen: boolean;
    onSave?: (attributes: Attribute[]) => void;
    setOpen: (data: boolean) => void;
    attributes?: Attribute[];
    type?: string;
}

export const ModalAddNode: React.FC<AttributeModalProps> = observer(({ isOpen, setOpen, onSave, type, attributes=[] }) => {
    const [attributeName, setAttributeName] = useState<string>('');
    const [attributeValue, setAttributeValue] = useState<string>('');
    const [attributesProps, setAttributes] = useState<Attribute[]>(attributes);
    console.log(type)
    const handleAddAttribute = () => {
        if (attributeName && attributeValue) {
            setAttributes([...attributesProps, { name: attributeName, value: attributeValue }]);
            setAttributeName('');
            setAttributeValue('');
        }
    };

    const handleSave = () => {
        if (!onSave) return
        onSave(attributesProps); // Передаем атрибуты в родительский компонент
        setOpen(false); // Закрываем модальное окно
    };

    const handleDeleteAttribute = (index: number) => {
        // Удаляем атрибут по индексу
        const updatedAttributes = attributesProps.filter((_, i) => i !== index);
        setAttributes(updatedAttributes);
    };


    return (
        <>
            <Modal open={isOpen} onClose={() => setOpen(false)}>
                <div className={styles.container}>
                    {attributesProps.length > 0 && <ul>
                        {attributesProps.map((el, index) => {
                            return (
                                <li key={index}>
                                    <Label size="m" theme="info">{el.name}</Label>
                                    <Label size="m" theme="unknown">{el.value}</Label>
                                    <Button view="outlined" size="m" onClick={() => handleDeleteAttribute(index)}>
                                        <Icon data={TrashBin} size={18} />
                                    </Button>
                                </li>

                            )
                        })}
                    </ul>}
                    <TextInput value={attributeName} placeholder="Название атрибута" onChange={(e) => setAttributeName(e.target.value)} />
                    <TextInput value={attributeValue} placeholder="Значение атрибута" onChange={(e) => setAttributeValue(e.target.value)} />
                    <Button onClick={handleAddAttribute}>
                        Добавить атрибут
                    </Button>
                    {type!="edit" && <Button view="action" size="l" onClick={() => {console.log("test2");handleSave();}}>{"Добавить ноду"}</Button>}
                    {type =="edit" && <Button onClick={() => setOpen(false)}>
                        Закрыть
                    </Button>}
                </div>
               

            </Modal>
        </>
    )
} )