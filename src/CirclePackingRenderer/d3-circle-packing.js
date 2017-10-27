import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'


const MARGIN = 20

const getColorMap = () => (d3Scale.scaleLinear()
  .domain([-1, 5])
  .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
  .interpolate(d3Interpolate.interpolateHcl))

const getSvg = (svgTree, size=900) => (
  d3Selection
    .select(svgTree)
    .attr('width', size)
    .attr('height', size)
)


export const circlePacking = (tree, svgTree) => {

  const svg = getSvg(svgTree)
  const diameter = +svg.attr('width')
  const colorMapper = getColorMap()

  // Draw base graphics
  const g = svg
    .append('g')
    .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');

  const pack = d3Hierarchy.pack()
    .size([diameter - MARGIN, diameter - MARGIN])
    .padding(2);

  let root = d3Hierarchy.hierarchy(tree)
    .sum(d => (d.size))
    .sort((a, b) => (b.value - a.value))

  let focus = root
  let nodes = pack(root).descendants()
  let view

  const circle = g.selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('class', function (d) {
      return d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root';
    })
    .style('fill', function (d) {
      return d.children ? colorMapper(d.depth) : '#FFFFFF';
    })
    .on('click', function (d) {
      if (focus !== d) zoom(d), d3Selection.event.stopPropagation();
    });

  const text = g.selectAll('text')
    .data(nodes)
    .enter().append('text')
    .attr('class', 'label')
    .style('fill', '#FF0000')
    .style('fill-opacity', function (d) {
      return 1;
      // return d.parent === root ? 1 : 0;
    })
    .style('display', function (d) {
      return d.parent === root ? 'inline' : 'none';
    })
    .text(d => (d.data.name))

  const node = g.selectAll('circle,text')

  svg
    .style('background', colorMapper())
    .on('click', function () {
      zoom(root);
    });


  const zoom = (d) => {
    focus = d;

    const transition = d3Transition
      .transition()
      .duration(d3Selection.event.altKey ? 7500 : 750)
      .tween("zoom", function(d) {
        const i = d3Interpolate.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + MARGIN]);
        return t => { zoomTo(i(t)) }
      });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
      .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
      .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }


  const zoomTo = (v) => {

    const k = diameter / v[2]

    view = v

    console.log("NOde 222")
    console.log(node)
    node.attr("transform",
      d => ("translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")")
    )

    circle.attr("r", d => (d.r * k))

  }

  console.log("******* NODE")
  console.log(node)
  const v = [root.x, root.y, root.r * 2 + MARGIN]
  zoomTo(v)
}

