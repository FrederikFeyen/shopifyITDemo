const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'umd8pe',
  e2e: {
  
    baseUrl: 'https://r0757870-realbeans.myshopify.com/', 
    chromeWebSecurity: false, // Prevents cross-origin errors during Shopify checkout/login workflows
    viewportWidth: 1280,
    viewportHeight: 720,
    supportFile: false, // Disable default support file to avoid conflicts with Shopify's global scripts
    setupNodeEvents(on, config) {
      // Node events configuration can go here if needed later
    },
  },
});