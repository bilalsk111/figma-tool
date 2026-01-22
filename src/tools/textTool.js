import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

const textTool = {
  onMouseDown(e, stage, x, y) {
    const el = document.createElement("div")
    el.className = "vf-elem vf-text"
    el.dataset.type = "text"
    el.contentEditable = "true"
    el.innerText = "Text"
    el.style.color = editorState.fillColor
    el.style.fontSize = "16px"

    Object.assign(el.style, {
      left: `${x}px`,
      top: `${y}px`
    })

    stage.appendChild(el)
    el.focus()
    saveState()
  },
  onMouseMove() {},
  onMouseUp() {}
}

export default textTool
