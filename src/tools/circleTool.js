import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let circle = null

const circleTool = {
  onMouseDown(e, stage, x, y) {
    editorState.isDrawing = true
    editorState.startX = x
    editorState.startY = y

    circle = document.createElement("div")
    circle.className = "vf-elem vf-circle"
    circle.dataset.type = "circle"
    circle.style.backgroundColor = editorState.fillColor

    Object.assign(circle.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: "0px",
      height: "0px"
    })

    stage.appendChild(circle)
  },

  onMouseMove(e, stage, x, y) {
    if (!editorState.isDrawing || !circle) return

    const dx = x - editorState.startX
    const dy = y - editorState.startY
    const r = Math.sqrt(dx * dx + dy * dy)

    circle.style.width = `${r * 2}px`
    circle.style.height = `${r * 2}px`
    circle.style.left = `${editorState.startX - r}px`
    circle.style.top = `${editorState.startY - r}px`
  },

  onMouseUp() {
    editorState.isDrawing = false
    circle = null
    saveState()
  }
}

export default circleTool
