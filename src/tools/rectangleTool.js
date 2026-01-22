import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let rect = null

const rectangleTool = {
  onMouseDown(e, stage, x, y) {
    editorState.isDrawing = true
    editorState.startX = x
    editorState.startY = y

    rect = document.createElement("div")
    rect.className = "vf-elem vf-rect"
    rect.dataset.type = "rectangle"
    rect.style.backgroundColor = editorState.fillColor

    Object.assign(rect.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: "0px",
      height: "0px"
    })

    stage.appendChild(rect)
  },

  onMouseMove(e, stage, x, y) {
    if (!editorState.isDrawing || !rect) return

    const w = x - editorState.startX
    const h = y - editorState.startY

    rect.style.width = `${Math.abs(w)}px`
    rect.style.height = `${Math.abs(h)}px`
    rect.style.left = `${Math.min(x, editorState.startX)}px`
    rect.style.top = `${Math.min(y, editorState.startY)}px`
  },

  onMouseUp() {
    editorState.isDrawing = false
    rect = null
    saveState()
  }
}

export default rectangleTool
