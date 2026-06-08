// Shared validation contract for the "message me?" contact form. Imported by
// both the client (message-mode) and the server (api/message) so the gate the
// user sees and the gate the server enforces can never drift apart — a looser
// client would let someone hit "send it?" only to get a confusing 400.
export const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LEN = 200;
export const MAX_NAME_LEN = 100;
export const MAX_BODY_LEN = 5000;
