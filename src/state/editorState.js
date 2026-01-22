export const editorState = {
  currentTool: "select",

  backgroundColor: "#1e1e1e",
  fillColor: "#D9D9D9",

  stage: null,

  selectedElem: null,
  selectedElems: new Set(),

  isDrawing: false,
  isDragging: false,
  isResizing: false,
  isRotating: false,
  isMarquee: false,

  isPanning: false,
  spaceDown: false,

  startX: 0,
  startY: 0,

  dragOffsetX: 0,
  dragOffsetY: 0,
  groupDragStart: null,

  resizeHandle: null,
  startBox: null,

  rotateCenter: null,
  rotateStartAngle: 0,
  rotation: new Map(),

  zoom: 1,
  panX: 0,
  panY: 0,
  panStart: null,

  pendingImageURL: null
}
