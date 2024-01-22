const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // env: {"baseURL": "http://localhost:8080/parabank/services_proxy/bank/"},
    specPattern: 'cypress/integration/test/parabank*.js'

  },
});
