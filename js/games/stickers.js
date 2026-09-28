// The sticker book (Sổ nhãn dán). The child gets a sticker for each star,
// and puts the stickers on a scene. The scenes are saved in localStorage.

import { t } from '../core/i18n.js';
import { speak } from '../core/speech.js';
import { sfx } from '../core/sound.js';
import { el, onTap } from '../core/ui.js';
import { icons } from '../core/icons.js';
import { draggable } from '../core/drag.js';
import { picture } from '../core/images.js';
import { backdrops } from '../core/story.js';
import { totalStars, getStickerBook, saveStickerBook } from '../core/state.js';
import {
  STICKERS, SCENES, unlocked, placeSticker, moveSticker, removeSticker,
} from '../logic/stickers.js';

export function mount(screen) {
  let scene = SCENES[0];
  const board = el('div', { class: 'sticker-board' });
  const tray = el('div', { class: 'sticker-tray' });
  const scenes = el('div', { class: 'sticker-scenes' });
  screen.stage.replaceChildren(el('div', { class: 'sticker-layout' }, [board, el('div', { class: 'sticker-side' }, [scenes, tray])]));

  function sceneButtons() {
    scenes.replaceChildren(...SCENES.map((s) => {
      const b = el('button', { class: `icon-btn scene-btn ${s === scene ? 'is-on' : ''}`, html: `<svg viewBox="0 0 400 260">${backdrops[s]()}</svg>`, attrs: { type: 'button', 'aria-label': t(`stickers.scene.${s}`) } });
      onTap(b, () => {
        scene = s;
        sfx.tap();
        draw();
        speak(`stickers.scene.${s}`);
      });
      return b;
    }));
  }

  function relative(x, y) {
    const r = board.getBoundingClientRect();
    return { x: (x - r.left) / r.width, y: (y - r.top) / r.height, inside: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom };
  }

  function drawPlaced() {
    board.querySelectorAll('.sticker-placed').forEach((n) => n.remove());
    for (const p of getStickerBook().scenes[scene]) {
      const node = el('div', { class: 'sticker-placed', attrs: { role: 'button', 'aria-label': t(`pic.${p.id}`) } }, [picture(p.id)]);
      node.style.left = `${p.x * 100}%`;
      node.style.top = `${p.y * 100}%`;
      let start = null;
      draggable(node, {
        onTap: () => speak(`pic.${p.id}`),
        onStart: (x, y) => { start = { x, y }; },
        onMove: (x, y) => { node.style.transform = `translate(calc(-50% + ${x - start.x}px), calc(-50% + ${y - start.y}px))`; },
        onEnd: (x, y) => {
          const r = relative(x, y);
          saveStickerBook(r.inside ? moveSticker(getStickerBook(), scene, p.key, r.x, r.y) : removeSticker(getStickerBook(), scene, p.key));
          sfx.snap();
          drawPlaced();
        },
      });
      board.append(node);
    }
  }

  function drawTray() {
    const have = unlocked(totalStars());
    tray.replaceChildren();
    for (const id of have) {
      const item = el('div', { class: 'choice sticker-item', attrs: { role: 'button', 'aria-label': t(`pic.${id}`) } }, [picture(id)]);
      let ghost = null;
      draggable(item, {
        onTap: () => speak(`pic.${id}`),
        onStart: () => {
          ghost = el('div', { class: 'sticker-ghost' }, [picture(id)]);
          document.body.append(ghost);
        },
        onMove: (x, y) => {
          ghost.style.left = `${x}px`;
          ghost.style.top = `${y}px`;
        },
        onEnd: (x, y) => {
          ghost?.remove();
          ghost = null;
          const r = relative(x, y);
          if (!r.inside) return;
          saveStickerBook(placeSticker(getStickerBook(), scene, id, r.x, r.y));
          sfx.pop();
          speak(`pic.${id}`);
          drawPlaced();
        },
      });
      tray.append(item);
    }
    // The next sticker shows as a gray place with a star. A star opens it.
    if (have.length < STICKERS.length) tray.append(el('div', { class: 'sticker-locked', html: icons.star }));
  }

  function draw() {
    board.innerHTML = `<svg viewBox="0 0 400 260" class="sticker-scene" aria-hidden="true">${backdrops[scene]()}</svg>`;
    sceneButtons();
    drawPlaced();
  }

  draw();
  drawTray();
  screen.say(['stickers.intro']);
  return () => {
    document.querySelectorAll('.sticker-ghost').forEach((n) => n.remove());
  };
}
