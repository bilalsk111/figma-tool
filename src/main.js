import "./style.css"
import { initCanvas, canvas, stage } from "./canvas/domCanvas"
import { editorState } from "./state/editorState"
import { undo, redo, saveState } from "./utils/history"
import { updateOverlay } from "./utils/overlay"
import { clearSelection, selectElem } from "./tools/selectTool"
import { setPendingImage } from "./tools/imageTool"
import { saveToStorage, loadFromStorage } from "./utils/storage"
import { exportStageAsSVG } from "./utils/exportSVG"

initCanvas()
saveState()

/* ===================== TOOLBAR ===================== */
const fileInput = document.createElement("input")
fileInput.type = "file"
fileInput.accept = "image/*"
fileInput.style.display = "none"
document.body.appendChild(fileInput)

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0]
  if (!file) return

  // ✅ base64 so reload works
  const reader = new FileReader()
  reader.onload = () => setPendingImage(reader.result)
  reader.readAsDataURL(file)
  fileInput.value = ""
})

document.querySelectorAll(".toolbar-btn[data-tool]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toolbar-btn[data-tool]").forEach(b => b.classList.remove("active"))
    btn.classList.add("active")

    const tool = btn.dataset.tool
    if (tool === "image") {
      fileInput.click()
      return
    }
    editorState.currentTool = tool
  })
})

/* ===================== EXPORT ===================== */
document.getElementById("exportBtn").addEventListener("click", () => {
  exportStageAsSVG(canvas)
})

/* ===================== UNDO REDO ===================== */
document.getElementById("undoBtn").addEventListener("click", () => {
  undo()
  clearSelection(stage)
  syncLayers()
  syncProperties()
  autoSave()
})

document.getElementById("redoBtn").addEventListener("click", () => {
  redo()
  clearSelection(stage)
  syncLayers()
  syncProperties()
  autoSave()
})

window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "z") {
    undo()
    clearSelection(stage)
    syncLayers()
    syncProperties()
    autoSave()
  }
  if (e.ctrlKey && e.key === "y") {
    redo()
    clearSelection(stage)
    syncLayers()
    syncProperties()
    autoSave()
  }
  if (e.key === "Delete") deleteSelected()
})

/* ===================== AUTO SAVE ===================== */
function autoSave() {
  saveToStorage(stage, editorState)
}

/* ===================== PROPERTIES + COLORS ===================== */
const bgPicker = document.getElementById("bgColorPicker")
const bgPreview = document.getElementById("bgPreview")
const bgValue = document.getElementById("bgValue")

bgPicker.addEventListener("input", e => {
  editorState.backgroundColor = e.target.value
  canvas.style.background = editorState.backgroundColor
  bgPreview.style.background = editorState.backgroundColor
  bgValue.value = editorState.backgroundColor
  autoSave()
})

const fillPicker = document.getElementById("fillColorPicker")
const fillPreview = document.getElementById("fillPreview")
const fillValue = document.getElementById("fillValue")

fillPicker.addEventListener("input", e => {
  editorState.fillColor = e.target.value
  fillPreview.style.background = editorState.fillColor
  fillValue.value = editorState.fillColor

  const el = editorState.selectedElem
  if (!el) return

  if (["rectangle", "circle", "triangle"].includes(el.dataset.type)) {
    el.style.backgroundColor = editorState.fillColor
  }
  if (el.dataset.type === "text") {
    el.style.color = editorState.fillColor
  }

  updateOverlay(el, canvas)
  autoSave()
})

/* ===================== DELETE ===================== */
document.getElementById("deleteBtn").addEventListener("click", deleteSelected)

function deleteSelected() {
  const el = editorState.selectedElem
  if (!el) return
  el.remove()
  clearSelection(stage)
  syncLayers()
  syncProperties()
  autoSave()
}

/* ===================== PROPERTIES ===================== */
const propW = document.getElementById("propW")
const propH = document.getElementById("propH")
const propX = document.getElementById("propX")
const propY = document.getElementById("propY")
const propOpacity = document.getElementById("propOpacity")
const propRadius = document.getElementById("propRadius")
const propText = document.getElementById("propText")
const propFontSize = document.getElementById("propFontSize")

function syncProperties() {
  const el = editorState.selectedElem
  if (!el) {
    ;[propW, propH, propX, propY, propOpacity, propRadius, propText].forEach(i => i.value = "")
    propFontSize.value = "16"
    return
  }

  propW.value = parseFloat(el.style.width) || el.offsetWidth
  propH.value = parseFloat(el.style.height) || el.offsetHeight
  propX.value = parseFloat(el.style.left) || 0
  propY.value = parseFloat(el.style.top) || 0

  const op = parseFloat(el.style.opacity || "1")
  propOpacity.value = Math.round(op * 100)

  propRadius.value = parseFloat(el.style.borderRadius) || 0

  if (el.dataset.type === "text") {
    propText.value = el.innerText || ""
    propFontSize.value = parseFloat(el.style.fontSize) || 16
  } else {
    propText.value = ""
    propFontSize.value = "16"
  }
}

function applyProps() {
  const el = editorState.selectedElem
  if (!el) return

  const w = parseFloat(propW.value)
  const h = parseFloat(propH.value)
  const x = parseFloat(propX.value)
  const y = parseFloat(propY.value)

  if (!isNaN(w)) el.style.width = `${Math.max(10, w)}px`
  if (!isNaN(h)) el.style.height = `${Math.max(10, h)}px`
  if (!isNaN(x)) el.style.left = `${x}px`
  if (!isNaN(y)) el.style.top = `${y}px`

  const op = Math.max(0, Math.min(100, parseFloat(propOpacity.value) || 100))
  el.style.opacity = `${op / 100}`

  const rad = Math.max(0, parseFloat(propRadius.value) || 0)
  el.style.borderRadius = `${rad}px`

  if (el.dataset.type === "text") {
    el.innerText = propText.value
    const fs = Math.max(8, parseFloat(propFontSize.value) || 16)
    el.style.fontSize = `${fs}px`
  }

  updateOverlay(el, canvas)
  autoSave()
}

;[propW, propH, propX, propY, propOpacity, propRadius, propText, propFontSize].forEach(inp => {
  inp.addEventListener("input", applyProps)
})

/* ===================== LAYERS ===================== */
const layersList = document.getElementById("layersList")

function syncLayers() {
  const elems = [...stage.querySelectorAll(".vf-elem")]
  layersList.innerHTML = ""

  elems.forEach((el, idx) => {
    const li = document.createElement("li")
    li.className = "layer-item"
    if (el === editorState.selectedElem) li.classList.add("active")

    let label = `${el.dataset.type} ${idx + 1}`
    li.textContent = label

    li.onclick = () => {
      selectElem(el, stage, canvas)
      syncLayers()
      syncProperties()
    }

    layersList.appendChild(li)
  })
}

canvas.addEventListener("mousedown", () => {
  setTimeout(() => {
    syncLayers()
    syncProperties()
    autoSave()
  }, 0)
})

/* ===================== LOAD FROM STORAGE ===================== */
function buildFromData(item) {
  const el = document.createElement("div")
  el.classList.add("vf-elem")
  el.dataset.type = item.type

  el.style.left = `${item.x}px`
  el.style.top = `${item.y}px`
  el.style.width = `${item.w}px`
  el.style.height = `${item.h}px`
  el.style.opacity = `${item.opacity ?? 1}`
  el.style.borderRadius = `${item.radius ?? 0}px`

  if (item.rotate) {
    el.style.transform = `rotate(${item.rotate}deg)`
    editorState.rotation.set(el, item.rotate)
  }

  if (item.type === "rectangle") {
    el.classList.add("vf-rect")
    el.style.backgroundColor = item.fill || "#D9D9D9"
  }
  if (item.type === "circle") {
    el.classList.add("vf-circle")
    el.style.backgroundColor = item.fill || "#D9D9D9"
  }
  if (item.type === "triangle") {
    el.classList.add("vf-triangle")
    el.style.backgroundColor = item.fill || "#D9D9D9"
  }
  if (item.type === "text") {
    el.classList.add("vf-text")
    el.style.color = item.fill || "#D9D9D9"
    el.style.fontSize = `${item.fontSize || 16}px`
    el.contentEditable = "true"
    el.innerText = item.text || "Text"
  }
  if (item.type === "image") {
    el.classList.add("vf-image-wrap")
    const img = document.createElement("img")
    img.src = item.src || ""
    el.appendChild(img)
  }

  return el
}

const loaded = loadFromStorage()
if (loaded) {
  stage.innerHTML = ""

  editorState.backgroundColor = loaded.background || editorState.backgroundColor
  canvas.style.background = editorState.backgroundColor

  bgPreview.style.background = editorState.backgroundColor
  bgValue.value = editorState.backgroundColor
  bgPicker.value = editorState.backgroundColor

  loaded.elements?.forEach(item => {
    stage.appendChild(buildFromData(item))
  })

  if (loaded.pencil?.length) {
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svgLayer.setAttribute("id", "pencilLayer")
    svgLayer.style.position = "absolute"
    svgLayer.style.inset = "0"
    svgLayer.style.pointerEvents = "none"

    loaded.pencil.forEach(p => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
      path.setAttribute("d", p.d)
      path.setAttribute("fill", "none")
      path.setAttribute("stroke", p.stroke || "#fff")
      path.setAttribute("stroke-width", p.strokeWidth || "2")
      svgLayer.appendChild(path)
    })

    stage.appendChild(svgLayer)
  }

  saveState()
}

syncLayers()
syncProperties()
autoSave()
