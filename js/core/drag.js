// Drag with Pointer Events. The HTML drag and drop API does not work well on touch screens.

/**
 * Let the user drag an element.
 * A short press without a move is a tap.
 * @param {HTMLElement} node
 * @param {{onTap?: Function, onStart?: Function, onMove?: Function, onEnd?: Function, enabled?: Function}} handlers
 *   onMove and onEnd get (x, y, event) in client coordinates.
 */
export function draggable(node, { onTap, onStart, onMove, onEnd, enabled = () => true }) {
  let drag = null;
  node.style.touchAction = 'none';
  node.addEventListener('pointerdown', (e) => {
    if (drag || !enabled() || e.button > 0) return;
    e.preventDefault();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    node.setPointerCapture?.(e.pointerId);
  });
  node.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) {
      drag.moved = true;
      node.classList.add('is-dragging');
      onStart?.(drag.x, drag.y, e);
    }
    if (drag.moved) onMove?.(e.clientX, e.clientY, e);
  });
  const finish = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    node.classList.remove('is-dragging');
    if (d.moved) onEnd?.(e.clientX, e.clientY, e, cancelled);
    else if (!cancelled) onTap?.(e);
  };
  node.addEventListener('pointerup', (e) => finish(e, false));
  node.addEventListener('pointercancel', (e) => finish(e, true));
}

/** Find the element under a point, but not the dragged element. */
export function elementBelow(x, y, dragged) {
  const old = dragged.style.pointerEvents;
  dragged.style.pointerEvents = 'none';
  const hit = document.elementFromPoint(x, y);
  dragged.style.pointerEvents = old;
  return hit;
}
