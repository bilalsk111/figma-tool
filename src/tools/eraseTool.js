import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"
import { saveToStorage } from "../utils/storage"

let eraseRadius = 20 // Erase radius in pixels
let erasedPaths = false // Track if any paths were erased

/**
 * Gets the pencil layer from stage
 * @param {HTMLElement} stage - The stage element
 * @returns {SVGElement|null} The pencil layer or null
 */
function getPencilLayer(stage) {
  return stage.querySelector("#pencilLayer")
}

/**
 * Calculates distance between two points
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number} Distance
 */
function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Checks if a point is near a path segment
 * @param {SVGPathElement} path - The SVG path element
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} radius - Erase radius
 * @returns {boolean} True if point is near path
 */
function isPointNearPath(path, x, y, radius) {
  try {
    const pathLength = path.getTotalLength()
    if (pathLength === 0) return false
    
    const steps = Math.max(10, Math.floor(pathLength / 5))
    
    for (let i = 0; i <= steps; i++) {
      const point = path.getPointAtLength((pathLength * i) / steps)
      const distance = getDistance(x, y, point.x, point.y)
      if (distance <= radius) {
        return true
      }
    }
  } catch (error) {
    // If path is invalid, check if point is near bounding box
    const bbox = path.getBBox()
    if (bbox) {
      return (
        x >= bbox.x - radius &&
        x <= bbox.x + bbox.width + radius &&
        y >= bbox.y - radius &&
        y <= bbox.y + bbox.height + radius
      )
    }
  }
  return false
}

/**
 * Erases pencil paths near the given point
 * @param {HTMLElement} stage - The stage element
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 */
function erasePathsAtPoint(stage, worldX, worldY) {
  const pencilLayer = getPencilLayer(stage)
  if (!pencilLayer) return

  const paths = [...pencilLayer.querySelectorAll("path[data-type='pencil']")]
  const zoom = editorState.zoom || 1
  const adjustedRadius = eraseRadius / zoom

  paths.forEach(path => {
    if (isPointNearPath(path, worldX, worldY, adjustedRadius)) {
      path.remove()
      erasedPaths = true
    }
  })
}

const eraseTool = {
  onMouseDown(e, stage, worldX, worldY) {
    editorState.isDrawing = true
    erasedPaths = false
    erasePathsAtPoint(stage, worldX, worldY)
  },

  onMouseMove(e, stage, worldX, worldY) {
    if (!editorState.isDrawing) return
    erasePathsAtPoint(stage, worldX, worldY)
  },

  onMouseUp() {
    if (editorState.isDrawing) {
      editorState.isDrawing = false
      if (erasedPaths) {
        saveState()
        // Save to localStorage for persistence
        if (editorState.stage) {
          saveToStorage(editorState.stage, editorState)
        }
      }
      erasedPaths = false
    }
  },
}

export default eraseTool
