import React, { Component } from 'react'
import CirclePacking from './d3-circle-packing'

/**
 * React component version of circle packing
 */
class CirclePackingRenderer extends Component {
  componentDidMount() {



    CirclePacking(this.props.tree, this.tree, this.props.className)
  }

  render() {
    return <div ref={tree => (this.tree = tree)} style={this.props.style} />
  }
}

export default CirclePackingRenderer
