module.exports = {
  launch: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  server: {
    command: 'npm start',
    port: 80,
    launchTimeout: 10000,
    debug: false
  }
};
