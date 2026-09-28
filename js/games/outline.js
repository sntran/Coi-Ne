// Change a flat SVG picture into a coloring outline.
// Each large shape becomes one tap area with a white fill and a dark stroke.
// Each small shape becomes a detail that the child cannot tap.

export const OUTLINE_COLOR = '#3b2a2a';
export const MAX_AREAS = 12;
// A shape is small when its smaller side is less than this part of the picture size.
export const MIN_SIDE = 0.09;

const SHAPE_SELECTOR = 'path,circle,ellipse,rect,polygon,polyline,line';
const REMOVE_SELECTOR = [
  'defs', 'linearGradient', 'radialGradient', 'pattern', 'filter', 'mask',
  'clipPath', 'style', 'script', 'title', 'desc', 'metadata', 'foreignObject',
  'image', 'text', 'use', 'symbol',
].join(',');
const REMOVE_ATTRS = [
  'style', 'class', 'filter', 'mask', 'clip-path', 'opacity', 'fill-opacity',
  'stroke-opacity', 'stroke-dasharray',
];

function parseColor(value) {
  if (!value || value === 'none' || value.startsWith('url(')) return null;
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return value === 'white' ? [255, 255, 255] : [0, 0, 0];
  let h = hex[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function lightness(rgb) {
  if (!rgb) return 1;
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

// Find the fill that a shape gets from itself or from its parent groups.
function ownFill(el) {
  for (let node = el; node && node.getAttribute; node = node.parentNode) {
    const fill = node.getAttribute('fill');
    if (fill) return fill;
  }
  return '#000000';
}

/**
 * Make an outline SVG element from SVG text.
 * The function must attach the SVG to the document to measure the shapes.
 * @param {string} svgText
 * @param {HTMLElement} host an element in the document that holds the result
 * @returns {{svg: SVGSVGElement, areas: SVGElement[], details: SVGElement[]}}
 */
export function makeOutline(svgText, host) {
  const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const source = parsed.documentElement;
  const svg = document.importNode(source, true);
  svg.querySelectorAll(REMOVE_SELECTOR).forEach((el) => el.remove());
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('style');
  svg.setAttribute('class', 'outline-picture');

  const shapes = [...svg.querySelectorAll(SHAPE_SELECTOR)];
  const info = shapes.map((el) => ({
    el,
    fill: ownFill(el),
    stroke: el.getAttribute('stroke'),
  }));
  svg.querySelectorAll('*').forEach((el) => {
    REMOVE_ATTRS.forEach((a) => el.removeAttribute(a));
    el.removeAttribute('fill');
    el.removeAttribute('stroke');
  });

  host.replaceChildren(svg);
  const box = svg.getBoundingClientRect();
  const size = Math.max(1, Math.min(box.width, box.height));

  const areas = [];
  const details = [];
  for (const { el, fill, stroke } of info) {
    const r = el.getBoundingClientRect();
    const side = Math.min(r.width, r.height) / size;
    const hasFill = fill !== 'none';
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    el.setAttribute('stroke', OUTLINE_COLOR);
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-linecap', 'round');
    if (!hasFill) {
      // A line in the picture. Keep it as a dark line.
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke-width', stroke ? '3' : '0');
      el.classList.add('outline-detail');
      details.push(el);
    } else if (side < MIN_SIDE) {
      const dark = lightness(parseColor(fill)) < 0.4;
      el.setAttribute('fill', dark ? OUTLINE_COLOR : '#ffffff');
      el.setAttribute('stroke-width', '2');
      el.classList.add('outline-detail');
      details.push(el);
    } else {
      el.setAttribute('fill', '#ffffff');
      el.setAttribute('stroke-width', '3.5');
      el.classList.add('outline-area');
      el.dataset.area = String(areas.length);
      areas.push(el);
    }
  }
  return { svg, areas, details };
}
