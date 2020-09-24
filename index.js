const fs = require('fs')

const hyp = 100 // Horizintal "size" of the triangle
const rowCount = 10 // How many rows to render
// How many triangles per row.
// There should double + 2 the number of rows for a square due to the overlap
// from the alternative inverted layout
// This allows for the triangles that clip off at either side
const trianglesPerRow = (rowCount * 2)
// Which direction should the triangles fade away to?
const fadeDown = true
// Size the svg should be rendered at in the dom
const size = 1000


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
    .map((x, i) => `<polygon
      points="${x[0].join(',')} ${x[1].join(',')} ${x[2].join(',')}"
      style="
        fill: white;
      "/>`)
    .join('\n')

  return polygons
}

// fill: rgba(
//   ${Math.floor((50 * Math.random()) + 200)},
//   ${Math.floor(Math.random() * 50)},
//   ${Math.floor(Math.random() * 50)},
// 1);

const multirowPolygon = [... new Array(rowCount)]
  .map((x, i) => createRow(i))
  .join('\n\n<!-- end of row -->\n\n')


// ? What is the viewbox ?
// viewbox defines the raw size of the space the SVG elements are drawn in.
// Each element's (polygon, rect, circle etc) coords is based of of the viewboxes space
// The width and height properties control how large the svg is rendered in the DOM
// It's like having 1000px square jpg rendered in a 100px square img tag

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}px" height="${size}" viewBox="0 0 1000 1000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="gradient" x1="0" x2="0" y1="1" y2="0">
      <stop offset="0" stop-color="firebrick" />
      <stop offset="0.5" stop-color="orange" />
      <stop offset="1" stop-color="gold" />
    </linearGradient>
    <mask id="hole-mask">
      ${multirowPolygon}
    </mask>
  </defs>
  <rect width="1000" height="1000" mask="url(#hole-mask)" fill="url(#gradient)"></rect>
</svg>`

fs.writeFile('./triangles.svg', svg, err => {
  if (err) return console.log('\n----------------', '\nERROR WRITING FILE\n', err, '\n\n\n', '----------------')
  console.log('file written')
})

