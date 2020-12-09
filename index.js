const fs = require('fs')


// TODO
// - Remove this hyp value; superceded by the row count and other calculations
// - but still closely integrated in calculations
const hyp = 1 // Horizontal "size" of the triangle



// ? Config options
const rowCount = 50 // How many rows to render
// How many triangles per row.
// There should double + 2 the number of rows for a square due to the overlap
// from the alternative inverted layout
// This allows for the triangles that clip off at either side or contain within the viewbox
const fillEdges = true
// Which direction should the triangles fade away to?
// true -> dense at the bottom
// false -> dense at the top
const fadeUp = true
// Ratio of the viewbox
const ratio = [1, 1]
// Size the svg should be rendered at in the dom
const trianglesPerRow = (rowCount * (2 * ratio[0])) + (fillEdges ? 2 : 0)
// How tightly packed should the first row be; 0.5 -> 1
// Higher the number the more dense the overall image will be
// Going below 0.5 will result in the pattern beginning to invert (big -> small -> big)
// Going over 1 introduces small overlap
const maxDensity = 1

const size = [
  hyp * rowCount * ratio[0],
  hyp * rowCount * ratio[1]
]
const viewBox = [
  hyp * rowCount * ratio[0],
  hyp * rowCount * ratio[1]
]

// Colors used in the grandient
// The colors are rendered from top to bottom
// Add new colors with additional objects
// The offset describes where in the gradient the value is introduced 0 -> 1
const gradientColors = [
  { color: 'gold', offset: '0' },
  { color: 'orange', offset: '0.6' },
  { color: 'firebrick', offset: '1' },
]

// Describes the direction of the gradient using 0 -> 1 values
// 0 is the start of the gradient (left for x, top for y)
// 1 is the end of the gradient (right for x, bottom for y)
// x1, y1 are the starting values
// x2, y2 are the end values
const gradientDirection = {
  x1: 0, x2: 0,
  y1: 0, y2: 1,
}




// Each triangle (polygon) contains 3 pairs of coords; one pair for each  node of the triangle
// The sets are created starting from the top left
// The function creates the first, second and thrid node coords serparately
// Which are then combined into a single 3d array
// theis array is mapped over with a polygon template
// A full row of triangles is then returned
// This allows for progressive reduction in scale and quantity of polygons row-by-row creating the 'fade' effect
function createRow (rowIndex) {
  const progress = (fadeUp ? (rowCount - rowIndex) : rowIndex) / rowCount
  const reduction = (progress + (1 - maxDensity)) * (hyp * 0.35)

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


// ? What is the viewbox ?
// viewbox defines the raw size of the space the SVG elements are drawn in.
// Each element's (polygon, rect, circle etc) coords is based of of the viewboxes space
// The width and height properties control how large the svg is rendered in the DOM
// It's like having 1000px square jpg rendered in a 100px square img tag
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size[0]}px" height="${size[1]}px" viewBox="0 0 ${viewBox[0]} ${viewBox[1]}" stroke-width="1" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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

const html = content => `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Triangle pattern</title>
</head>
<body>
  ${content}
</body>
</html>`


fs.writeFile('./triangles.svg', svg, err => {
  if (err) return console.log('\n----------------', '\nERROR WRITING FILE\n', err, '\n\n\n', '----------------')
  console.log('HTML file written')
})


fs.writeFile('./index.html', html(svg), err => {
  if (err) return console.log('\n----------------', '\nERROR WRITING FILE\n', err, '\n\n\n', '----------------')
  console.log('SVG file written')
})

