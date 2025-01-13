
import { Button, TextInput, Icon } from "@gravity-ui/uikit"
import styles from "./ChoiceItem.module.scss"
import {SquarePlus} from '@gravity-ui/icons';
import React, {useState } from "react";
import { TypesChoiceItem } from "../SideBar/SideBar";
import { observer } from "mobx-react-lite";


export const ChoiceItem: React.FC<{svg: React.ReactNode, type: TypesChoiceItem, action: (type: TypesChoiceItem, text: string) => void;}> = observer(({svg, type, action}) => {
    const [text, setText] = useState<string>("")

    const onChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value)
    }

    const handleClick = () => {
        action(type, text); // Передаём type и text в функцию
      };

    return(
        <div className={styles.choiceItem} title={type}>
             {svg}
        <TextInput value={text} onChange={onChangeText}/>
        <Button onClick={handleClick}>
            <Icon data={SquarePlus}></Icon>
        </Button>
    </div>
    )
})