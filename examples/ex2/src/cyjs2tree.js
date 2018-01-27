import * as d3Hierarchy from 'd3-hierarchy'

const cyjs2tree = cyjs => {
  if (cyjs === undefined || cyjs === null) {
    // Return empty

    return null
  }

  //Find root
  const nodes = cyjs.elements.nodes
  let idx = nodes.length

  const nodeMap = new Map()

  let root = null
  while (idx--) {
    const node = nodes[idx]
    const data = node.data
    if (data['NodeType'] !== 'Gene' && !data['Label'].includes('Hidden')) {
      const isRoot = nodes[idx].data.isRoot
      if (isRoot) {
        root = nodes[idx]
      }

      nodeMap.set(nodes[idx].data.id, nodes[idx].data.name)
    }
  }

  console.log(root)

  const rootId = root.data.id
  const edges = cyjs.elements.edges

  const table = transform(rootId, edges, nodeMap)

  return d3Hierarchy
    .stratify()
    .id(function(d) {
      return d.name
    })
    .parentId(function(d) {
      return d.parent
    })(table)
}

const transform = (rootId, edges, nodeMap) => {
  const table = []

  table.push({
    name: nodeMap.get(rootId),
    parent: ''
  })

  edges.forEach(edge => {

    const source = nodeMap.get(edge.data.source)
    const target = nodeMap.get(edge.data.target)

    if(source !== undefined && target !== undefined) {
      table.push({
        name: source,
        parent: target
      })

    } else {
      console.log('!!!!!!!!!!! leaf')
    }

  })

  return table
}

export default cyjs2tree
