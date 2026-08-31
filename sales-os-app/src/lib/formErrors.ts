// Thrown by an onSubmit handler that already showed its own inline warning
// (e.g. CustomerDirectoryScreen's duplicate-hospital box) -- tells FormModal
// to keep the dialog open without also showing its own generic error Alert
// on top of it. Any other thrown error still gets FormModal's normal
// generic Alert.
export class SilentModalError extends Error {}
