let overlay = null

export function hideOverlay() {
  overlay?.remove()
  overlay = null
}

export function getOverlay() {
  return overlay
}

export function showOverlay(target, canvas) {
  hideOverlay()
  if (!target) return

  const r = target.getBoundingClientRect()
  const c = canvas.getBoundingClientRect()

  overlay = document.createElement("div")
  overlay.id = "vf-overlay"
  overlay.__target = target

  overlay.style.left = `${r.left - c.left}px`
  overlay.style.top = `${r.top - c.top}px`
  overlay.style.width = `${r.width}px`
  overlay.style.height = `${r.height}px`

  const handles = [
    ["tl", 0, 0],
    ["tr", r.width, 0],
    ["bl", 0, r.height],
    ["br", r.width, r.height]
  ]

  handles.forEach(([pos, x, y]) => {
    const h = document.createElement("div")
    h.className = "vf-handle"
    h.dataset.pos = pos
    h.style.left = `${x - 5}px`
    h.style.top = `${y - 5}px`
    overlay.appendChild(h)
  })

  const rot = document.createElement("div")
  rot.className = "vf-rotate"
  rot.dataset.rotate = "true"
  rot.style.left = `${r.width / 2 - 6}px`
  rot.style.top = `-24px`
  overlay.appendChild(rot)

  canvas.appendChild(overlay)
}

export function updateOverlay(target, canvas) {
  showOverlay(target, canvas)
}
