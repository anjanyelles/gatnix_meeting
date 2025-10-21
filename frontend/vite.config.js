// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// // Change these values if needed
// const BACKEND_URL = 'http://192.168.1.2:5001'; // 👈 your backend system’s LAN IP & port

// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     esbuildOptions: {
//       define: {
//         global: 'globalThis', // Polyfill "global" for browser
//       },
//       // Uncomment if needed for Node globals
//       // plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
//     },
//   },
//   server: {
//     host: '0.0.0.0', // 👈 allows other devices to access the dev server
//     port: 5173,
//     strictPort: true,
//     proxy: {
//       '/api': {
//         target: BACKEND_URL,
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import os from 'os';

// Detect local LAN IP dynamically
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const LAN_IP = getLocalIP();
const BACKEND_URL = `http://${LAN_IP}:5001`;

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

