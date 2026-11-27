// Date-and-time boxes always open in the centre (`MobileDateTimePicker`): the
// box attached to its field ran under the taskbar on short laptop screens.
// Their large date-and-time header is hidden on every screen: its mixed text
// sizes looked uneven, and without it the box fits short screens.
// Pass as `slotProps.toolbar`.
export const DATE_TIME_TOOLBAR = { hidden: true };
