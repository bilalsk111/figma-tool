import "./style.css"
import { initCanvas, canvas, stage } from "./canvas/domCanvas"
import { editorState } from "./state/editorState"
import { undo, redo, saveState } from "./utils/history"
import { updateOverlay } from "./utils/overlay"
import { clearSelection, selectElem } from "./tools/selectTool"
import { setPendingImage } from "./tools/imageTool"
import { saveToStorage, loadFromStorage } from "./utils/storage"
import { exportStageAsSVG } from "./utils/exportSVG"

/* ===================== INIT ===================== */
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
document.getElementById("exportBtn")?.addEventListener("click", () => {
  exportStageAsSVG(canvas, stage, editorState.backgroundColor)
})

/* ===================== UNDO / REDO ===================== */
function afterHistory() {
  clearSelection(stage)
  syncLayers()
  syncProperties()
  autoSave()
}

document.getElementById("undoBtn")?.addEventListener("click", () => {
  undo()
  afterHistory()
})

document.getElementById("redoBtn")?.addEventListener("click", () => {
  redo()
  afterHistory()
})

window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault()
    undo()
    afterHistory()
  }
  if (e.ctrlKey && e.key === "y") {
    e.preventDefault()
    redo()
    afterHistory()
  }
  if (e.key === "Delete") deleteSelected()
})

/* ===================== AUTO SAVE ===================== */
function autoSave() {
  saveToStorage(stage, editorState)
}

/* ===================== BACKGROUND ===================== */
const bgPicker = document.getElementById("bgColorPicker")
const bgPreview = document.getElementById("bgPreview")
const bgValue = document.getElementById("bgValue")

bgPicker?.addEventListener("input", e => {
  editorState.backgroundColor = e.target.value
  canvas.style.background = editorState.backgroundColor
  bgPreview.style.background = editorState.backgroundColor
  bgValue.value = editorState.backgroundColor
  autoSave()
})

/* ===================== FILL COLOR ===================== */
const fillPicker = document.getElementById("fillColorPicker")
const fillPreview = document.getElementById("fillPreview")
const fillValue = document.getElementById("fillValue")

fillPicker?.addEventListener("input", e => {
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
document.getElementById("deleteBtn")?.addEventListener("click", deleteSelected)

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
  propOpacity.value = Math.round((parseFloat(el.style.opacity) || 1) * 100)
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

  if (!isNaN(propW.value)) el.style.width = `${Math.max(10, propW.value)}px`
  if (!isNaN(propH.value)) el.style.height = `${Math.max(10, propH.value)}px`
  if (!isNaN(propX.value)) el.style.left = `${propX.value}px`
  if (!isNaN(propY.value)) el.style.top = `${propY.value}px`

  el.style.opacity = `${Math.max(0, Math.min(100, propOpacity.value)) / 100}`
  el.style.borderRadius = `${Math.max(0, propRadius.value)}px`

  if (el.dataset.type === "text") {
    el.innerText = propText.value
    el.style.fontSize = `${Math.max(8, propFontSize.value)}px`
  }

  updateOverlay(el, canvas)
  autoSave()
}

;[propW, propH, propX, propY, propOpacity, propRadius, propText, propFontSize]
  .forEach(inp => inp?.addEventListener("input", applyProps))

/* ===================== LAYERS ===================== */
const layersList = document.getElementById("layersList")

const layerIcons = {
  rectangle: "ri-checkbox-blank-line",
  circle: "ri-circle-line",
  triangle: "ri-play-line",
  pencil: "ri-pencil-line",
  path: "ri-pencil-line",
  text: "ri-text",
  image: "ri-image-line",
}

function syncLayers() {
  if (!layersList) return

  const elems = [...stage.querySelectorAll(".vf-elem")]
  layersList.innerHTML = ""

  elems.forEach(el => {
    const li = document.createElement("li")
    li.className = "layer-item"
    if (el === editorState.selectedElem) li.classList.add("active")

    const type = el.dataset.type || "shape"
    const iconClass = layerIcons[type] || "ri-shapes-line"

    li.innerHTML = `
      <i class="${iconClass} layer-icon"></i>
      <span class="layer-label">${type}</span>
    `

    li.onclick = () => {
      selectElem(el, stage, canvas)
      syncLayers()
      syncProperties()
    }

    layersList.appendChild(li)
  })
}

/* ===================== CANVAS CLICK SYNC ===================== */
canvas.addEventListener("mousedown", () => {
  requestAnimationFrame(() => {
    syncLayers()
    syncProperties()
    autoSave()
  })
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
    el.style.backgroundColor = item.fill || "#d9d9d9"
  }

  if (item.type === "circle") {
    el.classList.add("vf-circle")
    el.style.backgroundColor = item.fill || "#d9d9d9"
    el.style.borderRadius = "50%"
  }

  if (item.type === "triangle") {
    el.classList.add("vf-triangle")
    el.style.backgroundColor = item.fill || "#d9d9d9"
  }

  if (item.type === "text") {
    el.classList.add("vf-text")
    el.style.color = item.fill || "#d9d9d9"
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

  saveState()
}

/* ===================== FINAL SYNC ===================== */
syncLayers()
syncProperties()
autoSave()
