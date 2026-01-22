import { editorState } from "../state/editorState"
import { showOverlay, hideOverlay } from "../utils/overlay"

function clearClasses(stage) {
  stage.querySelectorAll(".vf-elem").forEach(el => {
    el.classList.remove("vf-selected")
    el.classList.remove("vf-multi-selected")
  })
}

export function selectElem(el, stage, canvas) {
  if (!el) return
  clearClasses(stage)

  editorState.selectedElems = new Set([el])
  editorState.selectedElem = el

  el.classList.add("vf-selected")
  showOverlay(el, canvas)
}

export function toggleSelectElem(el, stage, canvas) {
  if (!el) return

  if (!editorState.selectedElems.has(el)) {
    editorState.selectedElems.add(el)
    el.classList.add("vf-multi-selected")
    editorState.selectedElem = el
    el.classList.add("vf-selected")
    showOverlay(el, canvas)
    return
  }

  editorState.selectedElems.delete(el)
  el.classList.remove("vf-selected")
  el.classList.remove("vf-multi-selected")

  const next = [...editorState.selectedElems][0] || null
  editorState.selectedElem = next

  if (next) {
    next.classList.add("vf-selected")
    showOverlay(next, canvas)
  } else {
    hideOverlay()
  }
}

export function selectMultiple(list, stage, canvas) {
  clearClasses(stage)

  editorState.selectedElems = new Set(list)
  editorState.selectedElem = list[list.length - 1] || null

  list.forEach(el => el.classList.add("vf-multi-selected"))

  if (editorState.selectedElem) {
    editorState.selectedElem.classList.add("vf-selected")
    showOverlay(editorState.selectedElem, canvas)
  } else hideOverlay()
}

export function clearSelection(stage) {
  clearClasses(stage)
  editorState.selectedElems = new Set()
  editorState.selectedElem = null
  hideOverlay()
}
