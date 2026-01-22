import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let svgLayer = null
let path = null

function ensurePencilLayer(stage) {
  if (svgLayer && stage.contains(svgLayer)) return svgLayer

  svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svgLayer.setAttribute("id", "pencilLayer")
  svgLayer.style.position = "absolute"
  svgLayer.style.inset = "0"
  svgLayer.style.pointerEvents = "none"

  stage.appendChild(svgLayer)
  return svgLayer
}

const pencilTool = {
  onMouseDown(e, stage, x, y) {
    editorState.isDrawing = true

    const layer = ensurePencilLayer(stage)

    path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", `M ${x} ${y}`)
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", editorState.fillColor)
    path.setAttribute("stroke-width", "2")

    layer.appendChild(path)
  },

  onMouseMove(e, stage, x, y) {
    if (!editorState.isDrawing || !path) return
    const d = path.getAttribute("d")
    path.setAttribute("d", `${d} L ${x} ${y}`)
  },

  onMouseUp() {
    editorState.isDrawing = false
    path = null
    saveState()
  }
}

export default pencilTool
