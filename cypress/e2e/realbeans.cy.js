describe('RealBeans Shopify Quality Assurance Suite', () => {
  const storePassword = Cypress.env('shopify_password');

  beforeEach(() => {
    // Navigate to the store
    cy.visit('/');
    
    // Explicitly wait for the body to ensure we are on a page
    cy.get('body', { timeout: 15000 }).then(($body) => {
      // Look for the password field
      const passwordField = $body.find('input[type="password"], #password, [name="password"], .password-login input');
      
      if (passwordField.length > 0) {
        cy.log('Password barrier detected, logging in...');
        
        // Handle themes that hide the password field behind a link/modal
        const enterUsingPasswordLink = $body.find('a[href*="/password"], .password-link, [href="#LoginModal"], .js-modal-open-login-modal');
        
        if (enterUsingPasswordLink.length > 0 && !passwordField.is(':visible')) {
          cy.wrap(enterUsingPasswordLink).first().click({ force: true });
        }

        // Use force: true to ensure typing happens even if Cypress thinks it's hidden/covered
        cy.wrap(passwordField).first().type(`${storePassword}{enter}`, { log: false, force: true });
        
        // Wait for the main page to load after login - broadened selectors
        cy.get('header, nav, main, #MainContent, [id*="Main"], .shopify-section', { timeout: 15000 }).should('exist');
      }
    });
  });

  it('1. Verify Homepage Layout and Corporate Intro Text', () => {
    cy.visit('/');
    
    // Use regex and ignore case for the corporate text
    cy.contains(/Since 1801, RealBeans has roasted premium coffee/i, { timeout: 10000 })
      .should('be.visible');
      
    cy.get('main, .grid, .product-grid, [class*="product-grid"], .shopify-section').should('exist');
  });

  it('2. Verify Custom About Page and Heritage Paragraph', () => {
    // Some Shopify stores use /pages/about-us or /pages/about
    cy.visit('/pages/about'); 
    
    // Check for the heritage text with regex
    cy.contains(/From a small Antwerp grocery to a European coffee staple/i, { timeout: 15000 })
      .should('exist');
  });

  it('3. Verify Catalog Item Displays and Product Detail Integrity', () => {
    cy.visit('/collections/all');
    
    // Broadened selectors for collection items
    const productLinkSelector = '.card__heading a, .product-card__link, h3 a, .grid-view-item__link, .product-item__link, a[href*="/products/"]';
    
    cy.get(productLinkSelector, { timeout: 15000 })
      .should('have.length.at.least', 1);

    // Use force: true to click the product link in case of theme overlays
    cy.get(productLinkSelector).first().click({ force: true });

    // Validate product page essentials
    cy.get('h1').should('not.be.empty');
    
    // Ensure at least one image exists on the product page
    cy.get('img').should('have.length.at.least', 1);
  });

  it('4. Verify Interactive Catalog Sorting Re-orders Items', () => {
    cy.visit('/collections/all');
    
    const titleSelector = '.card__heading, .product-card__title, h3 a, .grid-view-item__title, .product-item__title';
    
    cy.get(titleSelector).first().then(($initialProduct) => {
      const originalTitleText = $initialProduct.text().trim();

      // Shopify sorting selector
      cy.get('#SortBy, [name="sort_by"]').select('price-ascending', { force: true }); 
      
      // Wait for URL change or content update
      cy.url().should('include', 'sort_by=price-ascending');
      cy.wait(3000); // Increased buffer for DOM re-render

      cy.get(titleSelector).first().then(($newProduct) => {
        const sortedTitleText = $newProduct.text().trim();
        
        cy.get(titleSelector).its('length').then(len => {
          if (len > 1) {
            expect(originalTitleText).to.not.equal(sortedTitleText);
          }
        });
      });
    });
  });
});