import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'

const MARGIN = 20
const BACKGROUND = '#EFEFEF'

const getColorMap = () =>
  d3Scale
    .scaleLinear()
    .domain([-1, 5])
    .range(['hsl(86, 40%, 64%)', 'hsl(220,50%,50%)'])
    .interpolate(d3Interpolate.interpolateHcl)

const getSvg = (svgTree, size) =>
  d3Selection
    .select(svgTree)
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .attr('class', 'circle-packing')

const CirclePacking = (tree, svgTree, size = 1000) => {
  const svg = getSvg(svgTree, size)

  const diameter = +svg.attr('height')
  const colorMapper = getColorMap()

  // Draw base graphics
  const bg = svg
    .append('rect')
    .attr('width', size)
    .attr('height', size)
    .style('fill', BACKGROUND)

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
      if(value !== undefined) {
        return value * 10
      }else {
        return 10
      }
    })
    .sort((a, b) => b.value - a.value)

  let focus = root
  let nodes = pack(root).descendants()
  let view

  console.log(nodes)

  const circle = g
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr("id", d=> (d.data.id))
    .attr('class', function(d) {
      return d.parent
        ? d.children ? 'node' : 'node node--leaf'
        : 'node node--root'
    })
    .style('fill', function(d) {
      return d.children ? colorMapper(d.depth) : 'rgba(255, 255, 255, 0.2)'
    })
    .on('click', function(d) {
      if (focus !== d) zoom(d), d3Selection.event.stopPropagation()
    })


  const text = g
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .style('fill', '#FFFFFF')
    .style('text-anchor', 'middle')

    .attr('class', function(d) {
      return d.parent
        ? d.children ? 'label' : 'label label--leaf'
        : 'label label--root'
    })
    .style('font-size', d => {
      const val = d.data.data.value
      if(val !== undefined) {
        const size = val
        if(size >= 60) {
          return 60
        } else if(size<=8) {
          return 8
        }
      } else {
        return 8
      }
    })
    .style('fill-opacity', function(d) {
      // return 1
      return d.parent === root ? 1 : 0;
    })
    .style('display', d => {

      if(d.parent === root) {
        // Direct child of the current root circle
        if(d.depth === 1 && d.children === undefined) {
          return 'none'
        }

        return 'inline'
      } else {
          return 'none'
      }
      // return d.parent === root ? 'inline' : 'none'
    })
    .text(d => d.data.id)

  const node = g.selectAll('circle,text')

  svg.style('background', colorMapper()).on('click', (e) => {
    zoom(root)
  })

  const zoom = d => {
    console.log("ZOO<M!!!!!!!!!!!")
    console.log(d)
    focus = d

    const transition = d3Transition
      .transition()
      .duration(d3Selection.event.altKey ? 7500 : 750)
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

    console.log(focus)

    transition
      .selectAll('text')

      .filter(function(d) {
        return d.parent === focus || this.style.display === 'inline'
      })
      .style('fill-opacity', function(d) {
        return d.parent === focus ? 1 : 0
      })
      .on('start', function(d) {
        if (d.parent === focus) this.style.display = 'inline'
      })

      .on('end', function(d) {
        if (d.parent !== focus) {
          this.style.display = 'none'
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

export default CirclePacking
