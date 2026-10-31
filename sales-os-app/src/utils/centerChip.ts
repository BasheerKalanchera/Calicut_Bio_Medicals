// Scrolls a ChipTabs row so the chip with this id sits in the middle of it.
// The screen calls this with the ref it gave ChipTabs as barRef.
export function centerChip(container: HTMLElement | null, tabId: string, behavior: ScrollBehavior = "smooth") {
  if (!container) return;
  const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
  if (!chip) return;
  const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
  container.scrollTo({ left: scrollLeft, behavior });
}
