/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/vite': {},
    '@csstools/postcss-oklab-function': { preserve: true },
  },
};

export default config;
