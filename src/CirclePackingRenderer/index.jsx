import React, {Component} from 'react'
import {circlePacking} from './d3-circle-packing'


class CirclePackingRenderer extends Component {

  componentDidMount() {
    const svgTree = this.tree
    circlePacking(this.props.tree, svgTree, 1000)
  }

  render() {
    return (
      <svg ref={tree => this.tree = tree}></svg>
    )
  }
}


export default CirclePackingRenderer
