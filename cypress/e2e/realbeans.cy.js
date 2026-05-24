describe('RealBeans Shopify Quality Assurance Suite', () => {
  const storePassword = Cypress.env('shopify_password');

  beforeEach(() => {
    // Navigate to the store
    cy.visit('/');
    
    // Explicitly wait for the body to ensure we are on a page
    cy.get('body').then(($body) => {
      // Look for the password field - Shopify themes often use different IDs/Classes
      const passwordField = $body.find('input[type="password"], #password, [name="password"], .password-login input');
      
      if (passwordField.length > 0) {
        cy.log('Password barrier detected, logging in...');
        // Some themes require clicking a "Enter using password" link first
        const enterUsingPasswordLink = $body.find('a[href*="/password"], .password-link, [href="#LoginModal"]');
        
        if (enterUsingPasswordLink.length > 0 && !passwordField.is(':visible')) {
          cy.wrap(enterUsingPasswordLink).first().click();
        }

        cy.wrap(passwordField).first().type(`${storePassword}{enter}`, { log: false });
        
        // Wait for the main page to load after login
        cy.get('header, nav, main, #MainContent', { timeout: 10000 }).should('exist');
      }
    });
  });

  it('1. Verify Homepage Layout and Corporate Intro Text', () => {
    // Re-ensure we are on home after login
    cy.visit('/');
    
    // Assert that a product grid or collection section exists
    cy.get('main, .grid, .product-grid, [class*="product-grid"], .shopify-section').should('exist');
    
    // Use regex to be more resilient to whitespace/line-breaks
    cy.contains(/Since 1801, RealBeans has roasted premium coffee in Antwerp/i, { timeout: 10000 })
      .should('be.visible');
  });

  it('2. Verify Custom About Page and Heritage Paragraph', () => {
    cy.visit('/pages/about'); 
    
    cy.contains(/From a small Antwerp grocery to a European coffee staple/i, { timeout: 10000 })
      .should('be.visible');
  });

  it('3. Verify Catalog Item Displays and Product Detail Integrity', () => {
    cy.visit('/collections/all');
    
    // Check for standard Shopify collection item selectors
    cy.get('.card__heading, .product-card__title, h3 a, .grid-view-item__title, .product-item__title', { timeout: 10000 })
      .should('have.length.at.least', 1);

    // Click into the first product
    cy.get('.card__heading a, .product-card__link, h3 a, .grid-view-item__link, .product-item__link').first().click();

    // Validate product page essentials
    cy.get('h1').should('not.be.empty');
    cy.get('.product__description, .rte, #ProductDescription, .product-description').should('not.be.empty');
    
    // Check for any product image
    cy.get('img[src*="Bag"], img[src*="bag"], img[src*="Blend"], img[src*="Roasted"], .product__media img, .product-single__media img')
      .should('exist');
  });

  it('4. Verify Interactive Catalog Sorting Re-orders Items', () => {
    cy.visit('/collections/all');
    
    const titleSelector = '.card__heading, .product-card__title, h3 a, .grid-view-item__title, .product-item__title';
    
    cy.get(titleSelector).first().then(($initialProduct) => {
      const originalTitleText = $initialProduct.text().trim();

      // Shopify sorting selector
      cy.get('#SortBy, [name="sort_by"]').select('price-ascending'); 
      
      // Wait for URL change or content update
      cy.url().should('include', 'sort_by=price-ascending');
      cy.wait(2000); // Increased buffer for DOM re-render

      cy.get(titleSelector).first().then(($newProduct) => {
        const sortedTitleText = $newProduct.text().trim();
        
        cy.get(titleSelector).its('length').then(len => {
          if (len > 1) {
            expect(originalTitleText).to.not.equal(sortedTitleText);
          } else {
            cy.log('Only one item found, sorting check skipped');
          }
        });
      });
    });
  });
});