import { LAYERS } from './layers.js';
import { COLORS, css } from './draw.js';

const LEGEND = [
  { key: 'sensor', label: 'sensor q', shape: 'dot', color: COLORS.sensor },
  { key: 'visible', label: 'visible region V(q)', shape: 'box', color: COLORS.visible },
  { key: 'grid', label: 'visible (brute force)', shape: 'dot small', color: COLORS.gridSeen },
  { key: 'grid', label: 'hidden (brute force)', shape: 'dot small', color: COLORS.gridHidden },
  { key: 'mirror', label: 'mirror e', shape: 'bar', color: COLORS.mirror },
  { key: 'mirrorView', label: 'mirror image q′', shape: 'ring', color: COLORS.mirrorImage },
  { key: 'mirrorView', label: 'seen through the mirror', shape: 'box', color: COLORS.mirrorView },
  { key: 'klink', label: 'k-link region', shape: 'box', color: COLORS.klink },
  { key: 'windows', label: 'windows', shape: 'bar', color: COLORS.window },
];

export function buildControls(host, canvas) {
  const bar = element('div', 'controls');
  const canvasHost = element('div', 'canvas');
  const todoNote = element('div', 'todo-note');
  const legend = element('div', 'legend');
  const status = element('div', 'status');
  canvasHost.append(todoNote);
  host.append(bar, canvasHost, legend, status);

  const legendItems = [];
  for (const { key, label, shape, color } of LEGEND) {
    if (!canvas.has(key)) continue;
    const item = element('span', shape, label);
    item.style.setProperty('--swatch', css(color));
    legend.append(item);
    legendItems.push({ key, item });
  }

  const update = (change) => {
    change();
    canvas.redraw();
  };

  if (canvas.has('edit')) {
    bar.append(button('Draw a new room', () => update(() => canvas.startDrawing())));
    bar.append(button('Example room', () => update(() => canvas.loadExample())));
  }
  if (canvas.has('mirror')) bar.append(button('Next mirror wall', () => canvas.scene.nextMirror()));
  if (canvas.has('klink')) bar.append(slider('k', 1, 6, canvas.k, (k) => update(() => { canvas.k = k; })));

  const toggles = [{ key: 'mirror', label: 'Mirror' }, ...LAYERS];
  for (const { key, label } of toggles) {
    if (!canvas.canToggle(key)) continue;
    bar.append(checkbox(label, canvas.on[key], (on) => update(() => { canvas.on[key] = on; })));
  }

  let shownNotes = '';
  let shownTodos = '';
  return {
    canvasHost,
    showNotes(notes) {
      for (const { key, item } of legendItems) item.hidden = !canvas.on[key];
      if (notes.join('\n') === shownNotes) return;
      shownNotes = notes.join('\n');
      status.replaceChildren(...notes.map((note) => element('div', note.includes('error:') ? 'error' : '', note)));
    },
    showTodos(todos) {
      if (todos.join('\n') === shownTodos) return;
      shownTodos = todos.join('\n');
      todoNote.replaceChildren(
        ...todos.map((todo) => {
          const line = element('p');
          line.append(element('b', '', 'To do:'), ` ${todo}`);
          return line;
        }),
      );
    },
  };
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(label, onClick) {
  const node = element('button', '', label);
  node.addEventListener('click', () => {
    onClick();
    node.blur();
  });
  return node;
}

function checkbox(label, checked, onChange) {
  const input = element('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const node = element('label');
  node.append(input, ` ${label}`);
  return node;
}

function slider(label, min, max, value, onChange) {
  const input = element('input');
  Object.assign(input, { type: 'range', min, max, value });
  const text = element('span', '', `${label} = ${value}`);
  input.addEventListener('input', () => {
    text.textContent = `${label} = ${input.value}`;
    onChange(Number(input.value));
  });
  const node = element('label');
  node.append(text, input);
  return node;
}
