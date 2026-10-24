/**
 * გზის პოვნა სამყაროში (A* ბადეზე) — მიმთითებელი ისრებისთვის.
 * დაბრკოლებებად ითვლება სამყაროს collider-ები (ყუთები და წრეები), ოდნავ გაზრდილი გმირის ზომით.
 */

export type PathCollider =
  | { type: 'circle'; x: number; z: number; radius: number; height: number }
  | { type: 'box'; x: number; z: number; halfWidth: number; halfDepth: number; height: number }

export interface Point2 {
  x: number
  z: number
}

export interface PathGrid {
  cell: number
  half: number
  size: number
  blocked: Uint8Array
}

/** ბადე: ყოველი უჯრა "თავისუფალია" ან "დაკავებული" */
export function buildGrid(
  colliders: PathCollider[],
  radius: number,
  cell = 0.75,
  margin = 0.9,
): PathGrid {
  const half = radius + 3
  const size = Math.ceil((half * 2) / cell)
  const blocked = new Uint8Array(size * size)

  const solid = colliders.filter(c => c.height >= 0.6)
  for (let gz = 0; gz < size; gz++) {
    for (let gx = 0; gx < size; gx++) {
      const x = -half + (gx + 0.5) * cell
      const z = -half + (gz + 0.5) * cell
      for (const c of solid) {
        const hit =
          c.type === 'circle'
            ? Math.hypot(x - c.x, z - c.z) < c.radius + margin
            : Math.abs(x - c.x) < c.halfWidth + margin && Math.abs(z - c.z) < c.halfDepth + margin
        if (hit) {
          blocked[gz * size + gx] = 1
          break
        }
      }
    }
  }
  return { cell, half, size, blocked }
}

const toCell = (grid: PathGrid, v: number) =>
  Math.max(0, Math.min(grid.size - 1, Math.floor((v + grid.half) / grid.cell)))
const toWorld = (grid: PathGrid, g: number) => -grid.half + (g + 0.5) * grid.cell

function clearAround(grid: PathGrid, gx: number, gz: number, cells: number, into: Uint8Array) {
  for (let dz = -cells; dz <= cells; dz++) {
    for (let dx = -cells; dx <= cells; dx++) {
      const x = gx + dx
      const z = gz + dz
      if (x < 0 || z < 0 || x >= grid.size || z >= grid.size) continue
      if (dx * dx + dz * dz <= cells * cells) into[z * grid.size + x] = 0
    }
  }
}

function lineFree(grid: PathGrid, blocked: Uint8Array, a: Point2, b: Point2): boolean {
  const dist = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.max(1, Math.ceil(dist / (grid.cell * 0.5)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const gx = toCell(grid, a.x + (b.x - a.x) * t)
    const gz = toCell(grid, a.z + (b.z - a.z) * t)
    if (blocked[gz * grid.size + gx]) return false
  }
  return true
}

/** უმოკლესი გზა start-დან goal-მდე (გასწორებული წერტილებით) ან null, თუ ვერ მოიძებნა */
export function findPath(grid: PathGrid, start: Point2, goal: Point2): Point2[] | null {
  const size = grid.size
  const blocked = grid.blocked.slice()

  const sx = toCell(grid, start.x)
  const sz = toCell(grid, start.z)
  const gx = toCell(grid, goal.x)
  const gz = toCell(grid, goal.z)
  // საწყისი და სამიზნე წერტილი შეიძლება დაბრკოლების გაზრდილ არეში აღმოჩნდეს — იქ გავიხსნათ
  clearAround(grid, sx, sz, 2, blocked)
  clearAround(grid, gx, gz, 2, blocked)

  const total = size * size
  const gScore = new Float32Array(total).fill(Infinity)
  const parent = new Int32Array(total).fill(-1)
  const closed = new Uint8Array(total)

  // ორობითი ხეობა (heap) (ინდექსი, f)
  const heapIdx: number[] = []
  const heapF: number[] = []
  const push = (idx: number, f: number) => {
    heapIdx.push(idx)
    heapF.push(f)
    let i = heapIdx.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heapF[p] <= heapF[i]) break
      ;[heapIdx[p], heapIdx[i]] = [heapIdx[i], heapIdx[p]]
      ;[heapF[p], heapF[i]] = [heapF[i], heapF[p]]
      i = p
    }
  }
  const pop = (): number => {
    const top = heapIdx[0]
    const lastIdx = heapIdx.pop() as number
    const lastF = heapF.pop() as number
    if (heapIdx.length > 0) {
      heapIdx[0] = lastIdx
      heapF[0] = lastF
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < heapIdx.length && heapF[l] < heapF[m]) m = l
        if (r < heapIdx.length && heapF[r] < heapF[m]) m = r
        if (m === i) break
        ;[heapIdx[m], heapIdx[i]] = [heapIdx[i], heapIdx[m]]
        ;[heapF[m], heapF[i]] = [heapF[i], heapF[m]]
        i = m
      }
    }
    return top
  }

  const heuristic = (x: number, z: number) => {
    const dx = Math.abs(x - gx)
    const dz = Math.abs(z - gz)
    return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz)
  }

  const startIdx = sz * size + sx
  const goalIdx = gz * size + gx
  gScore[startIdx] = 0
  push(startIdx, heuristic(sx, sz))

  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ]

  let found = false
  while (heapIdx.length > 0) {
    const current = pop()
    if (closed[current]) continue
    closed[current] = 1
    if (current === goalIdx) {
      found = true
      break
    }
    const cx = current % size
    const cz = (current - cx) / size
    for (const [dx, dz, cost] of dirs) {
      const nx = cx + dx
      const nz = cz + dz
      if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue
      const n = nz * size + nx
      if (blocked[n] || closed[n]) continue
      if (dx !== 0 && dz !== 0 && (blocked[cz * size + nx] || blocked[nz * size + cx])) continue
      const g = gScore[current] + cost
      if (g < gScore[n]) {
        gScore[n] = g
        parent[n] = current
        push(n, g + heuristic(nx, nz))
      }
    }
  }
  if (!found) return null

  const cells: Point2[] = []
  for (let at = goalIdx; at !== -1; at = parent[at]) {
    const x = at % size
    const z = (at - x) / size
    cells.push({ x: toWorld(grid, x), z: toWorld(grid, z) })
  }
  cells.reverse()
  cells[0] = { x: start.x, z: start.z }
  cells[cells.length - 1] = { x: goal.x, z: goal.z }

  // გასწორება: ზედმეტი მოხვევები ამოვიღოთ, სადაც პირდაპირ ხაზი თავისუფალია
  const result: Point2[] = [cells[0]]
  let i = 0
  while (i < cells.length - 1) {
    let j = cells.length - 1
    while (j > i + 1 && !lineFree(grid, blocked, cells[i], cells[j])) j--
    result.push(cells[j])
    i = j
  }
  return result
}
