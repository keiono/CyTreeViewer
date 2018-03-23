import * as d3Selection from 'd3-selection'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'
import * as d3Zoom from 'd3-zoom'

import getColorMap from './colormap-generator'
import getSvg from './svg-container-factory'
import getRoot from './hierarchy-factory'
import getLabels from './label-factory'

const colorMapper = getColorMap()
const MARGIN = 50

const MAX_DEPTH = 3

const TRANSITION_DURATION = 400

const SHOW_LABEL_TH = 0

// TODO: Manage these states in React way
let currentDepth = 0

let height = 0
let width = 0

let g

let treeHeight = 0

let props
let focus
let view

let node

let diameter

let circle

let circleNodes
let labels

let root

let selectedCircle
let subSelected = new Map()

const currentSet = new Set()

let nodeCount = 0

const CirclePacking = (tree, svgTree, width1, height1, originalProps) => {
  props = originalProps
  const svg = getSvg(svgTree, width1, height1)

  width = width1
  height = height1

  diameter = +svg.attr('height')

  // Base setting.
  g = svg.append('g')
  // .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')')

  const zoomed2 = () => {
    g.attr('transform', d3Selection.event.transform)
  }

  // Generate tree and get the root node
  root = getRoot(tree)

  // This is the height of the main tree
  treeHeight = root.height

  // Set initial focus to the root
  focus = root

  // Get all children
  const pack = d3Hierarchy
    .pack()
    .size([diameter - MARGIN, diameter - MARGIN])
    .padding(1)

  let nodes = pack(root).descendants()
  nodeCount = nodes.length

  const zoom2 = d3Zoom
    .zoom()
    .scaleExtent([1 / 10, 500])
    .on('zoom', zoomed2)

  svg.call(zoom2)
  zoom2.translateBy(svg, width / 2, height / 2)

  svg.on('dblclick.zoom', null)

  circle = addCircles(g, nodes)

  addLabels(g, nodes)

  const labelTargets = selectCurrentNodes(root.children, 'l')
  const th = getLabelThreshold(root.children)

  labelTargets
    .style('display', d => {
      if (d !== root && d.value > th) {
        return 'inline'
      }
    })
    .style('font-size', d => getFontSize(d))

  node = g.selectAll('circle,text')
  circleNodes = g.selectAll('circle')
  labels = g.selectAll('.label')

  svg.style('background', 'white').on('dblclick', (d, i, nodes) => {
    if (root === undefined) return

    currentDepth = MAX_DEPTH

    // Reset
    const trans = d3Zoom.zoomIdentity
      .translate(props.width / 2, props.height / 2)
      .scale(1)

    svg
      // .transition()
      // .duration(750)
      .call(zoom2.transform, trans)

    zoom(root)
  })

  const initialPosition = [root.x, root.y, root.r * 2 + MARGIN]
  zoomTo(initialPosition)
}

const getLabelThreshold = nodes => {
  const thPoint = Math.floor(nodes.length * 0.8)
  const values = nodes.map(child => child.value).sort((a, b) => a - b)

  return values[thPoint]
}

const getFontSize = d => {
  const txt = d.data.data.Label
  const textLen = txt.length

  let size = 10
  if (textLen <= 5) {
    size = d.r * 2 / textLen
  } else {
    size = d.r * 3 / textLen
  }

  return size
}

// Determine which labels should be displayed or not
const showLabelOrNot = (d, th) => {
  if ((d.parent === focus || d === focus) && d.value > th && d !== root) {
    return 'inline'
  } else {
    return 'none'
  }
}

const addLabels = (container, data) => {
  const firstChildren = root.children
  const thPoint = Math.floor(firstChildren.length * 0.8)

  const values = firstChildren.map(child => child.value).sort((a, b) => a - b)

  const th = values[thPoint]

  const labels = container
    .selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('id', d => 'l' + d.data.id)
    .style('fill', '#FFFFFF')
    .style('text-anchor', 'middle')
    .attr('class', 'label')
    // .style('fill-opacity', function(d) {
    //   return d.parent === root ? 1 : 0
    // })
    .style('display', d => showLabelOrNot(d, th))
    // .style('font-size', 10)
    .text(d => d.data.data.Label)
    .style('font-size', d => getFontSize(d))
  // .call(getLabels)

  return labels
}

const addCircles = (container, data) => {
  return container
    .selectAll('circle')

    .data(data)
    .enter()
    .append('circle')
    .attr('id', d => 'c' + d.data.id)
    .attr('class', function(d) {
      return d.parent
        ? d.children ? 'node' : 'node node--leaf'
        : 'node node--root'
    })
    .style('display', function(d) {
      if (d.parent === focus) {
        currentSet.add(d)
      }

      if (d === root || (d.depth < MAX_DEPTH && d.parent === root)) {
        return 'inline'
      } else {
        return 'none'
      }
      // return d.parent === root && d.children !== undefined ? 'inline' : 'none'
    })
    .style('fill', function(d) {
      const data = d.data.data

      // This is a hidden node.
      if (data.props.Hidden === true) {
        if (data.NodeType !== 'Gene') {
          return '#DDDDDD'
        } else {
          return '#238b45'
        }
      }

      if (d.children) {
        return colorMapper(d.depth)
      } else {
        if (data.NodeType !== 'Gene') {
          return colorMapper(d.depth)
        }

        return 'rgba(255, 255, 255, 0.3)'
      }
    })
    .on('dblclick', (d, i, nodes) => {
      if (d === undefined) {
        return
      }

      if (selectedCircle !== undefined) {
        selectedCircle.classed('node-selected', false)
      }

      // Reset sub-selection
      subSelected.forEach(v => {
        v.classed('node-selected-sub', false)
      })
      subSelected.clear()

      // Change border
      selectedCircle = d3Selection.select(nodes[i])
      selectedCircle.classed('node-selected', true)

      if (focus !== d) {
        zoom(d)
        d3Selection.event.stopPropagation()
      }
    })
    .on('mouseover', (d, i, nodes) => handleMouseOver(d, i, nodes, props))
    .on('mouseout', (d, i, nodes) => {
      setTimeout(() => {
        props.eventHandlers.hoverOutNode(d.data.id, d.data.data.props)
      }, 0)
    })
    .on('contextmenu', (d, i, nodes) => {
      if (d === undefined) {
        return
      }

      if (d3Selection.event.ctrlKey) {
        d3Selection.event.preventDefault()

        const newSelection = d3Selection.select(nodes[i])
        const newId = d.data.id
        if (subSelected.has(newId)) {
          subSelected.delete(newId)
          newSelection.classed('node-selected-sub', false)
        } else {
          subSelected.set(newId, newSelection)
          newSelection.classed('node-selected-sub', true)
          props.eventHandlers.selectNode(d.data.id, d.data.data.props, false)
        }
      }
    })
    .on('click', (d, i, nodes) => {})
}

const selectCurrentNodes = (nodes, type) => {
  const nodeIds = nodes.map(node => '#' + type + node.data.id).join(', ')
  return d3Selection.selectAll(nodeIds)
}

const zoom = d => {
  // Update current focus

  const lastFocus = focus

  focus = d

  // if (nodeCount < 10000) {
  //   const transition = d3Transition
  //     .transition()
  //     .duration(TRANSITION_DURATION)
  //     .tween('zoom', d => {
  //       const i = d3Interpolate.interpolateZoom(view, [
  //         focus.x,
  //         focus.y,
  //         focus.r * 2 + MARGIN
  //       ])
  //
  //       return t => {
  //         zoomTo(i(t))
  //       }
  //     })
  //
  //   transition.selectAll('.label').on('end', function(d) {
  //     if (d.parent !== focus) {
  //       this.style.display = 'none'
  //     }
  //     if (d.parent === focus) {
  //       this.style.display = 'inline'
  //     }
  //   })
  //
  // } else {

  labels
    .attr('y', d => getFontSize(d) / 2)
    .style('display', d => {

      // Avoid showing
      if (d === focus && d.height !== 0) {
        return 'none'
      }

      if (
        d.parent === focus ||
        (focus.parent === d.parent && d.parent.depth === focus.parent.depth)
      ) {
        return 'inline'
      }

      return 'none'

      // if (d.parent !== focus) {
      //   return 'none'
      // }
    })

    .style('font-size', d => getFontSize(d))

  // Select next nodes from children of the new focus!

  // const nextNodes = focus.children
  // console.log(nextNodes, circleNodes)

  // t0 = performance.now()

  // const childIds = focus.children.map(node => '#c' + node.data.id).join(', ')
  // const childrenSelected = d3Selection.selectAll(childIds)

  // lastSelection = focus.children

  // t2 = performance.now()

  // console.log('########### Selection Done in ' + (t2 - t0))
  // }

  circleNodes.style('display', d => {
    // Set current depth for later use
    currentDepth = focus.depth

    // Case 1: Genes
    if (d === focus) {
      return 'inline'
    }

    if (
      focus.parent === d ||
      (focus.parent === d.parent && d.parent.depth === focus.parent.depth)
      // (d.parent === lastFocus && d.depth === lastFocus.depth)
    ) {
      return 'inline'
    }

    if (d.parent === focus || (currentDepth >= d.depth && d.height >= 1)) {
      return 'inline'
    } else {
      return 'none'
    }
  })

  setTimeout(() => {
    if (d !== root) {
      props.eventHandlers.selectNode(d.data.id, d.data.data.props, true)
    }
  }, TRANSITION_DURATION + 10)
}

const zoomTo = v => {
  const k = diameter / v[2]

  view = v
  node.attr(
    'transform',
    d => 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')'
  )

  circle.attr('r', d => d.r * k)
}

const handleMouseOver = (d, i, nodes, props) => {
  setTimeout(() => {
    props.eventHandlers.hoverOnNode(d.data.id, d.data.data)
  }, 10)
}

export const selectNodes = selected => {
  console.log(selected)

  if (selected === null) {
    return
  }

  const selectedCircles = selected
    .map(id => '#c' + id)
    .reduce(
      (previousValue, currentValue, index, array) =>
        previousValue + ', ' + currentValue
    )

  const selected2 = d3Selection.selectAll(selectedCircles)
  console.log(selected2)

  selected2.style('fill', 'red').style('display', 'inline')
}

export default CirclePacking
