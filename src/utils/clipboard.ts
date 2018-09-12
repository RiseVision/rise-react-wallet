export function copyToClipboard(value: string) {
  const selection = document.getSelection();

  // Persist current user selection
  const ranges = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  const el = document.createElement('textarea');
  el.value = value;
  el.setAttribute('readonly', '');
  el.setAttribute('aria-hidden', 'true');
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.position = 'absolute';
  el.style.top = '0px';
  el.style.right = '0px';
  document.body.appendChild(el);

  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);

  // Restore previous selection
  if (ranges.length > 0) {
    selection.removeAllRanges();
    for (let i = 0; i < ranges.length; i++) {
      selection.addRange(ranges[i]);
    }
  }
}
