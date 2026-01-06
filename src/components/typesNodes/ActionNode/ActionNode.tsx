import { Handle, Position } from "@xyflow/react"
import styles from "./ActionNode.module.scss"
import classNames from "classnames"

export const ActionNode: React.FC = ({data}: any) => {
    return (
        <div className={classNames(styles.custom, styles.actionNode)}>
            {/* Handle для входа (слева) */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="action-handle"
            />
            
            {/* Handle для выхода (справа) */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="action-handle"
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>⚙️</span>
                <strong>{data.label || 'Action'}</strong>
            </div>
        </div>
    )
}