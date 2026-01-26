import { editorState } from "../state/editorState"

export function applyViewport(stage) {
  stage.style.transform =
    `translate(${editorState.panX}px, ${editorState.panY}px) scale(${editorState.zoom})`
  stage.style.transformOrigin = "0 0"
}
