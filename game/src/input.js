// Keyboard and mouse input: the mouse aims the beacon beam, a click or Space fires
// the pulse, and the keys below start, pause, mute and restart. The aim is reported
// in logical field coordinates, so the caller never deals with the canvas scale.

export const ACTION_CONFIRM = 1;
export const ACTION_PULSE = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

export function createInput(canvas, field) {
  let aimX = field.width / 2;
  let aimY = 40;
  let actions = 0;
  let mouseDown = false;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / field.width, rect.height / field.height);
    const offsetX = (rect.width - field.width * scale) / 2;
    const offsetY = (rect.height - field.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toField(event);
    aimX = point.x;
    aimY = point.y;
  });

  canvas.addEventListener('mousedown', (event) => {
    const point = toField(event);
    aimX = point.x;
    aimY = point.y;
    mouseDown = true;
    actions |= ACTION_PULSE | ACTION_CONFIRM;
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM | ACTION_PULSE;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_RESTART;
    }
  });

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  function aimAngle(fromX, fromY) {
    return Math.atan2(aimY - fromY, aimX - fromX);
  }

  return { takeActions, aimAngle, isMouseDown: () => mouseDown };
}
