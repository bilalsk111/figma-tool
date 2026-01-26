import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let svgLayer = null
let path = null

function ensurePencilLayer(stage) {
  if (svgLayer && stage.contains(svgLayer)) return svgLayer

  svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svgLayer.setAttribute("id", "pencilLayer")

  svgLayer.style.position = "absolute"
  svgLayer.style.left = "0"
  svgLayer.style.top = "0"
  svgLayer.style.width = "100%"
  svgLayer.style.height = "100%"
  svgLayer.style.pointerEvents = "none"
  svgLayer.style.overflow = "visible"

  stage.appendChild(svgLayer)
  return svgLayer
}

function toWorld(x, y) {
  const z = editorState.zoom || 1
  return {
    x: x / z,
    y: y / z,
  }
}

const pencilTool = {
  onMouseDown(e, stage, x, y) {
    editorState.isDrawing = true

    const layer = ensurePencilLayer(stage)
    const p = toWorld(x, y)

    path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", `M ${p.x} ${p.y}`)
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", editorState.fillColor)
    path.setAttribute("stroke-width", 2 / (editorState.zoom || 1))
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")

    layer.appendChild(path)
  },

  onMouseMove(e, stage, x, y) {
    if (!editorState.isDrawing || !path) return

    const p = toWorld(x, y)
    const d = path.getAttribute("d")
    path.setAttribute("d", `${d} L ${p.x} ${p.y}`)
  },

  onMouseUp() {
    if (!path) return

    editorState.isDrawing = false
    path = null
    saveState()
  },
}

export default pencilTool
