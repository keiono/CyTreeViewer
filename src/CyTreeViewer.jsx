import React, { Component } from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'

const DEF_EVENT_HANDLERS = Immutable.fromJS({
  selectNodes: (nodeIds, properties = {}) => {
    console.log('selectNodes called.')
    console.log(nodeIds)
  },

  selectEdges: (edgeIds, properties = {}) => {
    console.log('selectEdges called.')
  },

  deselectNodes: nodeIds => {
    console.log('deselectNodes called.')
  },

  deselectEdges: edgeIds => {
    console.log('deselectEdges called.')
  },

  changeNodePositions: nodePositions => {
    console.log('changeNodePositions called.')
  },

  commandFinished: (lastCommand, status = {}) => {
    console.log('Command Finished: ' + lastCommand)
    console.log(status)
  }
})

const CyTreeViewer = RendererComponent => {
  class Viewer extends Component {
    constructor(props) {
      super(props)

      this.state = {}
    }

    componentWillMount() {}

    componentWillReceiveProps(nextProps) {
      if (nextProps.tree !== this.props.tree) {
      }
    }

    render() {
      const { tree } = this.props
      const handlers = this.buildEventHandlers()

      // If network data is not available, simply return empty tag
      if (tree === undefined || tree === null) {
        return <div />
      }

      console.log(tree)

      return <RendererComponent {...this.props} eventHandlers={handlers} />
    }

    buildEventHandlers = () => {
      const handlers = this.props.eventHandlers
      if (handlers === undefined || handlers === null) {
        return DEF_EVENT_HANDLERS.toJS()
      }

      // Use default + user provided handlers.
      return DEF_EVENT_HANDLERS.mergeDeep(handlers).toJS()
    }
  }

  Viewer.propTypes = {

    // Name of the renderer class, mainly for Styling
    className: PropTypes.string,

    // Tree data in renderer's format
    tree: PropTypes.object,

    // Event handlers for actions for the network, such as selection.
    eventHandlers: PropTypes.object.isRequired,

    // Style of the area used by the renderer
    style: PropTypes.object,

    // Style for the network, which is RENDERER DEPENDENT, not CSS
    treeStyle: PropTypes.object,

    // Optional parameters for the renderer
    rendererOptions: PropTypes.object,

    // Command for renderer to be executed next.
    // This is null except when something is actually running in renderer
    command: PropTypes.object
  }

  Viewer.defaultProps = {
    tree: null,
    command: null,
    style: {
      width: '100%',
      height: '100%',
      background: '#FFFFFF'
    },
    eventHandlers: DEF_EVENT_HANDLERS.toJS(),
    rendererOptions: {}
  }

  Viewer.displayName = `Viewer(${getDisplayName(RendererComponent)})`

  return Viewer
}

const getDisplayName = RendererComponent =>
  RendererComponent.displayName || RendererComponent.name || 'Component'

export default CyTreeViewer
