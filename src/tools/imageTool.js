import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

export function setPendingImage(base64) {
  editorState.pendingImageURL = base64
  editorState.currentTool = "image"
}

const imageTool = {
  onMouseDown(e, stage, x, y) {
    if (!editorState.pendingImageURL) return

    const wrap = document.createElement("div")
    wrap.className = "vf-elem vf-image-wrap"
    wrap.dataset.type = "image"

    Object.assign(wrap.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: "220px",
      height: "180px"
    })

    const img = document.createElement("img")
    img.src = editorState.pendingImageURL
    img.draggable = false

    wrap.appendChild(img)
    stage.appendChild(wrap)

    editorState.pendingImageURL = null
    saveState()
  },
  onMouseMove() {},
  onMouseUp() {}
}

export default imageTool
