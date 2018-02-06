import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'
import * as d3Color from 'd3-color'
import * as d3Zoom from 'd3-zoom'

const COMPONENT_ID = 'circle-main'

const MARGIN = 50
const COLOR_RANGE = [d3Color.hsl('steelblue'), d3Color.hsl('#00B8D4')]

const MAX_DEPTH = 2

let currentDepth = 0

const getColorMap = () =>
  d3Scale
    .scaleLinear()
    .domain([-1, 5])
    .range(COLOR_RANGE)
    .interpolate(d3Interpolate.interpolateHcl)

const getSvg = (svgTree, size) => {
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

const handleMouseOut = (d, i, nodes, eventHandlers) => {
  eventHandlers.hoverOnNode(null, null)
}

const CirclePacking = (tree, svgTree, size, props) => {
  const svg = getSvg(svgTree, size)

  const diameter = +svg.attr('height')
  const colorMapper = getColorMap()

  // Base setting.
  const g = svg
    .append('g')
    .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')')

  const zoomed2 = function() {
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

  console.log('----------- Initial setup --------')
  console.log(root)
  console.log(nodes)

  // const filtered = nodes.filter((d, i) => d.height !== 0)

  console.log(nodes)
  // console.log(filtered)

  svg.call(
    d3Zoom
      .zoom()
      .scaleExtent([1 / 10, 30])
      .on('zoom', zoomed2)
  )

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
    .on('dblclick', d => {
      console.log('DBL_____________________')
      if (d === undefined) {
        return
      }

      if (focus !== d) zoom(d), d3Selection.event.stopPropagation()
    })
    .on('mouseover', (d, i, nodes) => handleMouseOver(d, i, nodes, props))
    .on('mouseout', () => {
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

  const text = g
    .selectAll('text')
    .data(nodes)
    // .data(filtered)
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
    // .style('font-size', '1em')
    // .style('fill-opacity', function(d) {
    //   return d.parent === root ? 1 : 0
    // })
    // .style('display', d => getFontDisplay(d, root))
    // .text(d => d)
    // .text(d => d.data.data.Label)
    .call(wrap, 100)
  // .style('font-size', (d, i, nodes) => {
  //   console.log(nodes[i].getComputedTextLength())
  //
  //   const dir = 2 * d.r
  //
  //   return dir / d.data.data.Label.length
  //
  //   // Math.min(2 * d.r, (2 * d.r - 8) / nodes[i].getComputedTextLength() * 12) +
  //   // 'px'
  // })
  // .attr('dy', '.35em')

  const node = g.selectAll('circle,text')

  svg.style('background', colorMapper(-1)).on('dblclick', e => {
    // console.log('------------------- DBL CLICK')
    //
    // console.log(e)
    //
    // console.log(root)
    if (root !== undefined) {
      currentDepth = MAX_DEPTH
      zoom(root)
    }
  })

  const zoom = d => {
    focus = d

    const transition = d3Transition
      .transition()
      .duration(d3Selection.event.altKey ? 7500 : 950)
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

    let filtered
    if (d.height === 0) {
      filtered = text.filter(function(d) {
        this.style.display = 'inline'

        return d.parent === focus
      })
    } else {
      filtered = text.filter(function(d) {
        if (d === undefined) {
          return false
        }

        return d.parent === focus || this.style.display === 'inline'
      })
    }

    console.log(filtered)

    filtered
      .style('fill-opacity', function(d) {
        if (d.parent === focus) {
          if (d.height === 0) {
            return 1
          }

          if (d.parent === root && d.children === undefined) {
            return 0
          }

          return 1
        } else {
          return 0
        }
      })
      .on('start', function(d) {
        if (d.parent === focus) {
          if (d.parent === root && d.children === undefined) {
            this.style.display = 'none'
          } else {
            this.style.display = 'inline'
          }
        }
      })
      .on('end', function(d) {
        if (d.parent !== focus) {
          this.style.display = 'none'
        } else {
          if (d.parent === root && d.children === undefined) {
            this.style.display = 'none'
          }
        }
      })

    const circles = transition
      .selectAll('circle')
      .style('display', function(d) {
        currentDepth = focus.depth

        if (d.parent === focus || (currentDepth >= d.depth && d.height>= 1)) {
          return 'inline'
        } else {
          return 'none'
        }
        // return d.parent === root && d.children !== undefined ? 'inline' : 'none'
      })
    console.log('==================About to call')
    console.log(d)

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

  if (baseFontSize >= 30) {
    return 30
  } else if (baseFontSize <= 10) {
    return 10
  } else {
    return baseFontSize
  }
}

const getFontDisplay = (d, root) => {
  if (d.parent === root) {
    // Direct child of the current root circle
    // if (d.depth === 1 && d.children === undefined) {
    //   return 'none'
    // }

    return 'inline'
  } else {
    return 'inline'
  }
}

const handleMouseOver = (d, i, nodes, props) => {
  props.eventHandlers.hoverOnNode(d.data.id, d.data.data)

  d3Selection.selectAll('text').style('fill', d2 => {
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
