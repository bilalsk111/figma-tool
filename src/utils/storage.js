const STORAGE_KEY = "vectorflow-dom-v1"

/**
 * Saves the current editor state to localStorage
 * @param {HTMLElement} stage - The stage element containing all elements
 * @param {Object} editorState - The editor state object
 */
export function saveToStorage(stage, editorState) {
  const elements = [...stage.querySelectorAll(".vf-elem")]
  const pencilLayer = stage.querySelector("#pencilLayer")
  const pencilPaths = pencilLayer ? [...pencilLayer.querySelectorAll("path[data-type='pencil']")] : []

  const payload = {
    background: editorState.backgroundColor,
    zoom: editorState.zoom,
    panX: editorState.panX,
    panY: editorState.panY,

    elements: elements.map(element => ({
      type: element.dataset.type,

      // World space coordinates
      x: parseFloat(element.style.left) || 0,
      y: parseFloat(element.style.top) || 0,
      w: parseFloat(element.style.width) || element.offsetWidth,
      h: parseFloat(element.style.height) || element.offsetHeight,

      opacity: parseFloat(element.style.opacity || "1"),
      radius: parseFloat(element.style.borderRadius || "0"),
      rotate: editorState.rotation?.get(element) || 0,

      fill:
        element.dataset.type === "text"
          ? element.style.color
          : element.style.backgroundColor,

      text: element.dataset.type === "text" ? element.innerText : undefined,
      fontSize:
        element.dataset.type === "text"
          ? parseFloat(element.style.fontSize) || 16
          : undefined,

      src:
        element.dataset.type === "image"
          ? element.querySelector("img")?.src
          : undefined,
    })),

    pencilPaths: pencilPaths.map(path => ({
      d: path.getAttribute("d") || "",
      stroke: path.getAttribute("stroke") || editorState.fillColor,
      strokeWidth: path.getAttribute("stroke-width") || "2",
    })),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error("Failed to save to storage:", error)
  }
}

/**
 * Loads editor state from localStorage
 * @returns {Object|null} The loaded state or null if not found
 */
export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.error("Failed to load from storage:", error)
    return null
  }
}
