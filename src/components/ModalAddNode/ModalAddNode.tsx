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
    onSave: (attributes: Attribute[]) => void;
    setOpen: (data: boolean) => void
}

export const ModalAddNode: React.FC<AttributeModalProps> = observer(({ isOpen, setOpen, onSave }) => {
    const [attributeName, setAttributeName] = useState<string>('');
    const [attributeValue, setAttributeValue] = useState<string>('');
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    const handleAddAttribute = () => {
        if (attributeName && attributeValue) {
            setAttributes([...attributes, { name: attributeName, value: attributeValue }]);
            setAttributeName('');
            setAttributeValue('');
        }
    };

    const handleSave = () => {
        onSave(attributes); // Передаем атрибуты в родительский компонент
        setOpen(false); // Закрываем модальное окно
    };

    const handleDeleteAttribute = (index: number) => {
        // Удаляем атрибут по индексу
        const updatedAttributes = attributes.filter((_, i) => i !== index);
        setAttributes(updatedAttributes);
    };


    return (
        <>
            <Modal open={isOpen} onClose={() => setOpen(false)}>
                <div className={styles.container}>
                    {attributes.length > 0 && <ul>
                        {attributes.map((el, index) => {
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
                    <Button view="action" size="l" onClick={handleSave}>Добавить ноду</Button>
                </div>
               

            </Modal>
        </>
    )
} )