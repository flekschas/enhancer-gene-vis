interface ScoreProperty {
  score: number;
}

type DataNode<T> = {
  x: number;
  y: number;
  data: T;
  next: DataNode<T> | null;
};

/**
 * From https://observablehq.com/@d3/beeswarm
 */
export function dodge<T extends ScoreProperty>(
  data: T[],
  radius: number,
  yScale: Function
) {
  console.log(data);
  // console.log(data);
  const radius2 = radius ** 2;
  const circles = data
    .map(
      (d) => ({ y: yScale(d.score), data: d, x: 0, next: null } as DataNode<T>)
    )
    .sort((a, b) => a.y - b.y);
  const epsilon = 1e-3;
  let head: DataNode<T> | null = null;
  let tail: DataNode<T> | null = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x: number, y: number): boolean {
    let a = head;
    while (a) {
      if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
        return true;
      }
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const b of circles) {
    // Remove circles from the queue that can’t intersect the new circle b.
    while (head && head.y < b.y - radius2) head = head.next;

    // Choose the minimum non-intersecting tangent.
    if (intersects((b.x = 0), b.y)) {
      let a = head;
      b.x = Infinity;
      // do {
      //   const x = a.x + Math.sqrt(radius2 - (a.y - b.y) ** 2);
      //   if (x < b.x && !intersects(x, b.y)) b.x = x;
      //   a = a.next;
      // } while (a);
      while (a) {
        const x = a.x + Math.sqrt(radius2 - (a.y - b.y) ** 2);
        if (x < b.x && !intersects(x, b.y)) b.x = x;
        a = a.next;
      }
    }

    // Add b to the queue.
    b.next = null;
    // eslint-disable-next-line no-multi-assign
    if (head === null) head = tail = b;
    // eslint-disable-next-line no-multi-assign
    // TODO: Remove non-null assertion
    else tail = tail!.next = b;
  }

  return circles;
}
