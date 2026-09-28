// Game 1: Coloring (Tô màu).
// Views: the groups, the pictures of a group, the coloring page, and the Gallery.

import { t } from '../core/i18n.js';
import { speak } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap, iconButton, langBadge, celebrate, confirmDialog, burst } from '../core/ui.js';
import { icons } from '../core/icons.js';
import { picture, svgText } from '../core/images.js';
import { getGallery, putInGallery, deleteFromGallery } from '../core/state.js';
import { makeOutline } from './outline.js';
import { PALETTE, WHITE } from '../logic/colors.js';
import {
  createColoring, fillArea, clearAll, undo, canUndo, isComplete, findPicture, findGroup,
} from '../logic/coloring.js';

let catalogPromise = null;
function loadCatalog() {
  catalogPromise ||= fetch('data/coloring.json').then((r) => r.json());
  return catalogPromise;
}

function go(path) {
  location.hash = `#/play/coloring${path ? `/${path}` : ''}`;
}

function toolButton(icon, labelKey, fn) {
  return iconButton(icon, labelKey, fn, 'tool-btn');
}

/** A picture button with its colored picture and an EN button. */
function pictureButton(id, onPick) {
  const b = el('button', { class: 'choice pic-choice', attrs: { type: 'button', 'aria-label': t(`pic.${id}`) } }, [
    picture(id),
    langBadge(`pic.${id}`),
  ]);
  onTap(b, () => onPick(id, b));
  return b;
}

async function showGroups(screen) {
  const catalog = await loadCatalog();
  screen.tools.replaceChildren(toolButton('gallery', 'coloring.gallery', () => go('gallery')));
  const grid = el('div', { class: 'choice-grid' });
  for (const g of catalog.groups) {
    const b = el('button', { class: 'choice group-choice', attrs: { type: 'button', 'aria-label': t(`coloring.group.${g.id}`) } }, [
      picture(g.cover),
      langBadge(`coloring.group.${g.id}`),
    ]);
    onTap(b, async () => {
      sfx.tap();
      await speak(`coloring.group.${g.id}`);
      go(`group/${g.id}`);
    });
    grid.append(b);
  }
  screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
  screen.say('coloring.chooseGroup');
}

async function showGroup(screen, groupId) {
  const catalog = await loadCatalog();
  const group = findGroup(catalog, groupId);
  if (!group) return go('');
  screen.tools.replaceChildren(
    toolButton('pictures', 'coloring.groups', () => go('')),
    toolButton('gallery', 'coloring.gallery', () => go('gallery')),
  );
  const grid = el('div', { class: 'choice-grid' });
  for (const p of group.pictures) {
    grid.append(pictureButton(p.id, async (id) => {
      sfx.tap();
      await speak(`pic.${id}`);
      go(`pic/${id}`);
    }));
  }
  screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
  screen.say(['coloring.choosePicture']);
}

async function showGallery(screen) {
  const catalog = await loadCatalog();
  screen.tools.replaceChildren(toolButton('pictures', 'coloring.groups', () => go('')));
  const items = getGallery();
  if (!items.length) {
    screen.stage.replaceChildren(el('div', { class: 'empty-note' }, [el('div', { class: 'empty-icon', html: icons.gallery })]));
    screen.say('coloring.galleryEmpty');
    return;
  }
  const grid = el('div', { class: 'choice-grid gallery-grid' });
  screen.stage.replaceChildren(el('div', { class: 'scroll-area' }, [grid]));
  for (const item of items) {
    const pic = findPicture(catalog, item.picture);
    if (!pic) continue;
    const host = el('div', { class: 'thumb-host' });
    const b = el('button', { class: 'choice gallery-item', attrs: { type: 'button', 'aria-label': t(`pic.${pic.id}`) } }, [host]);
    const remove = iconButton('clear', 'coloring.delete', async () => {
      if (await confirmDialog('coloring.deleteConfirm', 'clear')) {
        deleteFromGallery(item.id);
        showGallery(screen);
      }
    }, 'thumb-delete');
    remove.addEventListener('pointerdown', (e) => e.stopPropagation());
    const cell = el('div', { class: 'gallery-cell' }, [b, remove]);
    onTap(b, () => go(`edit/${item.id}`));
    grid.append(cell);
    svgText(pic.file).then((text) => {
      const { areas } = makeOutline(text, host);
      areas.forEach((a, i) => { if (item.fills[i]) a.setAttribute('fill', item.fills[i]); });
    }).catch(() => {});
  }
  screen.say('coloring.galleryOpen');
}

async function showCanvas(screen, pictureId, galleryId) {
  const catalog = await loadCatalog();
  const saved = galleryId ? getGallery().find((g) => g.id === galleryId) : null;
  const pic = findPicture(catalog, saved ? saved.picture : pictureId);
  if (!pic) return go('');
  let state = createColoring(saved ? saved.fills : {});
  let editingId = saved ? saved.id : null;
  let current = PALETTE[0];
  let praised = false;

  const host = el('div', { class: 'canvas-host', attrs: { role: 'img', 'aria-label': t(`pic.${pic.id}`) } });
  const palette = el('div', { class: 'palette', attrs: { role: 'group', 'aria-label': t('coloring.palette') } });
  const nameBadge = el('div', { class: 'picture-name' }, [langBadge(`pic.${pic.id}`)]);
  const board = el('div', { class: 'canvas-wrap' }, [el('div', { class: 'canvas-frame' }, [host, nameBadge])]);
  screen.stage.replaceChildren(el('div', { class: 'coloring-layout' }, [board, palette]));

  const undoBtn = toolButton('undo', 'coloring.undo', () => {
    state = undo(state);
    sfx.tap();
    paint();
  });
  const clearBtn = toolButton('clear', 'coloring.clear', async () => {
    if (!Object.keys(state.fills).length) return;
    if (await confirmDialog('coloring.clearConfirm', 'clear')) {
      state = clearAll(state);
      paint();
    }
  });
  const saveBtn = toolButton('save', 'coloring.save', () => {
    const entry = putInGallery({ id: editingId, picture: pic.id, fills: state.fills });
    editingId = entry.id;
    sfx.happy();
    burst(saveBtn);
    speak('coloring.saved');
  });
  screen.tools.replaceChildren(toolButton('pictures', 'coloring.groups', () => go(`group/${pic.group}`)));

  const buttons = PALETTE.map((c) => {
    const b = el('button', {
      class: `swatch ${c.hex === WHITE ? 'swatch-white' : ''}`,
      attrs: { type: 'button', 'aria-label': t(`color.${c.id}`), 'aria-pressed': 'false' },
      style: { '--swatch': c.hex },
    });
    if (c.hex === WHITE) b.innerHTML = icons.eraser;
    onTap(b, () => {
      current = c;
      sfx.tap();
      mark();
      speak(`color.${c.id}`);
    });
    palette.append(b);
    return b;
  });
  let badge = null;
  function mark() {
    buttons.forEach((b, i) => {
      const on = PALETTE[i] === current;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    badge?.remove();
    badge = langBadge(`color.${current.id}`);
    buttons[PALETTE.indexOf(current)].append(badge);
  }

  let areas = [];
  function paint() {
    areas.forEach((a, i) => a.setAttribute('fill', state.fills[i] || WHITE));
    undoBtn.disabled = !canUndo(state);
    undoBtn.classList.toggle('is-off', !canUndo(state));
  }

  try {
    const text = await svgText(pic.file);
    ({ areas } = makeOutline(text, host));
  } catch {
    host.replaceChildren(picture(pic.id));
  }
  mark();
  paint();
  // On a small screen, put the tools under the colors. On a large screen, put them in the top bar.
  const compact = matchMedia('(max-width: 600px), (max-height: 560px)');
  const placeTools = () => {
    (compact.matches ? palette : screen.tools).append(undoBtn, clearBtn, saveBtn);
  };
  placeTools();
  compact.addEventListener('change', placeTools);

  host.addEventListener('pointerup', (e) => {
    const area = e.target.closest?.('.outline-area');
    if (!area) return;
    const index = Number(area.dataset.area);
    const before = state;
    state = fillArea(state, index, current.hex);
    if (state === before) return;
    sfx.pop();
    area.classList.remove('just-filled');
    void area.getBoundingClientRect();
    area.classList.add('just-filled');
    paint();
    if (!praised && isComplete(state.fills, areas.length)) {
      praised = true;
      celebrate(host, ['coloring.beautiful', 'coloring.saveHint']);
    }
  });

  screen.say(saved ? ['coloring.continue'] : [
    { key: 'soi.look' }, { key: `pic.${pic.id}` }, { key: 'coloring.instruction' },
  ]);
  return () => compact.removeEventListener('change', placeTools);
}

export function mount(screen, { path }) {
  const [view, arg] = path.split('/');
  let cleanup = null;
  const run = async () => {
    if (view === 'group') await showGroup(screen, arg);
    else if (view === 'pic') cleanup = await showCanvas(screen, arg, null);
    else if (view === 'edit') cleanup = await showCanvas(screen, null, arg);
    else if (view === 'gallery') await showGallery(screen);
    else await showGroups(screen);
  };
  run();
  return () => cleanup?.();
}
