// Pictures by id. The list is in data/images.json. The source of each file is in credits.json.

let files = {};
const svgCache = new Map();

export async function loadImages() {
  try {
    files = await (await fetch('data/images.json')).json();
  } catch {
    files = {};
  }
}

export function imageFile(id) {
  return files[id] || '';
}

/** Make an <img> for a picture. The text key of the name is pic.<id>. */
export function picture(id, className = '') {
  const img = document.createElement('img');
  img.src = imageFile(id);
  img.alt = '';
  img.draggable = false;
  img.className = `pic ${className}`;
  return img;
}

/** Get the text of an SVG file. The result stays in memory. */
export async function svgText(file) {
  if (!svgCache.has(file)) {
    svgCache.set(file, fetch(file).then((r) => {
      if (!r.ok) throw new Error(`Cannot load ${file}`);
      return r.text();
    }));
  }
  try {
    return await svgCache.get(file);
  } catch (err) {
    svgCache.delete(file);
    throw err;
  }
}
