import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let tri = null

const triangleTool = {
  onMouseDown(e, stage, x, y) {
    editorState.isDrawing = true
    editorState.startX = x
    editorState.startY = y

    tri = document.createElement("div")
    tri.className = "vf-elem vf-triangle"
    tri.dataset.type = "triangle"
    tri.style.backgroundColor = editorState.fillColor

    Object.assign(tri.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: "0px",
      height: "0px"
    })

    stage.appendChild(tri)
  },

  onMouseMove(e, stage, x, y) {
    if (!editorState.isDrawing || !tri) return

    const w = x - editorState.startX
    const h = y - editorState.startY

    tri.style.width = `${Math.abs(w)}px`
    tri.style.height = `${Math.abs(h)}px`
    tri.style.left = `${Math.min(x, editorState.startX)}px`
    tri.style.top = `${Math.min(y, editorState.startY)}px`
  },

  onMouseUp() {
    editorState.isDrawing = false
    tri = null
    saveState()
  }
}

export default triangleTool
