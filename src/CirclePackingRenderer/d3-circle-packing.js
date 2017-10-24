import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Transition from 'd3-transition'


const getColorMap = () => (d3Scale.scaleLinear()
    .domain([-1, 5])
    .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
    .interpolate(d3Interpolate.interpolateHcl))

export const circlePacking = (tree, svgTree, size=900, props) => {

  const svg = d3Selection
    .select(svgTree)
    .attr('width', size)
    .attr('height', size)

  const margin = 0
  const diameter = +svg.attr('width')


  // Draw base graphics
  const g = svg
    .append('g')
    .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');

  const color = getColorMap()

  const pack = d3Hierarchy.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

  let root = tree

  root = d3Hierarchy.hierarchy(root)
    .sum(function (d) {
      let cCount = 0.1
      if (d.children !== undefined) {
        cCount = d.children.length
      }
      console.log(cCount)
      return cCount * 10;
    })
    .sort(function (a, b) {
      return b.value - a.value;
    });

  let focus = root,
    nodes = pack(root).descendants(),
    view;

  let circle = g.selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('class', function (d) {
      return d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root';
    })
    .style('fill', function (d) {
      return d.children ? color(d.depth) : null;
    })
  // .on('click', function (d) {
  //   if (focus !== d) zoom(d), d3.event.stopPropagation();
  // });

  let text = g.selectAll('text')
    .data(nodes)
    .enter().append('text')
    .attr('class', 'label')
    .style('fill', '#FFFFFF')
    .style('fill-opacity', function (d) {
      return d.parent === root ? 1 : 0;
    })
    .style('display', function (d) {
      return d.parent === root ? 'inline' : 'none';
    })
    .text(function (d) {
      return d.data.name;
    });

  const node = g.selectAll('circle,text');


  svg
    .style('background', color(-1))
  // .on('click', function () {
  //   zoom(root, focus, view);
  // });

  zoomTo([root.x, root.y, root.r * 2 + margin],diameter, node, circle );


}

const zoomTo = (v, diameter, node, circle) => {
  const k = diameter / v[2];

  node.attr('transform', function (d) {
    return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
  });

  circle.attr('r', d => (d.r * k))
}

const zoom = (data, focus, view) => {

  let focus0 = focus
  focus = data

  const transition = d3Transition.transition()
    .duration(d3.event.altKey ? 7500 : 750)
    .tween('zoom', function (d) {
      var i = d3Transition.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
      return function (t) {
        zoomTo(i(t));
      };
    });

  transition.selectAll('text')
    .filter(function (d) {
      return d.parent === focus || this.style.display === 'inline';
    })
    .style('fill-opacity', function (d) {
      return d.parent === focus ? 1 : 0;
    })
    .on('start', function (d) {
      if (d.parent === focus) this.style.display = 'inline';
    })
    .on('end', function (d) {
      if (d.parent !== focus) this.style.display = 'none';
    });
}
