import { Handle, Position } from '@xyflow/react';
import React from 'react';
import "./triangle.css"


export const CustomDiamondNode = ({ data }: any) => {
  return (
    <div className="custom-diamond-node-wrapper">
      <div className="custom-diamond-node">
        <strong className="diamond-label">{data.value}</strong>
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

