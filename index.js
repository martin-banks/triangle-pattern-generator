const fs = require('fs')

const hyp = 10 // Horizintal "size" of the triangle
const rowCount = 10 // How many rows to render
// How many triangles per row.
// There should double + 2 the number of rows for a square due to the overlap
// from the alternative inverted layout
// This allows for the triangles that clip off at either side
const fillEdges = false
// Which direction should the triangles fade away to?
const fadeDown = true
// Ratio of the viewbox
const ratio = [1, 1]
// Size the svg should be rendered at in the dom
const size = [1000 * ratio[0], 1000 * [1]]
const trianglesPerRow = (rowCount * (2 * ratio[0])) + (fillEdges ? 2 : 0)
const viewBox = [hyp * rowCount * ratio[0], hyp * rowCount * ratio[1]]



// Each triangle (poly gon) contains 3 pairs of coords; one pair for each  node of the triangle
// The sets are created starting from the top left
// The function creates the first, second and thrid node coords serparately
// Which are then combined into a single 3d array
// theis array is mapped over with a polygon template
// A full row of triangles is then returned
// This allows for progressive reduction in scale and quantity of polygons row-by-row creating the 'fade' effect
function createRow (rowIndex) {
  const progress = (fadeDown ? (rowCount - rowIndex) : rowIndex) / rowCount
  const reduction = (progress + 0.2) * (hyp * 0.35)

  const firstPoints = [...new Array(trianglesPerRow)]
    .map((x, i) => [
      (Math.floor(i / 2) * hyp) - ((hyp / 2) * (rowIndex % 2)) + (!(i % 2) ? 0 : reduction), // scale -> even: 0 || odd: +
      (hyp * (rowIndex)) + (!(i % 2) ? reduction : reduction) // scale -> even: + || odd: +
    ])

  const secondPoints = [... new Array(trianglesPerRow)]
    .map((x, i) => [
      (((i + 1) * (hyp / 2)) - ((hyp / 2) * (rowIndex % 2)))  + (!(i % 2) ? (-1 * reduction) : (-1 * reduction)), // scale even: - || odd: -
      (((((i + 1) % 2) * hyp)) + (hyp * (rowIndex))) + (!(i % 2) ? (-1 * reduction) : reduction) // scale even: - || odd: +
    ])

  const thirdPoints = [... new Array(trianglesPerRow)]
    .map((x, i) => [
      (((Math.floor((i + 1) / 2) * hyp) - (hyp / 2)) - ((hyp / 2) * (rowIndex % 2))) + (!(i % 2) ? reduction : 0),  // scale even: + || odd: 0
      (hyp * ((rowIndex) + 1)) + (!(i % 2) ? (-1 * reduction) : (-1 * reduction)) // scale even: + || odd: -
    ])

  // Creates each triangle polygon
  const polygons = [... new Array(trianglesPerRow)]
    .map((x, i) => [firstPoints[i], secondPoints[i], thirdPoints[i]])
    .filter((x, i) => ((Math.random() - progress) + 0.2) > 0.1)
    // .filter((x, i) => !fillEdges ? (x[0] < 0 || x[1] < 0 || x[2] < 0) : true)
    .filter((x, i, a) => ((!fillEdges) && (x[0][0] < 0 || x[1][0] < 0 || x[2][0] < 0)) ? false : true)
    .map((x, i) => `<polygon
      data-row="${i}"
      points="${x[0].join(',')} ${x[1].join(',')} ${x[2].join(',')}"
      style="
        fill: white;
      "/>`)
    .join('\n')

  return polygons
}


const multirowPolygon = [... new Array(rowCount)]
  .map((x, i) => createRow(i))
  .join('\n<!-- end of row -->\n')


const gradientColors = [
  { color: 'firebrick', offset: '0' },
  { color: 'orange', offset: '0.5' },
  { color: 'gold', offset: '1' },
]
const gradientDirection = {
  x1: 0,
  x2: 0,
  y1: 1,
  y2: 0,
}

// ? What is the viewbox ?
// viewbox defines the raw size of the space the SVG elements are drawn in.
// Each element's (polygon, rect, circle etc) coords is based of of the viewboxes space
// The width and height properties control how large the svg is rendered in the DOM
// It's like having 1000px square jpg rendered in a 100px square img tag
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size[0]}px" height="${size[1]}px" viewBox="0 0 ${viewBox[0]} ${viewBox[1]}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="gradient" x1="${gradientDirection.x1}" x2="${gradientDirection.x2}" y1="${gradientDirection.y1}" y2="${gradientDirection.y2}">
      ${gradientColors.map(g => `<stop offset="${g.offset}" stop-color="${g.color}" />`).join(' ')}
    </linearGradient>
    <mask id="hole-mask">
      ${multirowPolygon}
    </mask>
  </defs>
  <rect width="${viewBox[0]}px" height="${viewBox[1]}px" mask="url(#hole-mask)" fill="url(#gradient)"></rect>
</svg>`

fs.writeFile('./triangles.svg', svg, err => {
  if (err) return console.log('\n----------------', '\nERROR WRITING FILE\n', err, '\n\n\n', '----------------')
  console.log('file written')
})

