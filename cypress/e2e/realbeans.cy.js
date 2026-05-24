describe('RealBeans Shopify Quality Assurance Suite', () => {
  const storePassword = Cypress.env('shopify_password');

  // Shared login function to ensure consistency
  const loginIfNecessary = () => {
    cy.get('body').then(($body) => {
      const passwordField = $body.find('input[type="password"], #password, [name="password"], .password-login input');
      if (passwordField.length > 0 && passwordField.is(':visible')) {
        cy.wrap(passwordField).first().type(`${storePassword}{enter}`, { log: false, force: true });
        cy.get('header, nav, main, #MainContent', { timeout: 15000 }).should('exist');
      }
    });
  };

  beforeEach(() => {
    // Basic visit to the home page with safety checks
    cy.visit('/', { failOnStatusCode: false });
    loginIfNecessary();
  });

  it('1. Verify Homepage Layout and Corporate Intro Text', () => {
    cy.visit('/', { failOnStatusCode: false });
    
    // Check for core text - very broad regex to handle theme variations
    cy.contains(/Since 1801|RealBeans has roasted premium coffee/i, { timeout: 15000 })
      .should('be.visible');
  });

  it('2. Verify Custom About Page and Heritage Paragraph', () => {
    // Try both common Shopify about page paths
    cy.visit('/pages/about', { failOnStatusCode: false });
    
    cy.get('body').then(($body) => {
      if ($body.text().includes('404')) {
        cy.visit('/pages/about-us', { failOnStatusCode: false });
      }
    });

    cy.contains(/Antwerp grocery|European coffee staple/i, { timeout: 15000 })
      .should('exist');
  });

  it('3. Verify Catalog Item Displays and Product Detail Integrity', () => {
    // Use failOnStatusCode: false to prevent the test from crashing if Shopify returns a transient error
    cy.visit('/collections/all', { failOnStatusCode: false });
    
    // Ensure the catalog actually loaded
    cy.get('body').should('not.contain', '404 Not Found');

    // Broadest possible selector for product links in any Shopify theme
    const productLinkSelector = 'a[href*="/products/"]';
    
    cy.get(productLinkSelector, { timeout: 15000 })
      .should('have.length.at.least', 1)
      .first()
      .click({ force: true });

    // Validate product page essentials
    cy.get('h1').should('not.be.empty');
    cy.get('img').should('have.length.at.least', 1);
  });

  it('4. Verify Interactive Catalog Sorting Re-orders Items', () => {
    cy.visit('/collections/all', { failOnStatusCode: false });
    
    // Common title selectors for Dawn, Debut, and other themes
    const titleSelector = '.card__heading, .product-card__title, h3 a, .grid-view-item__title, .product-item__title, .collection-product-card__title';
    
    cy.get(titleSelector).first().then(($initialProduct) => {
      const originalTitleText = $initialProduct.text().trim();

      // Look for the sort dropdown - handle multiple common IDs/Names (e.g. desktop and mobile)
      cy.get('#SortBy, [name="sort_by"], .collection-filters__sort select').then(($select) => {
        if ($select.length > 0) {
          // Use .first() because Shopify themes often have separate selects for mobile/desktop
          cy.wrap($select).first().select('price-ascending', { force: true });
          
          // Wait for content update
          cy.wait(3000); 

          cy.get(titleSelector).first().then(($newProduct) => {
            const sortedTitleText = $newProduct.text().trim();
            
            cy.get(titleSelector).its('length').then(len => {
              if (len > 1) {
                expect(originalTitleText).to.not.equal(sortedTitleText);
              }
            });
          });
        }
      });
    });
  });
});