import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/mapify.js',
      format: 'iife',
      name: 'MapifyOS',
      globals: {
        'leaflet': 'L'
      }
    },
    {
      file: 'dist/mapify.min.js',
      format: 'iife',
      name: 'MapifyOS',
      plugins: [terser()],
      globals: {
        'leaflet': 'L'
      }
    }
  ],
  external: ['leaflet'],
  plugins: [
    resolve({
      browser: true
    }),
    commonjs()
  ]
};
