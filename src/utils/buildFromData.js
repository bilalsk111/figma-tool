import { editorState } from "../state/editorState"

export function buildFromData(d) {
  const el = document.createElement("div")
  el.className = "vf-elem"
  el.dataset.type = d.type
  el.style.position = "absolute"

  el.style.left = d.x + "px"
  el.style.top = d.y + "px"
  el.style.width = d.w + "px"
  el.style.height = d.h + "px"

  if (d.rotate) {
    el.style.transform = `rotate(${d.rotate}deg)`
    editorState.rotation.set(el, d.rotate)
  }

  if (d.type === "rectangle") {
    el.classList.add("vf-rect")
  }

  if (d.type === "circle") {
    el.classList.add("vf-circle")
    el.style.borderRadius = "50%"
  }

  if (d.type === "triangle") {
    el.classList.add("vf-triangle")
  }

  if (d.type === "text") {
    el.classList.add("vf-text")
    el.contentEditable = true
    el.textContent = d.text || "Text"
  }

  if (d.type === "image") {
    el.classList.add("vf-image-wrap")
    const img = document.createElement("img")
    img.src = d.src
    img.draggable = false
    el.appendChild(img)
  }

  return el
}
