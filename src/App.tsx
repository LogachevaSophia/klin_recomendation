import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';


import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

// import Triangle from './NodeTriangle';

import styles from "./index.module.scss"
import { CustomDiamondNode } from './NodeTriangle';
import { SideBar } from './components/SideBar/SideBar';
import { Bpmn } from './components/Bpmn/Bpmn';


const App = () => {
 
  return (
    <div style={{ width: '100vw', height: '100vh' }} className={styles.container}>
      <SideBar/>
      <Bpmn/>
    </div>
  );


};

export default App;