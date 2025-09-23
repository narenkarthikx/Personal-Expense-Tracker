module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Preparing Netlify build environment for Next.js + pnpm...');
  },
  onBuild: ({ utils }) => {
    console.log('Build complete! Preparing for Netlify deployment...');
  },
  onPostBuild: ({ utils }) => {
    console.log('Post-build optimizations complete!');
  }
};
