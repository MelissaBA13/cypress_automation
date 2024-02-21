const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 6000,
  pageLoadTimeout: 3000,
  reporter: 'mochawesome',
  retries: {
    runMode: 1,
  },
  env: {
    baseUrl: 'http://localhost:8080/parabank',
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/integration/test/parabank*.js'
  },
});
