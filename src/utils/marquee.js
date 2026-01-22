let marquee = null
let startX = 0
let startY = 0
let lastRect = null

export function startMarquee(canvas, x, y) {
  endMarquee()
  startX = x
  startY = y

  marquee = document.createElement("div")
  marquee.id = "vf-marquee"

  Object.assign(marquee.style, {
    left: `${x}px`,
    top: `${y}px`,
    width: "0px",
    height: "0px"
  })

  canvas.appendChild(marquee)
}

export function updateMarquee(x, y) {
  if (!marquee) return

  const rx = Math.min(startX, x)
  const ry = Math.min(startY, y)
  const rw = Math.abs(x - startX)
  const rh = Math.abs(y - startY)

  marquee.style.left = `${rx}px`
  marquee.style.top = `${ry}px`
  marquee.style.width = `${rw}px`
  marquee.style.height = `${rh}px`

  lastRect = { x: rx, y: ry, w: rw, h: rh }
}

export function getMarqueeRect() {
  return lastRect
}

export function endMarquee() {
  marquee?.remove()
  marquee = null
  lastRect = null
}
