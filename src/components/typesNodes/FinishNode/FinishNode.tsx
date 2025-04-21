//
// data: {
//    type: start|finish
// }
//
import classNames from "classnames"
import styles from "./FinishNode.module.scss"
import { Handle, Position } from "@xyflow/react"
import { useState } from "react"
// import { ModalAddNode } from "../../ModalAddNode/ModalAddNode"
export const FinishNode: React.FC = ({ data }: any) => {
    const [isOpen, setOpen] = useState(false)
    return (
        <div onClick={() => {setOpen(true)}}>
            {/* <ModalAddNode isOpen={isOpen} setOpen={setOpen} attributes={data?.attributes} type="edit"/> */}
            <div className={classNames(styles.custom, styles.startFinishNode)}>
                <strong>{data.label}</strong>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                className="diamond-handle"
                isConnectable={true}
            />
        </div>

    )
}