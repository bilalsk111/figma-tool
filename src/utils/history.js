import { editorState } from "../state/editorState"

const undoStack = []
const redoStack = []

export function saveState() {
  if (!editorState.stage) return
  undoStack.push(editorState.stage.innerHTML)
  redoStack.length = 0
}

export function undo() {
  if (!editorState.stage || !undoStack.length) return
  redoStack.push(editorState.stage.innerHTML)
  editorState.stage.innerHTML = undoStack.pop()
}

export function redo() {
  if (!editorState.stage || !redoStack.length) return
  undoStack.push(editorState.stage.innerHTML)
  editorState.stage.innerHTML = redoStack.pop()
}
