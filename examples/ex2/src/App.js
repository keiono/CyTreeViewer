import React from 'react'
import { CirclePackingRenderer, CyTreeViewer } from 'cy-tree-viewer'
import ColorBar from './ColorBar'
import * as style from './style.css'

const TreeViewer = CyTreeViewer(CirclePackingRenderer)

const height = window.innerHeight * 0.9

const containerStyle ={
  height: height,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

// React Application implemented as a stateless functional component
const App = props => (
  <div style={props.appStyle}>
    {/*<h2 style={props.titleStyle}>NDEx UUID: {props.uuid}</h2>*/}

    <div style={containerStyle}>


      <TreeViewer
        {...props}
        size={height}
      />

      <ColorBar
        width={20}
        height={height}
        depth={2}
        tree={props.tree}
      />
    </div>
  </div>
)

export default App
