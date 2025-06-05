
import { Handle, Position } from "@xyflow/react"
import styles from "./ConditionNode.module.scss"
import classNames from "classnames"

export const ConditionNode: React.FC = ({ data }: any) => {
    const contentStyle = {
        // transform: 'rotate(-45deg)',
        width: '60px',
        textAlign: 'center' as const,
      };
    return (
        <div className={classNames(styles.custom, styles.condition)}>
            <div style={contentStyle}>
                {data.label || 'Condition'}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{
                    // transform: 'rotate(-45deg)'
                }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="next"
                // style={{ transform: 'rotate(-45deg)' }}
            />
        </div>
    )

}