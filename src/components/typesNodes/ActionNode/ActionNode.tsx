
import { Handle, Position } from "@xyflow/react"
import styles from "./ActionNode.module.scss"
import classNames from "classnames"

export const ActionNode: React.FC = ({data}: any) => {
    return (
         <div style={{ 
      padding: '10px', 
      background: '#fff', 
      border: '1px solid #000',
      borderRadius: '4px',
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
      
      <div>{data.label}</div>
    </div>
    )
        
}