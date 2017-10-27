import React, {Component} from 'react'
import {circlePacking} from './d3-circle-packing'


/**
 * React component version of circle packing
 */
class CirclePackingRenderer extends Component {

  componentDidMount() {
    const svgTree = this.tree
    circlePacking(this.props.tree, svgTree)
  }

  render() {
    return (
      <svg ref={tree => this.tree = tree}></svg>
    )
  }
}


export default CirclePackingRenderer
