describe('RealBeans Shopify Quality Assurance Suite', () => {
  const storePassword = Cypress.env('shopify_password');

  beforeEach(() => {
    // Navigate to the base URL configured
    cy.visit('https://r0757870-realbeans.myshopify.com/');
    
    // Check if the current route is intercepted by Shopify's password barrier
    cy.its('location.pathname').then((pathname) => {
      if (pathname.includes('/password')) {
        // Find Shopify theme password input, type the credential, and submit
        cy.get('input[type="password"], #password, [name="password"]')
          .first()
          .type(`${storePassword}{enter}`);
      }
    });
  });

  it('1. Verify Homepage Layout and Corporate Intro Text', () => {
    cy.visit('https://r0757870-realbeans.myshopify.com/');
    
    // Explicit check for the exact historical copy requested by the CIO
    cy.contains('Since 1801, RealBeans has roasted premium coffee in Antwerp for Europe’s finest cafes.')
      .should('be.visible');
      
    // Assert that a product grid or collection section exists on the landing view
    cy.get('.grid, .product-grid, [class*="product-grid"]').should('exist');
  });

  it('2. Verify Custom About Page and Heritage Paragraph', () => {
    // Navigates to your custom created info page
    cy.visit('/pages/about'); 
    
    // Explicit verification of the paragraph text requested by Harry
    cy.contains('From a small Antwerp grocery to a European coffee staple, RealBeans honors tradition while innovating for the future.')
      .should('be.visible');
  });

  it('3. Verify Catalog Item Displays and Product Detail Integrity', () => {
    cy.visit('/collections/all');
    
    // Ensure that items exist within the default collection rendering engine
    cy.get('.card__heading, .product-card__title, h3 a').should('have.length.at.least', 1);

    // Target and click into the primary product page to evaluate its specifications
    cy.get('.card__heading a, .product-card__link, h3 a').first().click();

    // Validate that critical business elements are completely loaded
    cy.get('h1').should('not.be.empty');
    cy.get('.product__description, .rte').should('not.be.empty');
    cy.get('.price').should('be.visible');
    
    // Ensure images matching the assets uploaded are displaying properly
    cy.get('img[src*="Bag"], img[src*="bag"], img[src*="Blend"], img[src*="Roasted"]').should('exist');
  });

  it('4. Verify Interactive Catalog Sorting Re-orders Items', () => {
    cy.visit('/collections/all');
    
    // Capture the name of the top listed product before applying an active sort
    cy.get('.card__heading, .product-card__title, h3 a').first().then(($initialProduct) => {
      const originalTitleText = $initialProduct.text().trim();

      // Interact with standard Shopify Dawn theme sorting element selectors
      cy.get('#SortBy, [name="sort_by"]').select('price-ascending'); 
      
      // Explicit delay for async AJAX state shifts inside the theme engine to populate
      cy.wait(2000); 

      // Re-evaluate the new top listed product after structural sort execution
      cy.get('.card__heading, .product-card__title, h3 a').first().then(($newProduct) => {
        const sortedTitleText = $newProduct.text().trim();
        
        // Assert that the order of visible items has intentionally changed
        expect(originalTitleText).to.not.equal(sortedTitleText);
      });
    });
  });
});