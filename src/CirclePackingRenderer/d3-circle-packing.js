import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'
import * as d3Color from 'd3-color'

const MARGIN = 50
const COLOR_RANGE = [d3Color.hsl('steelblue'), d3Color.hsl('#00B8D4')]

const getColorMap = () =>
  d3Scale
    .scaleLinear()
    .domain([-1, 5])
    .range(COLOR_RANGE)
    .interpolate(d3Interpolate.interpolateHcl)

const getSvg = (svgTree, size) =>
  d3Selection
    .select(svgTree)
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .attr('class', 'circle-packing')


const CirclePacking = (tree, svgTree, size, props) => {
  console.log(size)
  const svg = getSvg(svgTree, size)

  const diameter = +svg.attr('height')
  const colorMapper = getColorMap()

  const g = svg
    .append('g')
    .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')')

  const pack = d3Hierarchy
    .pack()
    .size([diameter - MARGIN, diameter - MARGIN])
    .padding(1)

  let root = d3Hierarchy
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

  // Set initial focus to the root
  let focus = root

  // Get all of children
  let nodes = pack(root).descendants()

  let view

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
    .style('fill', function(d) {
      if (d.children) {
        return colorMapper(d.depth)
      } else {
        if (d.data.data.nodeType !== 'Gene') {
          return colorMapper(d.depth)
        }

        return 'rgba(255, 255, 255, 0.3)'
      }
    })
    .on('click', (d) => {

      props.eventHandlers.selectNode(d.data.id, d)

      if (focus !== d) zoom(d), d3Selection.event.stopPropagation()
    })
  .on('mouseover', (d, i, nodes) => handleMouseOver(d, i, nodes, props))
  .on("mouseout", () => {
    props.eventHandlers.hoverOnNode(null, null)
  })

  const text = g
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
    // .style('fill-opacity', function(d) {
    //   return d.parent === root ? 1 : 0
    // })
    // .style('display', d => getFontDisplay(d, root))
    .text(d => d.data.id)

  const node = g.selectAll('circle,text')

  svg.style('background', colorMapper(-1)).on('click', e => {
    console.log('------------------- CLICK')
    console.log(e)
    zoom(root)
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

    const text = transition.selectAll('text')

    let filtered
    if (d.height === 0) {
      filtered = text.filter(function(d) {
        this.style.display = 'inline'

        return d.parent === focus
      })
    } else {
      filtered = text.filter(function(d) {
        return d.parent === focus || this.style.display === 'inline'
      })
    }

    console.log(filtered)

    filtered
      .style('fill-opacity', function(d) {
        if (d.parent === focus) {
          if(d.height === 0) {
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
  const circleD = d.r

  const baseFontSize = circleD
  if (baseFontSize >= 50) {
    return 50
  } else if (baseFontSize <= 12) {
    return 12
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
  // console.log('HOVER')
  // console.log(d)
  // console.log(i)
  // console.log(nodes)

  props.eventHandlers.hoverOnNode(d.data.id, d.data)

  d3Selection.selectAll('text').style('fill', d2 => {
    if (d2.data === undefined) {
      return '#00FF00'
    }
    if (d.data.id === d2.data.id) {
      return 'orange'
    } else {
      return '#FFFFFF'
    }
  })
}

export default CirclePacking
