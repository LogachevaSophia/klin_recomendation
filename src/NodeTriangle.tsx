import { Handle, Position } from '@xyflow/react';
import React from 'react';
import "./triangle.css"


export const CustomDiamondNode: React.FC = ({ data }: any) => {
  console.log(data)
  return (
    <div className="custom-diamond-node-wrapper">
      <div className="custom-diamond-node">
        
        <strong className="diamond-label">{data.label} Приветики</strong>
      </div>
    </div>
  );
};

