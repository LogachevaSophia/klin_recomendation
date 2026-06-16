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

            <span className={styles.branchLabelYes}>ДА</span>
            <span className={styles.branchLabelNo}>НЕТ</span>

            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="condition-handle condition-handle-input"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="true"
                className="condition-handle condition-handle-true"
                style={{ left: '100%' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="condition-handle condition-handle-false"
                style={{ left: '100%' }}
            />
        </div>
    )
}