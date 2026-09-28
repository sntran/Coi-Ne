# Coi Nè

Coi Nè is a set of educational web games for children of 3 to 5 years old.
"Coi nè!" means "Look at this!". Small children say it when they find something new.

The site is at <https://sntran.github.io/Coi-Ne/>.

## Goal

The children in this family were born in the US. The parents were born in Vietnam. The games:

- Teach through curiosity and play.
- Teach the Vietnamese language and culture, with the traditional folk games that the parents played as children.
- Help the child connect Vietnamese and English. Vietnamese is the main language. English is a tap away.

The child does not have to read. The voice speaks each instruction. There are no timers, no lives,
no scores that go down, and no "game over" screen. A wrong answer gets a kind "Thử lại nha".

## How to play

1. Open the site. Tap the large red **Play** button. (iPad browsers speak only after a tap.)
2. The home screen shows Sỏi, the pebble, and one picture button for each game.
   The top group has the learning games. The bottom group has the folk games (Trò chơi dân gian).
3. Tap a game. The voice says the name of the game, and then the game opens.
4. In each game:
   - The **Home** button (the house) is at the top left.
   - The **speaker** button speaks the instruction again.
   - The small **EN** button on a picture, a word, a color, a number, or a shape speaks the Vietnamese word
     and then the English word. In English mode, the button is **VI**.
5. After 5 correct answers in a row, the child gets a star. If the game has a next level,
   Sỏi asks to play a harder level. The child taps the green check for yes, or the round arrow for no.

### Settings for parents

Hold the gear button on the home screen for 3 seconds. The settings let you change:

- The language: Vietnamese (the default) or English.
- The voice: on or off. When the voice is off, the games show the text with a speaker icon.
- The speech rate.
- The voice for Vietnamese and for English, if the device has more than one voice. Tap a voice to hear it.
- **Record your own voice** (see below).
- The level of each game.
- The **About** page: the goal of Coi Nè, and the source and license of each picture.

The settings also show if the device has a voice for Vietnamese and for English.
If a voice is missing, the games show the text with a speaker icon.
On an iPad, you can add a Vietnamese voice in **Settings → Accessibility → Spoken Content → Voices**.

## The games

### Learning games

| Game | Levels |
| --- | --- |
| Tô màu (Coloring) | Choose a picture in 6 groups. Tap a color, then tap an area. Undo, Clear, and Save. Saved pictures go to the Gallery. |
| Số đếm (Numbers) | 1: match a digit to a group. 2: count to 20. 3: which group has more or fewer. 4: add to 10. |
| Quy luật (Patterns) | 1–3: AB. 4–6: AAB and ABB. 7–9: ABC. Colors, then shapes, then sizes. |
| Ghép hình (Shape builder) | Drag shapes into an outline. Tap a shape to turn it. 2, then 4, then 6 shapes. |
| Phân loại (Sorting) | Drag things into boxes. 1: one rule. 2: two rules, for example "big and red". |
| Chữ cái (Letters) | 29 Vietnamese letters or 26 English letters. 1: listen. 2: find the first letter of a picture. 3: find the letter that Sỏi says. |
| Lật hình (Memory pairs) | 4, then 6, then 8, then 12 cards. |

### Folk games (Trò chơi dân gian)

Each folk game starts with a short picture story about children in a Vietnamese village.

| Game | Levels |
| --- | --- |
| Ô ăn quan | 1: practice sowing. 2: small game with 2 pebbles in each square. 3: full game. |
| Tập tầm vông | 1: 2 hands. 2: Sỏi moves the hands. 3: 3 cups. |
| Oẳn tù tì | Rock (búa), paper (bao), scissors (kéo) against Sỏi. |
| Chơi chuyền | 1: 1 stick for each throw. 2: 2 sticks. 3: 3 sticks. The ball waits for the child. |

### The rules of Ô ăn quan

The board has two rows of 5 squares and a large half-circle, the **quan**, at each end.
Each square starts with small pebbles (5 in the full game, 2 in the small game).
Each quan starts with one big stone. The big stone counts as 10 pebbles.
The child has the bottom row. Sỏi has the top row.

1. The player picks up all the pebbles from one square on the player's side and chooses a direction.
2. The player drops the pebbles one by one into the next squares, and into a quan when the pebbles go past it.
   The voice counts each pebble.
3. After the last pebble, look at the next square:
   - If it has pebbles, the player picks them up and continues (step 2).
   - If it is empty, and the square after it has pebbles (or a big stone), the player takes them.
     In the full game, the player takes again while an empty square comes before a full square.
   - If the next two squares are empty, or the next square is a quan, the turn ends.
4. At the start of a turn, if all 5 squares of a player are empty, the player puts one of the taken pebbles
   into each square. A player with too few pebbles borrows from the other player,
   and gives the pebbles back at the end.
5. The game ends when both quans are empty. Each player takes the pebbles that are still on the player's side.
   The voice counts the pebbles of each player. The result is kind to both players.

In practice mode (level 1), the child only sows. Nothing is taken, and Sỏi does not play.
Sỏi plays slowly and does not always choose the best move.

### The đồng dao texts

The đồng dao texts are in `lang/vi.json`:

- `dongdao.taptamvong`: Tập tầm vông.
- `dongdao.oantuti`: Oẳn tù tì.
- `dongdao.choichuyen.01` to `dongdao.choichuyen.28`: Chơi chuyền, one key for each line.
  Each throw of the ball sings the next line.

Ô ăn quan has no well-known đồng dao, so the game has none. The folk games always sing the đồng dao in
Vietnamese, also in English mode. `lang/en.json` has a simple English meaning of each line.

The texts come from common sources, for example the Chơi chuyền text from
[Trường mầm non Hoa Thủy Tiên](https://mnhoathuytien.hanoi.edu.vn/dong-dao-ve-cho-be/dong-dao-choi-chuyen/ctmb/6072/52370)
and the Tập tầm vông text from
[thivien.net](https://www.thivien.net/Khuy%E1%BA%BFt-danh-Vi%E1%BB%87t-Nam/T%E1%BA%ADp-t%E1%BA%A7m-v%C3%B4ng-tay-kh%C3%B4ng-tay-c%C3%B3/poem-37I5cYt0RfU-lRheaosBDg).
The parents must check the texts.

## Run the site on your computer

The site has no build step. Use a static server from the root of the repository:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000/>. The site uses only relative paths, so it works at the root of a server
and at `/Coi-Ne/` on GitHub Pages.

## Run the tests

The tests use the built-in Node test runner (Node 20 or later). There are no dependencies.

```sh
npm test
```

The tests check:

- The rules of Ô ăn quan: sowing, capture, the empty side rule, and the end of the game.
- The question rules of each game, the level progress, and save and load.
- That each key in `lang/vi.json` is also in `lang/en.json`, and the other way.
- That each picture has an entry in `credits.json`.
- That the service worker keeps all the files of the site.

## Deploy to GitHub Pages

The workflow `.github/workflows/pages.yml` runs on each push to `main`. It runs the tests first.
If a test fails, it does not deploy. Then it copies only the files of the site (not the tests, the tools,
or the workflow files) and deploys them with `actions/upload-pages-artifact` and `actions/deploy-pages`.

One time only: in the repository on GitHub, open **Settings → Pages**, and set **Source** to **GitHub Actions**.

## After you change a file

The service worker keeps all files in a cache, so that the site works offline after the first visit.
After you add, remove, or change a file of the site, run:

```sh
node tools/build-sw.js
```

This writes the list of files and a new version into `sw.js`. The tests fail if you forget it.

## Add pictures to the Coloring game

1. Use only flat SVG pictures with a clear license: Openclipart (CC0), Twemoji (CC BY 4.0), or Noto Emoji (Apache 2.0).
   You can also draw your own pictures.
2. Put the SVG file in `pictures/` (for example `pictures/twemoji/1f431.svg` or `pictures/vietnam/my-picture.svg`).
3. Add the picture to a group in `data/coloring.json`: `{ "id": "cat", "file": "pictures/twemoji/1f431.svg" }`.
4. Add an entry to `credits.json` with the title, the source URL, the author, the license, and the license URL.
   For your own picture, use `"source": "original"` and `"license": "original"`.
5. Add the name of the picture to both language files: `"pic.cat": "con mèo"` in `lang/vi.json` and
   `"pic.cat": "cat"` in `lang/en.json`.
6. Look at the picture: open <http://localhost:8000/tools/check-pictures.html>. Each picture must have
   12 tap areas or fewer, and no area that is too small for a finger. Remove bad pictures.
7. Run `node tools/build-sw.js` and `npm test`.

When the game loads a picture, it changes the picture to an outline. Each shape gets a white fill and a
thick dark stroke. The game removes gradients, filters, and shadows. Each large shape becomes one tap area.
A small shape (for example an eye) becomes a detail that the child cannot tap.

### Add a new group, for example Tết, Trung Thu, or an American holiday

1. Add a group to `data/coloring.json`: `{ "id": "tet", "cover": "<id of a picture>", "pictures": [...] }`.
2. Add the name of the group to both language files: `"coloring.group.tet": "Tết"`.
3. The group shows in the game. You do not have to change the code.

## Add your recorded voice

The voice of the device can have an accent that is not yours. For example, most Vietnamese voices
on devices have a Northern accent. Your own recordings replace the voice of the device.
`speak(key)` looks for a sound in this order:

1. A recording that you made in the app.
2. A recorded file in `audio/vi/` or `audio/en/`.
3. The voice of the device.

### Record in the app (easy)

1. Hold the gear button for 3 seconds to open the settings.
2. Tap **Ghi âm giọng của ba mẹ** (Record your own voice).
3. Choose the language. Open a group, for example **Câu hay dùng** (common phrases).
4. Tap the red button to record a text. Tap it again to stop. The app saves the recording at once and plays it.
   A green dot shows the texts that have a recording. The play button plays the text, and the trash button
   deletes the recording.

The recordings are in the IndexedDB storage of the browser on this device, because they are too large for
`localStorage`. They work offline. They do not go to other devices.
On an iPad or iPhone, add Coi Nè to the Home Screen (Share → Add to Home Screen), and use it from there.
If you do not, Safari can delete the data of a website that you do not open for 7 days.

### Add recorded files (for all devices)

1. Find the key of the text in `lang/vi.json` or `lang/en.json`, for example `praise.great` ("Giỏi quá!").
2. Record the text. Save it as `<key>.mp3`, for example `audio/vi/praise.great.mp3`.
   The files `.m4a`, `.ogg`, `.wav`, and `.webm` also work.
3. Run `node tools/audio-index.js`. This writes the list of files into `audio/vi/index.json` and `audio/en/index.json`.
4. Run `node tools/build-sw.js`, so that the recorded files also work offline.

Texts with a number or a name in them (for example `numbers.match`, "Tìm nhóm có {n} {t}.") always use
the voice of the device, because the sentence changes. The recorder does not show these texts.

## Southern Vietnamese

The Vietnamese texts use Southern words, for example "nha", "vô", "trái", "heo", "bắp", "thơm", "vớ",
"dù", "nón", "tô phở", "chén cơm", "lồng đèn", "trái banh", "lượm", and "ba mẹ".
The đồng dao texts are the traditional texts.

## Pictures and licenses

The About page in the app shows the source and the license of each picture. The full list is in `credits.json`.

- 10 original pictures in the Vietnam group, drawn for Coi Nè.
- 104 pictures from [Twemoji](https://github.com/jdecked/twemoji) v15.1.0 (graphics © Twitter, Inc and other
  contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). 50 of them are in the Coloring game.
- Sỏi, the story pictures, the icons, and the game buttons are original SVG drawings in the code.

## Privacy

There are no ads, no analytics, no cookies, no accounts, and no data collection.
The site sends no requests to other sites, except the one request for the Tailwind CSS script.
All saved data (settings, levels, and the Gallery) stays in the `localStorage` of the browser.

## Technology

- HTML, CSS, SVG, and JavaScript with native ES modules. No canvas, no build tool, no framework.
- Tailwind CSS 4 from the Play CDN (`@tailwindcss/browser`, fixed version 4.3.3).
- Pointer Events for tap and drag.
- The Web Speech API for the voice, and the Web Audio API for the sounds.
- The game rules are in `js/logic/`. These modules do not use the DOM, so the tests can use them.

## Files

| Path | Content |
| --- | --- |
| `index.html` | The page. It has no text. |
| `lang/vi.json`, `lang/en.json` | All the text of the app. |
| `js/app.js` | Start, the Play button, and the screens. |
| `js/core/` | Voice, sounds, Sỏi, the home screen, the settings, and shared parts. |
| `js/games/` | One module for each game. |
| `js/logic/` | The rules of the games, without the DOM. |
| `data/` | The picture list, the Coloring groups, and the letters. |
| `pictures/` | The picture files. |
| `audio/` | Recorded voice files. |
| `sw.js`, `manifest.webmanifest`, `icons/` | The PWA files. |
| `tests/` | The unit tests. |
| `tools/` | Tools for the parent. They are not part of the site. |
