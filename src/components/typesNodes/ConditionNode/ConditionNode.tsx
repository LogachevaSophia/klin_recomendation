import { Handle, Position } from "@xyflow/react"
import styles from "./ConditionNode.module.scss"
import classNames from "classnames"
import { Label } from "@gravity-ui/uikit"

export const ConditionNode: React.FC = ({ data }: any) => {
    return (
        <div className={classNames(styles.custom, styles.condition)} style={{ minWidth: '150px', padding: '10px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                {data.label || 'Condition'}
            </div>
            
            {data.attributes && data.attributes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {data.attributes.map((attr: any, index: number) => (
                        <div key={index} style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                            <Label size="s" theme="info">{attr.name}</Label>
                            <Label size="s" theme="unknown">{attr.value}</Label>
                        </div>
                    ))}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                id="true"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="next"
            />
        </div>
    )
}