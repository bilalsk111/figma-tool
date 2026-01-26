import { editorState } from "../state/editorState"
import { buildFromData } from "./buildFromData"

const MAX = 50
let undoStack = []
let redoStack = []

export function saveState() {
  const snapshot = [...editorState.stage.querySelectorAll(".vf-elem")].map(el => {
    const rect = el.getBoundingClientRect()
    const stageRect = editorState.stage.getBoundingClientRect()

    return {
      type: el.dataset.type,

      // world-space (zoom safe)
      x: rect.left - stageRect.left,
      y: rect.top - stageRect.top,
      w: rect.width,
      h: rect.height,

      rotate: editorState.rotation?.get(el) || 0,
      opacity: parseFloat(el.style.opacity || "1"),
      radius: parseFloat(el.style.borderRadius || "0"),

      fill:
        el.dataset.type === "text"
          ? el.style.color
          : el.style.backgroundColor,

      text: el.dataset.type === "text" ? el.innerText : undefined,
      fontSize:
        el.dataset.type === "text"
          ? parseFloat(el.style.fontSize || 16)
          : undefined,

      src:
        el.dataset.type === "image"
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
