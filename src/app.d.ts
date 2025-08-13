// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      isAuthenticated: boolean;
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}

export {};