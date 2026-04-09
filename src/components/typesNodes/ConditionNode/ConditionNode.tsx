import { Handle, Position } from "@xyflow/react"
import styles from "./ConditionNode.module.scss"
import classNames from "classnames"

export const ConditionNode: React.FC = ({ data }: any) => {
    return (
        <div className={classNames(styles.custom, styles.condition)}>
            <div className={styles.content}>
                <div style={{ fontSize: '14px', marginBottom: '2px' }}>❓</div>
                <strong>{data.label || 'Condition'}</strong>
            </div>

            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="condition-handle"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="condition-handle"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="condition-handle"
            />
        </div>
    )
}