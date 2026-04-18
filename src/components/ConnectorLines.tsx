import { useRef, useLayoutEffect } from 'react'
import type { Bracket } from '@/store/types'

interface ConnectorLinesProps {
  bracket: Bracket
  canvasRef: React.RefObject<HTMLDivElement | null>
}

/* ============================================================
   CONNECTOR LINES — SVG overlay
   Queries the rendered DOM for match card positions via
   getBoundingClientRect, then draws cubic-bezier connector
   paths in a dedicated SVG per connector column.
   Runs in useLayoutEffect so layout is settled before painting.
   ============================================================ */
export function ConnectorLines({ bracket, canvasRef }: ConnectorLinesProps) {
  // This component does not render any JSX — it operates on the DOM directly
  // via refs, which is intentional: SVG geometry must read live DOMRects.
  const rafRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      drawConnectors(canvas, bracket)
    })
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }) // re-run on every render so lines stay aligned after data changes

  return null
}

function makePath(
  svg: SVGSVGElement,
  d: string,
  stroke: string,
  strokeWidth: string,
  active: boolean,
) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', active ? 'var(--win)' : stroke)
  path.setAttribute('stroke-width', strokeWidth)
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(path)
}

function createSvg(container: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('bracket-svg')
  svg.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;'
  container.appendChild(svg)
  return svg
}

function drawConnectors(canvas: HTMLElement, bracket: Bracket) {
  // Clear previous SVG overlays
  canvas.querySelectorAll('.bracket-svg').forEach((s) => s.remove())

  const totalRounds = bracket.rounds.length
  if (totalRounds === 0) return

  if (bracket.layout === 'double' && totalRounds >= 2) {
    for (let r = 0; r < totalRounds - 1; r++) {
      const half = bracket.rounds[r].length / 2
      if (r < totalRounds - 2) {
        drawSideConnectors(canvas, bracket, r, 0, half, 'L', 'L', false)
        drawSideConnectors(canvas, bracket, r, half, bracket.rounds[r].length, 'R', 'R', true)
      } else {
        drawToCenterConnectors(canvas, bracket, r, 0, 1, 'L', 'C', false)
        drawToCenterConnectors(canvas, bracket, r, 1, 2, 'R', 'C', true)
      }
    }
  } else {
    for (let r = 0; r < totalRounds - 1; r++) {
      drawSideConnectors(canvas, bracket, r, 0, bracket.rounds[r].length, 'S', 'S', false)
    }
  }
}

function drawSideConnectors(
  canvas: HTMLElement,
  bracket: Bracket,
  r: number,
  startM: number,
  endM: number,
  srcPre: string,
  dstPre: string,
  isReversed: boolean,
) {
  const connectorCol = canvas.querySelector<HTMLElement>(`#connector-${srcPre}-${r}`)
  if (!connectorCol) return
  const colRect = connectorCol.getBoundingClientRect()
  const svg = createSvg(connectorCol)

  for (let m = startM; m < endM; m += 2) {
    const nextMatchIdx = Math.floor((m - startM) / 2) + Math.floor(startM / 2)
    const topM = bracket.rounds[r][m]
    const btmM = bracket.rounds[r][m + 1] ?? topM

    const topIsBye = r === 0 && topM && (topM.p1Id == null) !== (topM.p2Id == null)
    const btmIsBye = r === 0 && btmM && (btmM.p1Id == null) !== (btmM.p2Id == null)

    const topMatchEl = canvas.querySelector<HTMLElement>(`#match-${srcPre}-${r}-${m}`)
    const btmMatchEl = canvas.querySelector<HTMLElement>(`#match-${srcPre}-${r}-${m + 1}`)
    const nextMatchEl = canvas.querySelector<HTMLElement>(`#match-${dstPre}-${r + 1}-${nextMatchIdx}`)

    if (!nextMatchEl) continue

    const nxtRect = nextMatchEl.getBoundingClientRect()
    const xMid = colRect.width / 2
    const xEnd = isReversed ? nxtRect.right - colRect.left : nxtRect.left - colRect.left
    const yDst = nxtRect.top + nxtRect.height / 2 - colRect.top

    const nextMatch = bracket.rounds[r + 1]?.[nextMatchIdx]
    const nextExists = nextMatch?.p1Id != null || nextMatch?.p2Id != null

    if (!topIsBye && !btmIsBye && topMatchEl && btmMatchEl) {
      const topRect = topMatchEl.getBoundingClientRect()
      const btmRect = btmMatchEl.getBoundingClientRect()
      const x0top = isReversed ? topRect.left - colRect.left : topRect.right - colRect.left
      const x0btm = isReversed ? btmRect.left - colRect.left : btmRect.right - colRect.left
      const y1 = topRect.top + topRect.height / 2 - colRect.top
      const y2 = btmRect.top + btmRect.height / 2 - colRect.top
      const yMid = (y1 + y2) / 2

      const topWon = topM?.winnerId != null
      const btmWon = btmM?.winnerId != null
      const cssVar = topWon || btmWon ? 'var(--win)' : 'var(--border)'
      const sw = topWon || btmWon ? '1.5' : '1'

      const maxR = Math.min(8, xMid)
      const cr = Math.min(maxR, Math.abs(yMid - y1))
      const cx = isReversed ? xMid + cr : xMid - cr
      const topVDir = yMid >= y1 ? cr : -cr
      const btmVDir = yMid <= y2 ? -cr : cr

      makePath(svg, `M ${x0top} ${y1} H ${cx} Q ${xMid} ${y1} ${xMid} ${y1 + topVDir} V ${yMid}`, cssVar, sw, topWon)
      makePath(svg, `M ${x0btm} ${y2} H ${cx} Q ${xMid} ${y2} ${xMid} ${y2 + btmVDir} V ${yMid}`, cssVar, sw, btmWon)
      makePath(svg, `M ${xMid} ${yMid} H ${xEnd}`, cssVar, sw, nextExists)
    } else {
      if (topIsBye && btmIsBye) continue
      const realMatchEl = topIsBye ? btmMatchEl : topMatchEl
      const realM = topIsBye ? btmM : topM
      if (!realMatchEl) continue

      const realRect = realMatchEl.getBoundingClientRect()
      const x0 = isReversed ? realRect.left - colRect.left : realRect.right - colRect.left
      let y1 = realRect.top + realRect.height / 2 - colRect.top
      let yEnd = yDst

      if (Math.abs(yEnd - y1) <= 4) yEnd = y1

      const won = realM?.winnerId != null
      const cssVar = won ? 'var(--win)' : 'var(--border)'
      const sw = won ? '1.5' : '1'
      const maxR = Math.min(8, xMid)
      const cR = Math.min(maxR, Math.abs(yEnd - y1) / 2)
      const vDir = yEnd >= y1 ? 1 : -1
      const c1x = isReversed ? xMid + cR : xMid - cR
      const c2x = isReversed ? xMid - cR : xMid + cR
      makePath(
        svg,
        `M ${x0} ${y1} H ${c1x} Q ${xMid} ${y1} ${xMid} ${y1 + vDir * cR}` +
        ` V ${yEnd - vDir * cR} Q ${xMid} ${yEnd} ${c2x} ${yEnd} H ${xEnd}`,
        cssVar, sw, nextExists,
      )
    }
  }
}

function drawToCenterConnectors(
  canvas: HTMLElement,
  bracket: Bracket,
  r: number,
  m: number,
  _limit: number,
  srcPre: string,
  _dstPre: string,
  isReversed: boolean,
) {
  const connectorId = isReversed ? `connector-C-R` : `connector-C-L`
  const connectorCol = canvas.querySelector<HTMLElement>(`#${connectorId}`)
  if (!connectorCol) return
  const colRect = connectorCol.getBoundingClientRect()
  const svg = createSvg(connectorCol)

  const topMatchEl = canvas.querySelector<HTMLElement>(`#match-${srcPre}-${r}-${m}`)
  const nextMatchEl = canvas.querySelector<HTMLElement>(`#match-C-${r + 1}-0`)

  if (!topMatchEl || !nextMatchEl) return

  const topRect = topMatchEl.getBoundingClientRect()
  const nxtRect = nextMatchEl.getBoundingClientRect()

  let x0 = topRect.right - colRect.left
  let xEnd = nxtRect.left - colRect.left
  if (isReversed) {
    x0 = topRect.left - colRect.left
    xEnd = nxtRect.right - colRect.left
  }

  let y1 = topRect.top + topRect.height / 2 - colRect.top
  let yEnd = nxtRect.top + nxtRect.height / 2 - colRect.top
  if (Math.abs(yEnd - y1) <= 4) yEnd = y1

  const topWon = bracket.rounds[r]?.[m]?.winnerId != null
  const cssVar = topWon ? 'var(--win)' : 'var(--border)'
  const sw = topWon ? '1.5' : '1'
  const xMid = colRect.width / 2
  const maxR = Math.min(8, xMid)
  const cR = Math.min(maxR, Math.abs(yEnd - y1) / 2)
  const vDir = yEnd >= y1 ? 1 : -1
  const c1x = isReversed ? xMid + cR : xMid - cR
  const c2x = isReversed ? xMid - cR : xMid + cR

  makePath(
    svg,
    `M ${x0} ${y1} H ${c1x} Q ${xMid} ${y1} ${xMid} ${y1 + vDir * cR}` +
    ` V ${yEnd - vDir * cR} Q ${xMid} ${yEnd} ${c2x} ${yEnd} H ${xEnd}`,
    cssVar, sw, topWon,
  )
}
