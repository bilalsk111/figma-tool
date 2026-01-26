let overlayElement = null

/**
 * Hides and removes the selection overlay
 */
export function hideOverlay() {
  if (overlayElement) {
    overlayElement.remove()
    overlayElement = null
  }
}

/**
 * Gets the current overlay element
 * @returns {HTMLElement|null} The overlay element or null
 */
export function getOverlay() {
  return overlayElement
}

/**
 * Shows selection overlay with handles for the target element
 * @param {HTMLElement} target - The element to show overlay for
 * @param {HTMLElement} canvas - The canvas element
 */
export function showOverlay(target, canvas) {
  hideOverlay()
  if (!target || !canvas) return

  const targetRect = target.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()

  overlayElement = document.createElement("div")
  overlayElement.id = "vf-overlay"
  overlayElement.__target = target

  // Position overlay relative to canvas
  overlayElement.style.left = `${targetRect.left - canvasRect.left}px`
  overlayElement.style.top = `${targetRect.top - canvasRect.top}px`
  overlayElement.style.width = `${targetRect.width}px`
  overlayElement.style.height = `${targetRect.height}px`

  // Create resize handles at corners
  const handlePositions = [
    ["tl", 0, 0, "nw-resize"],
    ["tr", targetRect.width, 0, "ne-resize"],
    ["bl", 0, targetRect.height, "sw-resize"],
    ["br", targetRect.width, targetRect.height, "se-resize"]
  ]

  handlePositions.forEach(([position, x, y, cursor]) => {
    const handle = document.createElement("div")
    handle.className = "vf-handle"
    handle.dataset.pos = position
    handle.style.left = `${x - 5}px`
    handle.style.top = `${y - 5}px`
    handle.style.cursor = cursor
    overlayElement.appendChild(handle)
  })

  // Create rotation handle above the element
  const rotationHandle = document.createElement("div")
  rotationHandle.className = "vf-rotate"
  rotationHandle.dataset.rotate = "true"
  rotationHandle.style.left = `${targetRect.width / 2 - 6}px`
  rotationHandle.style.top = `-24px`
  rotationHandle.style.cursor = "grab"
  overlayElement.appendChild(rotationHandle)

  canvas.appendChild(overlayElement)
}

/**
 * Updates the overlay position and size for the target element
 * @param {HTMLElement} target - The element to update overlay for
 * @param {HTMLElement} canvas - The canvas element
 */
export function updateOverlay(target, canvas) {
  showOverlay(target, canvas)
}
