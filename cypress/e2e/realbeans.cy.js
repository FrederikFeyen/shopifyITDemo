describe('RealBeans Shopify Quality Assurance Suite', () => {
  const storePassword = Cypress.env('shopify_password');

  beforeEach(() => {
    // Use session to persist the Shopify password cookie across tests
    cy.session('shopify-access', () => {
      cy.visit('/');
      
      cy.get('body').then(($body) => {
        const passwordField = $body.find('input[type="password"], #password, [name="password"]');
        if (passwordField.length > 0) {
          cy.log('Password barrier detected, logging in...');
          cy.wrap(passwordField).first().type(`${storePassword}{enter}`, { log: false });
          
          // Verify login successful by waiting for a common element
          cy.get('header, nav, main').should('exist');
        } else {
          cy.log('No password barrier detected.');
        }
      });
    });
  });

  it('1. Verify Homepage Layout and Corporate Intro Text', () => {
    cy.visit('/');
    
    // Assert that a product grid or collection section exists
    cy.get('main, .grid, .product-grid, [class*="product-grid"]').should('exist');
    
    // Use regex to be more resilient to whitespace/line-breaks
    cy.contains(/Since 1801, RealBeans has roasted premium coffee in Antwerp for Europe’s finest cafes/i)
      .should('be.visible');
  });

  it('2. Verify Custom About Page and Heritage Paragraph', () => {
    cy.visit('/pages/about'); 
    
    cy.contains(/From a small Antwerp grocery to a European coffee staple/i)
      .should('be.visible');
  });

  it('3. Verify Catalog Item Displays and Product Detail Integrity', () => {
    cy.visit('/collections/all');
    
    // Check for standard Shopify collection item selectors (Dawn theme and common variants)
    cy.get('.card__heading, .product-card__title, h3 a, .grid-view-item__title').should('have.length.at.least', 1);

    // Click into the first product
    cy.get('.card__heading a, .product-card__link, h3 a, .grid-view-item__link').first().click();

    // Validate product page essentials
    cy.get('h1').should('not.be.empty');
    cy.get('.product__description, .rte, #ProductDescription').should('not.be.empty');
    cy.get('.price, [data-price]').should('be.visible');
    
    // Check for any product image if specific keywords fail
    cy.get('img[src*="Bag"], img[src*="bag"], img[src*="Blend"], img[src*="Roasted"], .product__media img')
      .should('exist');
  });

  it('4. Verify Interactive Catalog Sorting Re-orders Items', () => {
    cy.visit('/collections/all');
    
    const titleSelector = '.card__heading, .product-card__title, h3 a, .grid-view-item__title';
    
    cy.get(titleSelector).first().then(($initialProduct) => {
      const originalTitleText = $initialProduct.text().trim();

      // Shopify sorting selector
      cy.get('#SortBy, [name="sort_by"]').select('price-ascending'); 
      
      // Wait for URL change or content update
      cy.url().should('include', 'sort_by=price-ascending');
      cy.wait(1000); // Small buffer for DOM re-render

      cy.get(titleSelector).first().then(($newProduct) => {
        const sortedTitleText = $newProduct.text().trim();
        
        // If there's more than one item, the order might change
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