import React, { Component } from 'react'
import CirclePacking, { selectNodes } from './d3-circle-packing'

/**
 * React component version of circle packing
 */
class CirclePackingRenderer extends Component {
  componentDidMount() {
    CirclePacking(
      this.props.tree,
      this.tree,
      this.props.width,
      this.props.height,
      this.props
    )
  }

  componentWillReceiveProps(nextProps) {
    const newHeight = nextProps.height

    if (this.props.height !== newHeight) {
      CirclePacking(
        nextProps.tree,
        this.tree,
        nextProps.width,
        nextProps.height,
        nextProps
      )
    }

    if (nextProps.selected === null) {
      // Clear selection
      console.log('############### Clear Selected')
      return
    }

    if (nextProps.selected !== this.props.selected) {
      console.log('############### Selected in TREE')
      selectNodes(nextProps.selected)
    }
  }

  render() {
    return <div ref={tree => (this.tree = tree)} />
  }
}

export default CirclePackingRenderer
