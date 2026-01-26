import { editorState } from "../state/editorState"

/**
 * Builds a DOM element from saved data
 * @param {Object} data - The saved element data
 * @returns {HTMLElement} The created element
 */
export function buildFromData(data) {
  const element = document.createElement("div")
  element.className = "vf-elem"
  element.dataset.type = data.type

  // Set position and size (world space coordinates)
  element.style.left = `${data.x}px`
  element.style.top = `${data.y}px`
  element.style.width = `${data.w}px`
  element.style.height = `${data.h}px`
  element.style.opacity = data.opacity ?? 1
  element.style.borderRadius = `${data.radius ?? 0}px`

  // Apply rotation if present
  if (data.rotate) {
    element.style.transform = `rotate(${data.rotate}deg)`
    editorState.rotation.set(element, data.rotate)
  }

  // Configure based on element type
  if (data.type === "rectangle") {
    element.classList.add("vf-rect")
    element.style.backgroundColor = data.fill || "#d9d9d9"
  }

  if (data.type === "circle") {
    element.classList.add("vf-circle")
    element.style.backgroundColor = data.fill || "#d9d9d9"
    element.style.borderRadius = "50%"
  }

  if (data.type === "triangle") {
    element.classList.add("vf-triangle")
    element.style.backgroundColor = data.fill || "#d9d9d9"
  }

  if (data.type === "text") {
    element.classList.add("vf-text")
    element.contentEditable = "true"
    element.style.color = data.fill || "#d9d9d9"
    element.style.fontSize = `${data.fontSize || 16}px`
    element.innerText = data.text || "Text"
  }

  if (data.type === "image") {
    element.classList.add("vf-image-wrap")
    const img = document.createElement("img")
    img.src = data.src || ""
    img.draggable = false
    element.appendChild(img)
  }

  return element
}

/**
 * Restores pencil paths from saved data
 * @param {HTMLElement} stage - The stage element
 * @param {Array} pencilPaths - Array of saved path data
 */
export function restorePencilPaths(stage, pencilPaths) {
  if (!pencilPaths || pencilPaths.length === 0) return

  let svgLayer = stage.querySelector("#pencilLayer")
  if (!svgLayer) {
    svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svgLayer.setAttribute("id", "pencilLayer")
    svgLayer.style.position = "absolute"
    svgLayer.style.left = "0"
    svgLayer.style.top = "0"
    svgLayer.style.width = "100%"
    svgLayer.style.height = "100%"
    svgLayer.style.pointerEvents = "none"
    svgLayer.style.overflow = "visible"
    stage.appendChild(svgLayer)
  }

  pencilPaths.forEach(pathData => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", pathData.d || "")
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", pathData.stroke || "#D9D9D9")
    path.setAttribute("stroke-width", pathData.strokeWidth || "2")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")
    path.dataset.type = "pencil"
    path.dataset.stroke = pathData.stroke || "#D9D9D9"
    svgLayer.appendChild(path)
  })
}
