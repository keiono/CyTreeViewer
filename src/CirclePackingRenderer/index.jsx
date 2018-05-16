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
    const rootColor = this.props.rendererOptions.rootColor
    const leafColor = this.props.rendererOptions.leafColor
    const newRootColor = nextProps.rendererOptions.rootColor
    const newLeafColor = nextProps.rendererOptions.leafColor

    const newHeight = nextProps.height

    if (
      this.props.height !== newHeight ||
      rootColor !== newRootColor ||
      leafColor !== newLeafColor
    ) {
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
      return
    }

    if (nextProps.selected !== this.props.selected) {
      selectNodes(nextProps.selected)
    }
  }

  render() {
    return <div ref={tree => (this.tree = tree)} />
  }
}

export default CirclePackingRenderer
