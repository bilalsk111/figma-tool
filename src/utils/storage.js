const KEY = "vectorflow-dom-v1"

export function saveToStorage(stage, editorState) {
  const elems = [...stage.querySelectorAll(".vf-elem")]

  const pencilLayer = stage.querySelector("#pencilLayer")
  const pencilPaths = pencilLayer
    ? [...pencilLayer.querySelectorAll("path")].map(p => ({
        d: p.getAttribute("d"),
        stroke: p.getAttribute("stroke"),
        strokeWidth: p.getAttribute("stroke-width")
      }))
    : []

  const payload = {
    background: editorState.backgroundColor,
    zoom: editorState.zoom,
    panX: editorState.panX,
    panY: editorState.panY,

    elements: elems.map(el => {
      const type = el.dataset.type

      const item = {
        type,
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
        w: parseFloat(el.style.width) || el.offsetWidth,
        h: parseFloat(el.style.height) || el.offsetHeight,
        opacity: parseFloat(el.style.opacity || "1"),
        radius: parseFloat(el.style.borderRadius || "0"),
        rotate: el.style.transform || "",
      }

      if (type === "rectangle" || type === "circle" || type === "triangle") {
        item.fill = el.style.backgroundColor || "#D9D9D9"
      }

      if (type === "text") {
        item.text = el.innerText
        item.fill = el.style.color || "#D9D9D9"
        item.fontSize = parseFloat(el.style.fontSize) || 16
      }

      if (type === "image") {
        item.src = el.querySelector("img")?.src || ""
      }

      return item
    }),

    pencil: pencilPaths
  }

  localStorage.setItem(KEY, JSON.stringify(payload))
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
