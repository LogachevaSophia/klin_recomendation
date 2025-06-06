import { Handle, Position } from "@xyflow/react"
import styles from "./ActionNode.module.scss"
import classNames from "classnames"
import { Label } from "@gravity-ui/uikit"

export const ActionNode: React.FC = ({data}: any) => {
    return (
         <div style={{ 
      padding: '10px', 
      background: '#fff', 
      border: '1px solid #000',
      borderRadius: '4px',
      minWidth: '150px'
    }}>
      {/* Handle для входа (слева) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: '#555' }} 
      />
      
      {/* Handle для выхода (справа) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: '#555' }} 
      />
      
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{data.label}</div>
      
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
    </div>
    )
}