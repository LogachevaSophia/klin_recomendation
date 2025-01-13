import { Handle, Position } from '@xyflow/react';
import React from 'react';
import "./triangle.css"


export const CustomDiamondNode: React.FC = ({ data }: any) => {
  console.log(data)
  return (
    <div className="custom-diamond-node-wrapper">
      <div className="custom-diamond-node">
        
        <strong className="diamond-label">{data.label}</strong>
      </div>
      
      {/* Точки соединения */}
      <Handle
        type="target"
        position={Position.Left}
        className="diamond-handle"
      />
      {/* <Handle
        type="source"
        position={Position.Right}
        className="diamond-handle"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="diamond-handle"
      /> */}
    </div>
  );
};

