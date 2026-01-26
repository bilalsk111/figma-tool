import { editorState } from "../state/editorState"
import { saveState } from "../utils/history"

let svgLayer = null
let currentPath = null
let pathPoints = []
let previousPoint = null

/**
 * Ensures the SVG layer for pencil drawings exists
 * @param {HTMLElement} stage - The stage element
 * @returns {SVGElement} The SVG layer
 */
function ensurePencilLayer(stage) {
  if (svgLayer && stage.contains(svgLayer)) return svgLayer

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
  return svgLayer
}

/**
 * Converts screen coordinates to world coordinates
 * @param {number} x - Screen X coordinate
 * @param {number} y - Screen Y coordinate
 * @returns {{x: number, y: number}} World coordinates
 */
function toWorldCoordinates(x, y) {
  const zoom = editorState.zoom || 1
  return {
    x: x / zoom,
    y: y / zoom,
  }
}

/**
 * Creates a smooth path using quadratic bezier curves
 * @param {Array} points - Array of {x, y} points
 * @returns {string} SVG path data
 */
function createSmoothPath(points) {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let pathData = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const current = points[i]
    const previous = points[i - 1]
    
    if (i === 1) {
      // First segment: use line
      pathData += ` L ${current.x} ${current.y}`
    } else {
      // Use quadratic bezier for smooth curves
      const midX = (previous.x + current.x) / 2
      const midY = (previous.y + current.y) / 2
      pathData += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`
    }
  }

  // Add final point
  const last = points[points.length - 1]
  const secondLast = points[points.length - 2]
  if (secondLast) {
    pathData += ` Q ${secondLast.x} ${secondLast.y} ${last.x} ${last.y}`
  }

  return pathData
}

const pencilTool = {
  onMouseDown(e, stage, worldX, worldY) {
    editorState.isDrawing = true

    const layer = ensurePencilLayer(stage)
    const point = { x: worldX, y: worldY }

    pathPoints = [point]
    previousPoint = point

    currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    currentPath.setAttribute("d", `M ${point.x} ${point.y}`)
    currentPath.setAttribute("fill", "none")
    currentPath.setAttribute("stroke", editorState.fillColor)
    currentPath.setAttribute("stroke-width", "2")
    currentPath.setAttribute("stroke-linecap", "round")
    currentPath.setAttribute("stroke-linejoin", "round")
    currentPath.dataset.type = "pencil"
    currentPath.dataset.stroke = editorState.fillColor

    layer.appendChild(currentPath)
  },

  onMouseMove(e, stage, worldX, worldY) {
    if (!editorState.isDrawing || !currentPath) return

    const point = { x: worldX, y: worldY }
    
    // Only add point if it's far enough from the previous point (reduces noise)
    if (previousPoint) {
      const dx = point.x - previousPoint.x
      const dy = point.y - previousPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 0.5) return // Skip points too close together
    }

    pathPoints.push(point)
    previousPoint = point

    // Update path with smooth curve
    if (pathPoints.length >= 2) {
      const pathData = createSmoothPath(pathPoints)
      currentPath.setAttribute("d", pathData)
    }
  },

  onMouseUp() {
    if (!currentPath) return

    // Finalize the path
    if (pathPoints.length > 1) {
      const pathData = createSmoothPath(pathPoints)
      currentPath.setAttribute("d", pathData)
    }

    editorState.isDrawing = false
    currentPath = null
    pathPoints = []
    previousPoint = null
    saveState()
  },
}

export default pencilTool
