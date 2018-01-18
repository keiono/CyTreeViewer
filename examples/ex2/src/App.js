import React from 'react'
import {CirclePackingRenderer, CyTreeViewer} from 'cy-tree-viewer'
const TreeViewer = CyTreeViewer(CirclePackingRenderer)


// React Application implemented as a stateless functional component
const App = props =>
  <section style={props.appStyle}>

    <h2 style={props.titleStyle}>CyTreeViewer Demo: Circle Packing View</h2>

    <TreeViewer
      {...props}
    />

  </section>;

export default App

