/* global OffscreenCanvas */

const canvas1 = document.getElementById('canvas')
const context1 = canvas1.getContext('2d')

const N = 50
const canvas0 = new OffscreenCanvas(N, N)
const context0 = canvas0.getContext('2d')
context0.imageSmoothingEnabled = false

// Disable Right Click Menu
document.oncontextmenu = () => false

const range = n => [...Array(n).keys()]

const dt = 0.01
const minLife = 0.25
const minColor = 0.3
const reach = 4

const mouse = {
  down: [false, false, false],
  loc: [0, 0],
  x: 0,
  y: 0,
  node: {}
}
const keys = {
  shift: false
}
let scale = 1

const grid = range(N).map(i => range(N).map(j => {
  const node = { align: 'none', red: 0, green: 0, blue: 0, life: 0, oldLife: 0, level: 0, x: j, y: i }
  node.neighbors = []
  return node
}))
const nodes = grid.flat()
range(N).forEach(i => range(N).forEach(j => {
  const L = N - 1
  const node = grid[i][j]
  if (i < L) node.neighbors.push(grid[i + 1][j])
  if (i > 0) node.neighbors.push(grid[i - 1][j])
  if (j < L) node.neighbors.push(grid[i][j + 1])
  if (j > 0) node.neighbors.push(grid[i][j - 1])
}))
nodes.forEach(node => {
  if (Math.random() < 0.002) develop({ color: 'green', actor: 'green', loc: node, reach })
})

function updateMouse (e) {
  const cx = canvas1.getBoundingClientRect().left
  const cy = canvas1.getBoundingClientRect().top
  mouse.y = Math.floor((e.pageY - cy) * N / scale)
  mouse.x = Math.floor((e.pageX - cx) * N / scale)
}

window.onmousemove = function (e) {
  updateMouse(e)
}

window.onmousedown = function (e) {
  if (e.button === 0) mouse.down[0] = true
  if (e.button === 1) mouse.down[1] = true
  if (e.button === 2) mouse.down[2] = true
  updateMouse(e)
  console.log(mouse.x, mouse.y)
}

window.onmouseup = function (e) {
  if (e.button === 0) mouse.down[0] = false
  if (e.button === 1) mouse.down[1] = false
  if (e.button === 2) mouse.down[2] = false
}

window.onkeydown = function (e) {
  if (e.key === 'Shift') keys.shift = true
}

window.onkeyup = function (e) {
  if (e.key === 'Shift') keys.shift = false
}

function develop (options) {
  const { color, actor, loc, reach } = options
  let minDist = N
  nodes.forEach(node => {
    if (['none', 'green', color, actor].includes(node.align)) {
      const dx = loc.x - node.x
      const dy = loc.y - node.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      minDist = Math.min(dist, minDist)
      if (dist < reach) {
        console.log('reach')
        node[color] = 1
        if (color !== node.align) {
          node.life = 1
          node.level = 0
        }
        const growth = minColor + (reach - dist) / reach
        node.level = Math.max(node.level, Math.min(growth, 1))
        node.align = color
      }
    }
  })
  console.log(minDist)
}

function update () {
  if (keys.shift) {
    if (mouse.down[0]) develop({ color: 'red', actor: 'red', loc: mouse, reach })
    if (mouse.down[2]) develop({ color: 'green', actor: 'red', loc: mouse, reach })
  } else {
    if (mouse.down[0]) develop({ color: 'blue', actor: 'blue', loc: mouse, reach })
    if (mouse.down[2]) develop({ color: 'green', actor: 'blue', loc: mouse, reach })
  }
  nodes.forEach(node => {
    const fortified = ['red', 'blue'].includes(node.align)
    const cultivated = node.align === 'green'
    node.life += 1 * cultivated * dt
    node.life -= 0.5 * fortified * dt
    node.life = Math.max(0, Math.min(1, node.life))
    node.oldLife = node.life
  })
  range(10).forEach(i => {
    nodes.forEach(node => {
      node.neighbors.forEach(neighbor => {
        const connect = node.align === 'green' || node.align === neighbor.align
        const support = connect && neighbor.align !== 'none'
        const diff = 0.5 * Math.max(0, node.life - neighbor.life)
        const flow = support * Math.min(diff)
        neighbor.life += flow
        node.life -= flow
      })
    })
  })
  nodes.forEach(node => {
    if (node.life < minLife) {
      node.life = 0
      node.level = 0
      node.align = 'none'
    }
  })
}

function setupCanvas () {
  scale = 0.95 * Math.min(window.innerHeight, window.innerWidth)
  canvas1.width = scale
  canvas1.height = scale
  const xTranslate = 0
  const yTranslate = 0
  const xScale = scale / N
  const yScale = scale / N
  context1.setTransform(xScale, 0, 0, yScale, xTranslate, yTranslate)
  context1.imageSmoothingEnabled = false
}

function drawState () {
  const imageData = context0.createImageData(N, N)
  range(N * N).forEach(i => {
    const node = nodes[i]
    const alive = node.life > 0
    if (node.align === 'none') {
      imageData.data[i * 4 + 0] = 0
      imageData.data[i * 4 + 1] = 0
      imageData.data[i * 4 + 2] = 0
      imageData.data[i * 4 + 3] = 255
    }
    if (node.align === 'green') {
      imageData.data[i * 4 + 0] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 1] = 50 + 100 * node.life * node.level * node.green
      imageData.data[i * 4 + 2] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 3] = 255
    }
    if (node.align === 'blue') {
      imageData.data[i * 4 + 0] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 1] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 2] = 50 + 200 * node.life * node.level * node.blue
      imageData.data[i * 4 + 3] = 255
    }
    if (node.align === 'red') {
      imageData.data[i * 4 + 0] = 50 + 150 * node.life * node.level * node.red
      imageData.data[i * 4 + 1] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 2] = 100 * alive * (1 - node.life) * node.level
      imageData.data[i * 4 + 3] = 255
    }
  })
  context0.putImageData(imageData, 0, 0)
  context1.clearRect(0, 0, 100, 100)
  context1.drawImage(canvas0, 0, 0)
}

function draw () {
  setupCanvas()
  drawState()
  window.requestAnimationFrame(draw)
}

draw()
setInterval(update, 2)
