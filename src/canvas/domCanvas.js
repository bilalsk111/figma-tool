import { editorState } from "../state/editorState"
import { selectElem, clearSelection, toggleSelectElem, selectMultiple } from "../tools/selectTool"
import { updateOverlay, getOverlay } from "../utils/overlay"
import { startMarquee, updateMarquee, endMarquee, getMarqueeRect } from "../utils/marquee"
import { saveState } from "../utils/history"
import { applyViewport } from "../utils/viewport"
import { saveToStorage } from "../utils/storage"

import rectangleTool from "../tools/rectangleTool"
import circleTool from "../tools/circleTool"
import triangleTool from "../tools/triangleTool"
import textTool from "../tools/textTool"
import pencilTool from "../tools/pencilTool"
import imageTool from "../tools/imageTool"
import eraseTool from "../tools/eraseTool"

export const canvas = document.getElementById("canvas")

export const stage = document.createElement("div")
stage.id = "stage"
canvas.appendChild(stage)
editorState.stage = stage

const tools = {
  rectangle: rectangleTool,
  circle: circleTool,
  triangle: triangleTool,
  text: textTool,
  pencil: pencilTool,
  image: imageTool,
  erase: eraseTool,
}

export function initCanvas() {
  canvas.style.background = editorState.backgroundColor
  canvas.style.position = "relative"
  canvas.style.overflow = "hidden"

  Object.assign(stage.style, {
    position: "absolute",
    inset: "0",
    transformOrigin: "0 0",
    pointerEvents: "auto",
  })

  applyViewport(stage)
}

function getWorldPoint(e) {
  const r = canvas.getBoundingClientRect()
  const cx = e.clientX - r.left
  const cy = e.clientY - r.top

  return {
    cx,
    cy,
    x: (cx - editorState.panX) / editorState.zoom,
    y: (cy - editorState.panY) / editorState.zoom,
  }
}

function getBox(el) {
  return {
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top),
    w: parseFloat(el.style.width),
    h: parseFloat(el.style.height),
  }
}


/* Space = pan */
window.addEventListener("keydown", e => {
  if (e.code === "Space") editorState.spaceDown = true
})
window.addEventListener("keyup", e => {
  if (e.code === "Space") editorState.spaceDown = false
})

/* Mouse Down */
canvas.addEventListener("mousedown", e => {
  const p = getWorldPoint(e)
  editorState.startX = p.x
  editorState.startY = p.y

  if (editorState.spaceDown) {
    editorState.isPanning = true
    editorState.panStart = { cx: p.cx, cy: p.cy, panX: editorState.panX, panY: editorState.panY }
    return
  }

  const ov = getOverlay()

  if (e.target.classList.contains("vf-handle") && ov?.__target) {
    editorState.isResizing = true
    editorState.resizeHandle = e.target.dataset.pos
    editorState.selectedElem = ov.__target
    editorState.startBox = getBox(ov.__target)
    return
  }

  if (e.target.classList.contains("vf-rotate") && ov?.__target) {
    editorState.isRotating = true
    const b = getBox(ov.__target)
    editorState.selectedElem = ov.__target
    editorState.rotateCenter = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    editorState.rotateStartAngle = Math.atan2(p.y - editorState.rotateCenter.y, p.x - editorState.rotateCenter.x)
    return
  }

  if (editorState.currentTool === "select") {
    const clicked = e.target.closest(".vf-elem")

    if (clicked) {
      if (e.shiftKey) toggleSelectElem(clicked, stage, canvas)
      else selectElem(clicked, stage, canvas)

      editorState.isDragging = true
      const b = getBox(clicked)
      editorState.dragOffsetX = p.x - b.x
      editorState.dragOffsetY = p.y - b.y

      editorState.groupDragStart = new Map()
      editorState.selectedElems.forEach(el => {
        const bb = getBox(el)
        editorState.groupDragStart.set(el, { x: bb.x, y: bb.y })
      })
    } else {
      if (!e.shiftKey) clearSelection(stage)
      editorState.isMarquee = true
      startMarquee(canvas, p.cx, p.cy)
    }
    return
  }

  clearSelection(stage)
  tools[editorState.currentTool]?.onMouseDown?.(e, stage, p.x, p.y)
})

/* Mouse Move */
canvas.addEventListener("mousemove", e => {
  const p = getWorldPoint(e)

  if (editorState.isPanning) {
    editorState.panX = editorState.panStart.panX + (p.cx - editorState.panStart.cx)
    editorState.panY = editorState.panStart.panY + (p.cy - editorState.panStart.cy)
    applyViewport(stage)
    return
  }

  if (editorState.isMarquee) {
    updateMarquee(p.cx, p.cy)
    return
  }

  if (editorState.isResizing && editorState.selectedElem) {
    const el = editorState.selectedElem

    if (el.dataset.type === "text") {
      const dy = p.y - editorState.startY
      el.style.fontSize = `${Math.max(8, (parseFloat(el.style.fontSize) || 16) + dy * 0.2)}px`
      editorState.startY = p.y
      updateOverlay(el, canvas)
      return
    }

    const b = editorState.startBox
    const dx = p.x - editorState.startX
    const dy = p.y - editorState.startY

    let { x, y, w, h } = b

    if (editorState.resizeHandle === "br") { w += dx; h += dy }
    if (editorState.resizeHandle === "tr") { w += dx; h -= dy; y += dy }
    if (editorState.resizeHandle === "bl") { w -= dx; h += dy; x += dx }
    if (editorState.resizeHandle === "tl") { w -= dx; h -= dy; x += dx; y += dy }

    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.width = `${Math.max(10, w)}px`
    el.style.height = `${Math.max(10, h)}px`

    updateOverlay(el, canvas)
    return
  }

  if (editorState.isRotating && editorState.selectedElem) {
    const el = editorState.selectedElem
    const angle = Math.atan2(p.y - editorState.rotateCenter.y, p.x - editorState.rotateCenter.x)
    const deg = ((angle - editorState.rotateStartAngle) * 180) / Math.PI
    const final = (editorState.rotation.get(el) || 0) + deg

    editorState.rotation.set(el, final)
    el.style.transform = `rotate(${final}deg)`
    updateOverlay(el, canvas)
    return
  }

  if (editorState.isDragging && editorState.selectedElems.size) {
    const base = editorState.selectedElem
    const baseStart = editorState.groupDragStart.get(base)
    if (!baseStart) return

    const nx = p.x - editorState.dragOffsetX
    const ny = p.y - editorState.dragOffsetY
    const dx = nx - baseStart.x
    const dy = ny - baseStart.y

    editorState.selectedElems.forEach(el => {
      const s = editorState.groupDragStart.get(el)
      if (!s) return
      el.style.left = `${s.x + dx}px`
      el.style.top = `${s.y + dy}px`
    })

    updateOverlay(base, canvas)
    return
  }

  tools[editorState.currentTool]?.onMouseMove?.(e, stage, p.x, p.y)
})

/* Mouse Up */
canvas.addEventListener("mouseup", () => {
  const hadInteraction = editorState.isDragging || editorState.isResizing || editorState.isRotating || editorState.isDrawing
  
  if (hadInteraction) {
    saveState()
    // Save to localStorage for persistence
    saveToStorage(stage, editorState)
  }

  editorState.isDrawing = false
  editorState.isDragging = false
  editorState.isResizing = false
  editorState.isRotating = false
  editorState.isPanning = false

  if (editorState.isMarquee) {
    const rect = getMarqueeRect()
    endMarquee()
    editorState.isMarquee = false

    if (rect) {
      const x1 = (rect.x - editorState.panX) / editorState.zoom
      const y1 = (rect.y - editorState.panY) / editorState.zoom
      const x2 = (rect.x + rect.w - editorState.panX) / editorState.zoom
      const y2 = (rect.y + rect.h - editorState.panY) / editorState.zoom

      const selected = [...stage.querySelectorAll(".vf-elem")].filter(el => {
        const b = getBox(el)
        return b.x >= Math.min(x1, x2) &&
               b.y >= Math.min(y1, y2) &&
               b.x + b.w <= Math.max(x1, x2) &&
               b.y + b.h <= Math.max(y1, y2)
      })

      if (selected.length) selectMultiple(selected, stage, canvas)
    }
  }

  // Call tool's onMouseUp and save after
  tools[editorState.currentTool]?.onMouseUp?.()
  
  // Ensure persistence after any tool operation
  if (hadInteraction || editorState.isDrawing) {
    saveToStorage(stage, editorState)
  }
})

/* Zoom */
canvas.addEventListener("wheel", e => {
  if (!e.ctrlKey) return
  e.preventDefault()

  const r = canvas.getBoundingClientRect()
  const cx = e.clientX - r.left
  const cy = e.clientY - r.top

  const wx = (cx - editorState.panX) / editorState.zoom
  const wy = (cy - editorState.panY) / editorState.zoom

  const delta = e.deltaY < 0 ? 1.1 : 0.9
  editorState.zoom = Math.min(3, Math.max(0.3, editorState.zoom * delta))

  editorState.panX = cx - wx * editorState.zoom
  editorState.panY = cy - wy * editorState.zoom

  applyViewport(stage)
}, { passive: false })
