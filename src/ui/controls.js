import { LAYERS } from './layers.js';

export function buildControls(host, canvas) {
  const bar = element('div', 'controls');
  const canvasHost = element('div', 'canvas');
  const status = element('div', 'status');
  host.append(bar, canvasHost, status);

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

  let shown = '';
  return {
    canvasHost,
    showNotes(notes) {
      if (notes.join('\n') === shown) return;
      shown = notes.join('\n');
      status.replaceChildren(...notes.map((note) => element('div', note.includes('error:') ? 'error' : '', note)));
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
