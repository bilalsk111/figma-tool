function escapeXML(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function getRotationDeg(el) {
  const t = el.style.transform || ""
  const m = t.match(/rotate\(([-\d.]+)deg\)/)
  return m ? parseFloat(m[1]) : 0
}

export function exportStageAsSVG(canvas, stage, bgColor) {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  const elems = [...stage.querySelectorAll(".vf-elem")]

  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`)
  parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${bgColor}" />`)

  elems.forEach(el => {
    const type = el.dataset.type
    const x = parseFloat(el.style.left) || 0
    const y = parseFloat(el.style.top) || 0
    const width = parseFloat(el.style.width) || el.offsetWidth
    const height = parseFloat(el.style.height) || el.offsetHeight
    const opacity = parseFloat(el.style.opacity || "1")
    const rot = getRotationDeg(el)

    const cx = x + width / 2
    const cy = y + height / 2
    const transform = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ""

    if (type === "rectangle") {
      const fill = el.style.backgroundColor || "#D9D9D9"
      const radius = parseFloat(el.style.borderRadius || "0")
      parts.push(
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${fill}" opacity="${opacity}"${transform} />`
      )
    }

    if (type === "circle") {
      const fill = el.style.backgroundColor || "#D9D9D9"
      const r = Math.min(width, height) / 2
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"${transform} />`
      )
    }

    if (type === "triangle") {
      const fill = el.style.backgroundColor || "#D9D9D9"
      const p1 = `${x + width / 2},${y}`
      const p2 = `${x},${y + height}`
      const p3 = `${x + width},${y + height}`
      parts.push(
        `<polygon points="${p1} ${p2} ${p3}" fill="${fill}" opacity="${opacity}"${transform} />`
      )
    }

    if (type === "text") {
      const fill = el.style.color || "#D9D9D9"
      const fs = parseFloat(el.style.fontSize) || 16
      const txt = escapeXML(el.innerText || "")
      parts.push(
        `<text x="${x}" y="${y + fs}" fill="${fill}" font-size="${fs}" font-family="Inter, sans-serif" opacity="${opacity}"${transform}>${txt}</text>`
      )
    }

    if (type === "image") {
      const img = el.querySelector("img")
      const href = img?.src || ""
      parts.push(
        `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" opacity="${opacity}"${transform} />`
      )
    }
  })

  // Export pencil paths
  const pencilLayer = stage.querySelector("#pencilLayer")
  if (pencilLayer) {
    const pencilPaths = pencilLayer.querySelectorAll("path[data-type='pencil']")
    pencilPaths.forEach(path => {
      const pathData = path.getAttribute("d") || ""
      const stroke = path.getAttribute("stroke") || "#D9D9D9"
      const strokeWidth = path.getAttribute("stroke-width") || "2"
      const strokeLinecap = path.getAttribute("stroke-linecap") || "round"
      const strokeLinejoin = path.getAttribute("stroke-linejoin") || "round"
      
      parts.push(
        `<path d="${pathData}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}" />`
      )
    })
  }

  parts.push(`</svg>`)
  return parts.join("\n")
}

export function downloadSVG(svgText) {
  const blob = new Blob([svgText], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "vectorflow-export.svg"
  a.click()

  URL.revokeObjectURL(url)
}
