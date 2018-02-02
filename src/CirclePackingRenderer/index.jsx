import React, { Component } from 'react'
import CirclePacking from './d3-circle-packing'

/**
 * React component version of circle packing
 */
class CirclePackingRenderer extends Component {
  componentDidMount() {
    console.log(this.props)
    console.log('---------------------------------')
    console.log(this.props.tree.height)
    console.log(this.props.size)
    const size = this.props.size
    CirclePacking(this.props.tree, this.tree, size, this.props)
  }

  componentWillReceiveProps(nextProps) {
    const newSize = nextProps.size

    if(this.props.size !== newSize) {
      console.log('REDRAW---------------------------------')
      CirclePacking(nextProps.tree, this.tree, newSize, nextProps)
    }
  }

  render() {
    return <div ref={tree => (this.tree = tree)} />
  }
}

export default CirclePackingRenderer
