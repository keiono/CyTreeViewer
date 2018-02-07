import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'
import * as d3Color from 'd3-color'
import * as d3Zoom from 'd3-zoom'

const COMPONENT_ID = 'circle-main'

const MARGIN = 50
const COLOR_RANGE = [d3Color.hsl('steelblue'), d3Color.hsl('#00B8F4')]

const MAX_DEPTH = 2
let currentDepth = 0

let height = 0
let width = 0

const getColorMap = () =>
  d3Scale
    .scaleLinear()
    .domain([-1, 6])
    .range(COLOR_RANGE)
    .interpolate(d3Interpolate.interpolateHcl)

const getSvg = (svgTree, size) => {
  // Clear current tag
  d3Selection.select('#' + COMPONENT_ID).remove()

  return d3Selection
    .select(svgTree)
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .attr('class', 'circle-packing')
    .attr('id', COMPONENT_ID)
}

const getRoot = tree => {
  return d3Hierarchy
    .hierarchy(tree)
    .sum(d => {
      const value = d.data.value
      if (value !== undefined) {
        return value * 10
      } else {
        return 10
      }
    })
    .sort((a, b) => b.value - a.value)
}

const CirclePacking = (tree, svgTree, size, props) => {
  const svg = getSvg(svgTree, size)

  width = size
  height = size

  const diameter = +svg.attr('height')
  const colorMapper = getColorMap()

  // Base setting.
  const g = svg.append('g')
  // .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')')

  const zoomed2 = () => {
    g.attr('transform', d3Selection.event.transform)
  }

  const pack = d3Hierarchy
    .pack()
    .size([diameter - MARGIN, diameter - MARGIN])
    .padding(1)

  let root = getRoot(tree)

  // Set initial focus to the root
  let focus = root

  // Get all children
  let nodes = pack(root).descendants()

  let view

  const zoom2 = d3Zoom
    .zoom()
    .scaleExtent([1 / 20, 40])
    .on('zoom', zoomed2)

  svg.call(zoom2)
  zoom2.translateBy(svg, diameter / 2, diameter / 2)

  svg.on('dblclick.zoom', null)

  const circle = g
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('id', d => d.data.id)
    .attr('class', function(d) {
      return d.parent
        ? d.children ? 'node' : 'node node--leaf'
        : 'node node--root'
    })
    .style('display', function(d) {
      if (d.depth < MAX_DEPTH) {
        return 'inline'
      } else {
        return 'none'
      }
      // return d.parent === root && d.children !== undefined ? 'inline' : 'none'
    })
    .style('fill', function(d) {
      if (d.children) {
        return colorMapper(d.depth)
      } else {
        if (d.data.data.NodeType !== 'Gene') {
          return colorMapper(d.depth)
        }

        return 'rgba(255, 255, 255, 0.3)'
      }
    })
    .on('dblclick', (d, i, nodes) => {
      console.log('DBL_____________________')
      console.log(nodes[i])
      if (d === undefined) {
        return
      }

      if (focus !== d) {
        zoom(d)
        d3Selection.event.stopPropagation()
      }
    })
    .on('mouseover', (d, i, nodes) => handleMouseOver(d, i, nodes, props))
    .on('mouseout', (d, i, nodes) => {
      d3Selection.select(nodes[i]).style('stroke', 'none')

      props.eventHandlers.hoverOnNode(null, null)
    })
    .on('contextmenu', (d, i, nodes) => {
      d3Selection.event.preventDefault()
      console.log('CTR2!!!!!!!!')
      d3Selection.select(nodes[i]).style('fill', 'red')
    })
    .on('click', (d, i, nodes) => {
      console.log('Single_____________________')
      console.log(d3Selection.event.ctrlKey)
      if (d === undefined) {
        return
      }

      if (d3Selection.event.ctrlKey) {
        console.log('CTR!!!!!!!!')
        d3Selection.event.preventDefault()
        d3Selection.select(nodes[i]).style('fill', 'red')
      }
    })

  g
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .style('fill', '#FFFFFF')
    .style('text-anchor', 'middle')
    .attr('class', 'label')
    .style('fill-opacity', function(d) {
      return d.parent === root ? 1 : 0
    })
    .style('display', function(d) {
      return d.parent === root && d.children !== undefined ? 'inline' : 'none'
    })
    .style('font-size', d => getFontSize(d))
    .call(wrap, 100)

  const node = g.selectAll('circle,text')
  const circleNodes = g.selectAll('circle')

  svg.style('background', 'white').on('dblclick', e => {
    if (root !== undefined) {
      currentDepth = MAX_DEPTH

      console.log('&&&&&&&&&&& REST3')
      // zoom2.translateBy(svg, width / 2, height / 2).scale(1)
      const trans = d3Zoom.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1)

      svg
        // .transition()
        // .duration(750)
        .call(zoom2.transform, trans)

      zoom(root)
    }
  })

  const zoom = d => {
    focus = d

    const transition = d3Transition
      .transition()
      .duration(350)
      .tween('zoom', function(d) {
        const i = d3Interpolate.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + MARGIN
        ])
        return t => {
          zoomTo(i(t))
        }
      })

    const text = transition.selectAll('.label')

    text.on('end', function(d) {
      if (d.parent !== focus) {
        this.style.display = 'none'
      }
      if (d.parent === focus) {
        this.style.display = 'inline'
        this.style['fill-opacity'] = 1
      }
    })

    const circles = circleNodes.style('display', function(d) {
      currentDepth = focus.depth

      if (d.parent === focus || (currentDepth >= d.depth && d.height >= 1)) {
        return 'inline'
      } else {
        return 'none'
      }
      // return d.parent === root && d.children !== undefined ? 'inline' : 'none'
    })
    // .attr('class', function(d, i, nodes) {
    //   if (d === focus) {
    //
    //     console.log(nodes[i])
    //     return 'node-selected'
    //   }
    // })

    // if (d !== root) props.eventHandlers.selectNode(d.data.id, d.data.data.props)
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

  const v = [root.x, root.y, root.r * 2 + MARGIN]
  zoomTo(v)
}

const getFontSize = d => {
  const circleD = d.r / 2

  const baseFontSize = circleD

  if (baseFontSize >= 25) {
    return 25
  } else if (baseFontSize <= 10) {
    return 10
  } else {
    return baseFontSize
  }
}

const focusTo = (d, element, width, height, containerElement, zoomFunction) => {
  const bounds = element.getBBox()
  console.log(bounds)
  // const dx = bounds[1][0] - bounds[0][0],
  //   dy = bounds[1][1] - bounds[0][1],
  const x = bounds.x,
    y = bounds.y,
    // scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
    translate = [x, y]

  containerElement
    .transition()
    .duration(750)
    .call(
      zoomFunction.transform,
      d3Zoom.zoomIdentity.translate(translate[0], translate[1]).scale(2)
    )
}

const handleMouseOver = (d, i, nodes, props) => {
  props.eventHandlers.hoverOnNode(d.data.id, d.data.data)

  const element = nodes[i]
  d3Selection.select(element).style('stroke', (d) => {
    return 'white'
  })

  console.log(element)
  // d3Selection.select(element).attr('class', (d, i, classes) => {
  //   console.log(classes)
  //   return classes + ' current-node'
  // })

  d3Selection.selectAll('.label').style('fill', d2 => {
    if (d2 === undefined || d2.data === undefined) {
      return null
    }
    if (d.data.id === d2.data.id) {
      return 'orange'
    } else {
      return '#FFFFFF'
    }
  })
}

const wrap = (text, width) => {
  console.log(text)

  text.each(function() {
    const text = d3Selection.select(this)

    const labelText = text.data()[0].data.data.Label
    const words = labelText.split(/\s+/)

    let lineNumber = 0
    const lineHeight = 4

    const data = text.data()[0]

    let word
    let line = []

    const wordCount = words.length
    // Case 1: single word

    if (wordCount === 1 || wordCount === 2) {
      text.text(labelText)
      return
    }

    // Case 2: multiple words

    // let tspan = text.text(null).append('tspan')

    let tspan
    // while ((word = words.pop())) {
    for (let i = 0; i < wordCount - 1; i = i + 2) {
      const word1 = words[i]
      const word2 = words[i + 1]

      const word = word1 + ' ' + word2
      tspan = text
        .append('tspan')
        .attr('x', 0)
        .attr('y', -data.r / 2)
        .attr('dy', lineNumber * 1.1 + 'em')
        .text(word)

      lineNumber++
    }
  })
}

export default CirclePacking
