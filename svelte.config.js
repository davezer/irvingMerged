import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // Optional, but nice defaults:
      // - Enables Node-ish APIs where supported (Buffer, process, etc.)
      // - If you don’t need them, you can remove this.
      platformProxy: {
        enabled: true
      }
    })
  }
};

export default config;