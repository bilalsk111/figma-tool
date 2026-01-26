import "./style.css"
import { initCanvas, canvas, stage } from "./canvas/domCanvas"
import { editorState } from "./state/editorState"
import { undo, redo, saveState } from "./utils/history"
import { updateOverlay } from "./utils/overlay"
import { clearSelection, selectElem } from "./tools/selectTool"
import { setPendingImage } from "./tools/imageTool"
import { saveToStorage, loadFromStorage } from "./utils/storage"
import { exportStageAsSVG } from "./utils/exportSVG"
import { applyViewport } from "./utils/viewport"
import { buildFromData, restorePencilPaths } from "./utils/buildFromData"

/* ===================== INIT ===================== */
initCanvas()
// Don't save empty state on init - wait for loadEditorState to complete first

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

/**
 * Updates the active state of toolbar buttons based on current tool
 */
function updateToolbarActiveState() {
  const toolbarButtons = document.querySelectorAll(".toolbar-btn[data-tool]")
  toolbarButtons.forEach(button => {
    if (button.dataset.tool === editorState.currentTool) {
      button.classList.add("active")
    } else {
      button.classList.remove("active")
    }
  })
  
  // Update canvas cursor
  if (typeof window !== "undefined" && canvas) {
    if (editorState.currentTool === "erase") {
      canvas.style.cursor = "grab"
    } else if (editorState.currentTool === "select") {
      canvas.style.cursor = "default"
    } else if (["rectangle", "circle", "triangle", "text", "image"].includes(editorState.currentTool)) {
      canvas.style.cursor = "crosshair"
    } else if (editorState.currentTool === "pencil") {
      canvas.style.cursor = "crosshair"
    } else {
      canvas.style.cursor = "default"
    }
  }
}

/**
 * Initialize toolbar buttons with tool switching
 */
function initializeToolbar() {
  const toolbarButtons = document.querySelectorAll(".toolbar-btn[data-tool]")
  
  // Set initial active state
  updateToolbarActiveState()
  
  toolbarButtons.forEach(button => {
    button.addEventListener("click", () => {
      const selectedTool = button.dataset.tool
      
      if (selectedTool === "image") {
        fileInput.click()
        // Keep image tool active after file selection
        editorState.currentTool = "image"
        updateToolbarActiveState()
        return
      }
      
      // Update current tool and toolbar state
      editorState.currentTool = selectedTool
      updateToolbarActiveState()
    })
  })
}

initializeToolbar()

/* ===================== EXPORT ===================== */
/**
 * Handles SVG export functionality
 */
function initializeExport() {
  const exportButton = document.getElementById("exportBtn")
  if (!exportButton) return

  exportButton.addEventListener("click", () => {
    try {
      const svgContent = exportStageAsSVG(canvas, stage, editorState.backgroundColor)
      
      // Create download link
      const blob = new Blob([svgContent], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "vectorflow-export.svg"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export SVG. Please try again.")
    }
  })
}

initializeExport()

/* ===================== UNDO / REDO ===================== */
/**
 * Handles actions after undo/redo operations
 */
function afterHistoryOperation() {
  clearSelection(stage)
  syncLayers()
  syncProperties()
  autoSave()
}

/**
 * Initialize undo/redo buttons and keyboard shortcuts
 */
function initializeHistoryControls() {
  const undoButton = document.getElementById("undoBtn")
  const redoButton = document.getElementById("redoBtn")

  if (undoButton) {
    undoButton.addEventListener("click", () => {
      undo()
      afterHistoryOperation()
    })
  }

  if (redoButton) {
    redoButton.addEventListener("click", () => {
      redo()
      afterHistoryOperation()
    })
  }

  // Keyboard shortcuts
  window.addEventListener("keydown", (event) => {
    // Undo: Ctrl+Z (or Cmd+Z on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
      event.preventDefault()
      undo()
      afterHistoryOperation()
      return
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Shift+Z on Mac)
    if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
      event.preventDefault()
      redo()
      afterHistoryOperation()
      return
    }

    // Delete selected element
    if (event.key === "Delete" || event.key === "Backspace") {
      if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        deleteSelected()
      }
    }
  })
}

initializeHistoryControls()

/* ===================== AUTO SAVE ===================== */
/**
 * Auto-saves the current editor state to localStorage
 */
function autoSave() {
  saveToStorage(stage, editorState)
}

/* ===================== BACKGROUND ===================== */
/**
 * Initialize background color picker
 */
function initializeBackgroundControls() {
  const bgPicker = document.getElementById("bgColorPicker")
  const bgPreview = document.getElementById("bgPreview")
  const bgValue = document.getElementById("bgValue")

  if (!bgPicker || !bgPreview || !bgValue) return

  bgPicker.addEventListener("input", (event) => {
    editorState.backgroundColor = event.target.value
    canvas.style.background = editorState.backgroundColor
    bgPreview.style.background = editorState.backgroundColor
    bgValue.value = editorState.backgroundColor
    autoSave()
  })
}

initializeBackgroundControls()

/* ===================== FILL COLOR ===================== */
/**
 * Initialize fill color picker
 */
function initializeFillColorControls() {
  const fillPicker = document.getElementById("fillColorPicker")
  const fillPreview = document.getElementById("fillPreview")
  const fillValue = document.getElementById("fillValue")

  if (!fillPicker || !fillPreview || !fillValue) return

  fillPicker.addEventListener("input", (event) => {
    editorState.fillColor = event.target.value
    fillPreview.style.background = editorState.fillColor
    fillValue.value = editorState.fillColor

    const selectedElement = editorState.selectedElem
    if (!selectedElement) return

    // Apply fill color based on element type
    const elementType = selectedElement.dataset.type
    if (["rectangle", "circle", "triangle"].includes(elementType)) {
      selectedElement.style.backgroundColor = editorState.fillColor
    } else if (elementType === "text") {
      selectedElement.style.color = editorState.fillColor
    }

    updateOverlay(selectedElement, canvas)
    autoSave()
  })
}

initializeFillColorControls()

/* ===================== DELETE ===================== */
/**
 * Deletes the currently selected element(s)
 */
function deleteSelected() {
  // Delete all selected elements if multi-selection is active
  if (editorState.selectedElems && editorState.selectedElems.size > 0) {
    editorState.selectedElems.forEach(element => {
      if (element && element.parentNode) {
        element.remove()
      }
    })
  } else if (editorState.selectedElem) {
    // Delete single selected element
    editorState.selectedElem.remove()
  } else {
    return // Nothing to delete
  }

  clearSelection(stage)
  syncLayers()
  syncProperties()
  saveState()
  autoSave()
}

/**
 * Initialize delete button
 */
function initializeDeleteButton() {
  const deleteButton = document.getElementById("deleteBtn")
  if (deleteButton) {
    deleteButton.addEventListener("click", deleteSelected)
  }
}

initializeDeleteButton()

/* ===================== PROPERTIES ===================== */
const propertyInputs = {
  width: document.getElementById("propW"),
  height: document.getElementById("propH"),
  x: document.getElementById("propX"),
  y: document.getElementById("propY"),
  opacity: document.getElementById("propOpacity"),
  radius: document.getElementById("propRadius"),
  text: document.getElementById("propText"),
  fontSize: document.getElementById("propFontSize"),
}

/**
 * Syncs property panel with selected element
 */
function syncProperties() {
  const selectedElement = editorState.selectedElem
  
  if (!selectedElement) {
    // Clear all property inputs
    Object.values(propertyInputs).forEach(input => {
      if (input) input.value = ""
    })
    if (propertyInputs.fontSize) propertyInputs.fontSize.value = "16"
    return
  }

  // Update property values from element
  if (propertyInputs.width) {
    propertyInputs.width.value = parseFloat(selectedElement.style.width) || selectedElement.offsetWidth
  }
  if (propertyInputs.height) {
    propertyInputs.height.value = parseFloat(selectedElement.style.height) || selectedElement.offsetHeight
  }
  if (propertyInputs.x) {
    propertyInputs.x.value = parseFloat(selectedElement.style.left) || 0
  }
  if (propertyInputs.y) {
    propertyInputs.y.value = parseFloat(selectedElement.style.top) || 0
  }
  if (propertyInputs.opacity) {
    propertyInputs.opacity.value = Math.round((parseFloat(selectedElement.style.opacity) || 1) * 100)
  }
  if (propertyInputs.radius) {
    propertyInputs.radius.value = parseFloat(selectedElement.style.borderRadius) || 0
  }

  // Text-specific properties
  if (selectedElement.dataset.type === "text") {
    if (propertyInputs.text) propertyInputs.text.value = selectedElement.innerText || ""
    if (propertyInputs.fontSize) propertyInputs.fontSize.value = parseFloat(selectedElement.style.fontSize) || 16
  } else {
    if (propertyInputs.text) propertyInputs.text.value = ""
    if (propertyInputs.fontSize) propertyInputs.fontSize.value = "16"
  }
}

/**
 * Applies property changes to selected element
 */
function applyProperties() {
  const selectedElement = editorState.selectedElem
  if (!selectedElement) return

  // Apply size and position
  if (propertyInputs.width && !isNaN(propertyInputs.width.value)) {
    selectedElement.style.width = `${Math.max(10, propertyInputs.width.value)}px`
  }
  if (propertyInputs.height && !isNaN(propertyInputs.height.value)) {
    selectedElement.style.height = `${Math.max(10, propertyInputs.height.value)}px`
  }
  if (propertyInputs.x && !isNaN(propertyInputs.x.value)) {
    selectedElement.style.left = `${propertyInputs.x.value}px`
  }
  if (propertyInputs.y && !isNaN(propertyInputs.y.value)) {
    selectedElement.style.top = `${propertyInputs.y.value}px`
  }

  // Apply appearance
  if (propertyInputs.opacity) {
    const opacityValue = Math.max(0, Math.min(100, propertyInputs.opacity.value))
    selectedElement.style.opacity = `${opacityValue / 100}`
  }
  if (propertyInputs.radius) {
    selectedElement.style.borderRadius = `${Math.max(0, propertyInputs.radius.value)}px`
  }

  // Apply text-specific properties
  if (selectedElement.dataset.type === "text") {
    if (propertyInputs.text) selectedElement.innerText = propertyInputs.text.value
    if (propertyInputs.fontSize && !isNaN(propertyInputs.fontSize.value)) {
      selectedElement.style.fontSize = `${Math.max(8, propertyInputs.fontSize.value)}px`
    }
  }

  updateOverlay(selectedElement, canvas)
  autoSave()
}

// Attach event listeners to property inputs
Object.values(propertyInputs).forEach(input => {
  if (input) input.addEventListener("input", applyProperties)
})

/* ===================== LAYERS ===================== */
const layersList = document.getElementById("layersList")

const layerTypeIcons = {
  rectangle: "ri-checkbox-blank-line",
  circle: "ri-circle-line",
  triangle: "ri-play-line",
  pencil: "ri-pencil-line",
  path: "ri-pencil-line",
  text: "ri-text",
  image: "ri-image-line",
}

/**
 * Syncs the layers panel with current stage elements
 */
function syncLayers() {
  if (!layersList) return

  const elements = [...stage.querySelectorAll(".vf-elem")]
  layersList.innerHTML = ""

  // Add pencil layer entry if paths exist
  const pencilLayer = stage.querySelector("#pencilLayer")
  const pencilPaths = pencilLayer ? pencilLayer.querySelectorAll("path[data-type='pencil']") : []
  
  if (pencilPaths.length > 0) {
    const pencilLi = document.createElement("li")
    pencilLi.className = "layer-item"
    pencilLi.innerHTML = `
      <i class="${layerTypeIcons.pencil} layer-icon"></i>
      <span class="layer-label">Pencil (${pencilPaths.length})</span>
    `
    layersList.appendChild(pencilLi)
  }

  // Add element layers
  elements.forEach(element => {
    const layerItem = document.createElement("li")
    layerItem.className = "layer-item"
    
    if (element === editorState.selectedElem) {
      layerItem.classList.add("active")
    }

    const elementType = element.dataset.type || "shape"
    const iconClass = layerTypeIcons[elementType] || "ri-shapes-line"

    layerItem.innerHTML = `
      <i class="${iconClass} layer-icon"></i>
      <span class="layer-label">${elementType}</span>
    `

    layerItem.onclick = () => {
      selectElem(element, stage, canvas)
      syncLayers()
      syncProperties()
    }

    layersList.appendChild(layerItem)
  })
}

/* ===================== CANVAS CLICK SYNC ===================== */
/**
 * Syncs UI after canvas interactions
 */
function syncUIAfterInteraction() {
  requestAnimationFrame(() => {
    syncLayers()
    syncProperties()
    autoSave()
  })
}

canvas.addEventListener("mousedown", syncUIAfterInteraction)

/* ===================== TEXT EDITING PERSISTENCE ===================== */
/**
 * Ensure text edits are saved to localStorage
 */
function initializeTextEditingPersistence() {
  // Use event delegation on stage for text editing
  stage.addEventListener("input", (event) => {
    if (event.target.classList.contains("vf-text")) {
      saveState()
      autoSave()
    }
  })

  // Save when text element loses focus
  stage.addEventListener("blur", (event) => {
    if (event.target.classList.contains("vf-text")) {
      saveState()
      autoSave()
      syncLayers()
      syncProperties()
    }
  }, true)
}

initializeTextEditingPersistence()

/* ===================== LOAD FROM STORAGE ===================== */
/**
 * Loads and restores editor state from localStorage
 */
function loadEditorState() {
  const savedState = loadFromStorage()
  if (!savedState) {
    // No saved state - initialize empty
    saveState()
    return
  }

  // Clear stage
  stage.innerHTML = ""

  // Restore viewport settings
  editorState.zoom = savedState.zoom ?? 1
  editorState.panX = savedState.panX ?? 0
  editorState.panY = savedState.panY ?? 0

  // Restore background color
  editorState.backgroundColor = savedState.background || editorState.backgroundColor
  canvas.style.background = editorState.backgroundColor

  // Update background UI controls
  const bgPreview = document.getElementById("bgPreview")
  const bgValue = document.getElementById("bgValue")
  const bgPicker = document.getElementById("bgColorPicker")
  
  if (bgPreview) bgPreview.style.background = editorState.backgroundColor
  if (bgValue) bgValue.value = editorState.backgroundColor
  if (bgPicker) bgPicker.value = editorState.backgroundColor

  // Restore elements (world space coordinates)
  if (savedState.elements && savedState.elements.length > 0) {
    savedState.elements.forEach(elementData => {
      const element = buildFromData(elementData)
      stage.appendChild(element)
    })
  }

  // Restore pencil paths
  if (savedState.pencilPaths && savedState.pencilPaths.length > 0) {
    restorePencilPaths(stage, savedState.pencilPaths)
  }

  // Apply viewport transformation
  applyViewport(stage)

  // Save loaded state to history for undo/redo
  saveState()
}

// Load saved state first, then initialize
loadEditorState()

/* ===================== FINAL SYNC ===================== */
syncLayers()
syncProperties()
// Save initial state after loading (if nothing was loaded, this saves empty state)
saveState()
autoSave()
