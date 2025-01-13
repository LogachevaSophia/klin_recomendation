//
// data: {
//    type: start|finish
// }
//
import classNames from "classnames"
import styles from "./StartNode.module.scss"
import { Handle, Position } from "@xyflow/react"
export const StartFinishNode: React.FC = ({data}: any) => {
    return (
        <>
        <div className={classNames(styles.custom, styles.startFinishNode)}>
            <strong>{data.label}</strong>
        </div>
         <Handle
        type="source"
        position={Position.Right}
        className="diamond-handle"
        isConnectable={true}
      />
        </>
        
    )
}