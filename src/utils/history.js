import { editorState } from "../state/editorState"
import { buildFromData } from "./buildFromData"

const MAX = 50
let undoStack = []
let redoStack = []

export function saveState() {
  const zoom = editorState.zoom || 1

  const snapshot = [...editorState.stage.querySelectorAll(".vf-elem")].map(el => {
    const type = el.dataset.type

    return {
      type,

      // world coordinates (zoom-safe)
      x: (parseFloat(el.style.left) || 0) / zoom,
      y: (parseFloat(el.style.top) || 0) / zoom,
      w: (parseFloat(el.style.width) || el.offsetWidth) / zoom,
      h: (parseFloat(el.style.height) || el.offsetHeight) / zoom,

      rotate: editorState.rotation?.get(el) || 0,
      opacity: parseFloat(el.style.opacity || "1"),
      radius: parseFloat(el.style.borderRadius || "0"),

      fill:
        type === "text"
          ? el.style.color
          : el.style.backgroundColor,

      text: type === "text" ? el.innerText : undefined,
      fontSize:
        type === "text"
          ? parseFloat(el.style.fontSize || 16)
          : undefined,

      src:
        type === "image"
          ? el.querySelector("img")?.src
          : undefined,
    }
  })

  undoStack.push(snapshot)
  if (undoStack.length > MAX) undoStack.shift()
  redoStack.length = 0
}

export function undo() {
  if (undoStack.length <= 1) return
  redoStack.push(undoStack.pop())
  restore(undoStack.at(-1))
}

export function redo() {
  if (!redoStack.length) return
  const state = redoStack.pop()
  undoStack.push(state)
  restore(state)
}

function restore(data = []) {
  const stage = editorState.stage

  stage.innerHTML = ""
  editorState.rotation.clear()

  data.forEach(item => {
    const el = buildFromData(item)
    stage.appendChild(el)
  })
}
