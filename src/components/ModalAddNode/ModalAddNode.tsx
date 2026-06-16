import { Button, Icon, Label, Modal, TextInput } from "@gravity-ui/uikit"
import { useState, useEffect } from "react";
import { TrashBin, Xmark } from '@gravity-ui/icons';

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
    const [attributesProps, setAttributes] = useState<Attribute[]>([]);

    const medications = [
        {id: 1, name: 'Аспирин'},
        {id: 2, name: 'Нурофен'},
        {id: 3, name: 'Анальгин'},
        {id: 4, name: 'Парацетамол'},
        {id: 5, name: 'Ибупрофен'},
        {id: 6, name: 'Нурофен'},
        {id: 7, name: 'Анальгин'},
        {id: 8, name: 'Парацетамол'},
        {id: 9, name: 'Ибупрофен'},
    ]


    // Обновляем локальное состояние при изменении входных атрибутов
    useEffect(() => {
        setAttributes(attributes || []);
    }, [attributes]);

    // Сбрасываем форму при закрытии модального окна
    useEffect(() => {
        if (!isOpen) {
            setAttributeName('');
            setAttributeValue('');
        }
    }, [isOpen]);

    const handleAddAttribute = () => {
        if (attributeName && attributeValue) {
            setAttributes([...attributesProps, { name: attributeName, value: attributeValue }]);
            setAttributeName('');
            setAttributeValue('');
        }
    };

    const handleAddMedication = () => {
        
    }

    const handleSave = () => {
        if (!onSave) return
        onSave(attributesProps);
        setOpen(false);
    };

    const handleDeleteAttribute = (index: number) => {
        const updatedAttributes = attributesProps.filter((_, i) => i !== index);
        setAttributes(updatedAttributes);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Modal 
            open={isOpen} 
            onClose={handleClose}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>{type === "edit" ? "Редактирование атрибутов" : "Добавление атрибутов"}</h3>
                    <Button 
                        view="flat"
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <Icon data={Xmark} />
                    </Button>
                </div>
                {attributesProps.length > 0 && (
                    <ul className={styles.attributesList}>
                        {attributesProps.map((el, index) => (
                            <li key={index} className={styles.attributeItem}>
                                <Label size="m" theme="info">{el.name}</Label>
                                <Label size="m" theme="unknown">{el.value}</Label>
                                <Button 
                                    view="flat" 
                                    size="m" 
                                    onClick={() => handleDeleteAttribute(index)}
                                >
                                    <Icon data={TrashBin} size={16} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className={styles.inputGroup}>
                    <TextInput
                        value={attributeName}
                        placeholder="Название атрибута"
                        onChange={(e) => setAttributeName(e.target.value)}
                    />
                    <TextInput
                        value={attributeValue}
                        placeholder="Значение атрибута"
                        onChange={(e) => setAttributeValue(e.target.value)}
                    />
                    <Button onClick={handleAddAttribute}>
                        Добавить атрибут
                    </Button>
                    <Button onClick={handleAddMedication}>
                        Добавить препарат
                    </Button>
                </div>
                <div className={styles.actions}>
                    {type !== "edit" && (
                        <Button view="action" size="l" onClick={handleSave}>
                            Добавить ноду
                        </Button>
                    )}
                    {type === "edit" && (
                        <>
                            <Button view="action" onClick={handleSave}>
                                Сохранить
                            </Button>
                            <Button view="flat" onClick={handleClose}>
                                Отмена
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
});