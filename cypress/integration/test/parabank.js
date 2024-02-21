/// <reference types="cypress" />

let userName = '';
let password =''
let newAccountNumber = '';


// Utility function to generate a random string
const generateRandomString = (length) => {
    const randomstring = require('randomstring');
    return randomstring.generate({ length: length });
};

// Cypress test
describe('Parabank Test', () => {

    describe('Register a new user', () => {
        before(function () {
            return cy.fixture('user').then((data) => {
                globalThis.user = data;
            });
        });
        it('should be able to register with a random username and password', () => {
            // Generate random username and password
            userName = `${globalThis.user[0].name}${generateRandomString(6)}`;
            password = `${globalThis.user[0].password}${generateRandomString(6)}`;

            // Navigate to the registration
            cy.visit(Cypress.env('baseUrl')+'/index.htm')
            cy.get('#loginPanel > :nth-child(3) > a').click();

            // Enter Registration Details
            cy.get('input[name="customer.firstName"]').type(`${userName}`);
            cy.get('input[name="customer.lastName"]').type(`${globalThis.user[0].surname}${generateRandomString(6)}`);
            cy.get('input[name="customer.address.street').type(`${globalThis.user[0].address_street}`);
            cy.get('input[name="customer.address.city').type(`${globalThis.user[0].address_city}`);
            cy.get('input[name="customer.address.state').type(`${globalThis.user[0].address_state}`);
            cy.get('input[name="customer.address.zipCode').type(`${globalThis.user[0].address_zipcode}`);
            cy.get('input[name="customer.phoneNumber').type(`${globalThis.user[0].phone_number}`);
            cy.get('input[name="customer.ssn').type(`${globalThis.user[0].ssn}`);
            cy.get('input[name="customer.username').type(userName);
            cy.get('input[name="customer.password').type(password);
            cy.get('#repeatedPassword').type(password);

            cy.get('[colspan="2"] > .button').click();
            cy.get('.title').should('have.text', `Welcome ${userName}`);
        });
    });

    describe('Login, Navigate Menus and Open New Account', () => {
        beforeEach(() => {
            // Common setup steps before each test case
            cy.log(baseUrl)
            cy.visit(Cypress.env('baseUrl')+'/index.htm');

            cy.get(':nth-child(2) > .input').type(userName);
            cy.get(':nth-child(4) > .input').type(password);
            cy.get('form[name="login"] .button').click();
        });

        describe('Global Navigation Menus Test', () => {
            it('should be able to navigate to home menu', () => {
                cy.get('.button > .home').should('be.visible').click();
                cy.get('.button > .home').then(($element) => {
                    console.log('Number of elements found:', $element.length);
                    console.log('Text content of the element:', $element.text());
                });

                cy.get('.button > .home').click();
                cy.url().should('include', '/index.htm');
            });
            it('should be able to navigate to about menu', () => {
                cy.get('.button > .aboutus').click();
                cy.url().should('include', '/about.htm');
            });
            it('should be able to navigate to contact menu', () => {
                cy.get('.button > .contact').click();
                cy.url().should('include', '/contact.htm');

            });
        });

        describe('Get Balance and Open New Account Page - Savings Account', () => {
            let totalAmount = '';
            it('should get current account balance', () => {
                cy.get('#leftPanel a[href="/parabank/overview.htm"]').click();
                cy.wait(2000);

                const accountNumbers = [];
                cy.get('#accountTable tbody tr:not(:last-child):not(:last-child)').each(($row) => {
                    const accountNumber = $row.find('td:first-child a').text().trim();
                    const accountBalance =  $row.find('td:nth-child(2)').text();
                    accountNumbers.push(accountNumber, accountBalance );
                });
                cy.log('Accounts:', accountNumbers);

                cy.get('#accountTable').invoke('text').then((totalAmountText) => {
                    cy.log(totalAmountText);
                    const totalRegex = /Total\s+\$([\d.,]+)/;
                    const totalMatch = totalAmountText.match(totalRegex);
                    if (totalMatch && totalMatch[1]) {
                        totalAmount = totalMatch[1];
                        cy.log('Total Value Amount:', totalAmount);
                    } else {
                        cy.log('Total Value Amount not found.');
                    }
                });
            });

            it('should be able to Open New Savings Account', () => {
                cy.get('#leftPanel a[href="/parabank/openaccount.htm"]').click();
                cy.wait(3000);
                cy.get('#type').select('SAVINGS');
                cy.get('form[ng-submit="submit()"] input[type="submit"]').click();
                cy.get('#newAccountId').invoke('text').then((newAccountId) => {
                    cy.log('New Account Number:',newAccountId)
                    newAccountNumber = newAccountId;
                });
            });

            it('should get latest accounts overview after opening an account', () => {
                cy.get('#leftPanel a[href="/parabank/overview.htm"]').click();
                cy.wait(2000);

                const accountNumbers = [];
                cy.get('#accountTable tbody tr:not(:last-child):not(:last-child)').each(($row) => {
                    const accountNumber = $row.find('td:first-child a').text().trim();
                    accountNumbers.push(accountNumber);
                }).then(() => {
                    cy.log('Accounts:', accountNumbers);

                    // Check if newAccountNumber exists in accountNumbers
                    cy.wrap(accountNumbers).should('include', newAccountNumber);
                });

                cy.get('#accountTable').invoke('text').then((totalAmountText) => {
                    const totalRegex = /Total\s+\$([\d.,]+)/;
                    const totalMatch = totalAmountText.match(totalRegex);

                    if (totalMatch && totalMatch[1]) {
                        totalAmount = totalMatch[1]; // Access the captured group
                        cy.log('Total Value Amount:', totalAmount);
                    } else {
                        cy.log('Total Value Amount not found.');
                    }
                });

            });
        });

        describe('Transfer Funds', () => {
            it('Tranfer Funds from created Account', () => {
                const amount = '5'
                cy.get('#leftPanel a[href="/parabank/transfer.htm"]').click();
                cy.get('#amount').type(amount);

                cy.get('#fromAccountId').select(newAccountNumber);

                cy.get('#toAccountId').find(`option:not(:contains('${newAccountNumber}'))`).then(($option) => {
                    const optionToAccountValue = $option.val();
                    cy.get('#toAccountId').select(optionToAccountValue);
                    cy.get('form[ng-submit="submit()"] input[type="submit"]').click();
                    cy.wait(2000);
                    cy.get('.title').should('have.text', 'Transfer Complete!');

                    cy.get('#amount').should('have.text', `$${amount}.00`);
                    cy.get('#fromAccountId').should('have.text', newAccountNumber);
                    cy.get('#toAccountId').should('have.text', optionToAccountValue);

                    cy.contains(`$${amount}.00 has been transferred from account #${newAccountNumber} to account #${optionToAccountValue}`).should('be.visible');
                });
            });
        });

        describe('Bill Payment', () => {
            it('should be able to pay bill using the created account', () => {
                const amount = '1'
                cy.get('#leftPanel a[href="/parabank/billpay.htm"]').click();
                cy.get('input[name="payee.name"]').type(`${globalThis.user[1].name}`);
                cy.get('input[name="payee.address.street"]').type(`${globalThis.user[1].address_street}`);
                cy.get('input[name="payee.address.city"]').type(`${globalThis.user[1].address_city}`);
                cy.get('input[name="payee.address.state"]').type(`${globalThis.user[1].address_state}`);
                cy.get('input[name="payee.address.zipCode"]').type(`${globalThis.user[1].address_zipcode}`);
                cy.get('input[name="payee.phoneNumber"]').type(`${globalThis.user[1].phone_number}`);
                cy.get('input[name="payee.accountNumber"]').type(`${globalThis.user[1].account}`);
                cy.get('input[name="verifyAccount"]').type(`${globalThis.user[1].account}`);
                cy.get('input[name="amount"]').type(amount);

                cy.get('select[name="fromAccountId"]').select(newAccountNumber);
                cy.wait(5000);
                cy.get('input[value="Send Payment"]').click();
                cy.get('div[ng-show="showResult"] h1.title').should('have.text', 'Bill Payment Complete');
                // cy.contains(`Bill Payment to ${globalThis.user[1].name} in the amount of $${amount}.00 from account ${newAccountNumber} was successful.`).should('be.visible');
            });
        });

        describe('Validate Bill Payment record via API', () => {
            it('should get record of bill payment transaction by amount', () => {
                cy.request({
                    method: 'GET',
                    url: `${baseUrl}/services_proxy/bank/accounts/${newAccountNumber}/transactions/amount/10`,
                }).then((response) => {
                    console.log(response.body);
                    cy.log(response.body)
                    cy.log(response.body[0].accountId);
                    cy.log(response.body[0].amount);
                    cy.log(response.body[0].description);
                    cy.log(response.body[0].type);

                    expect(response.body[0].accountId).to.eq(+newAccountNumber)
                    expect(response.body[0].amount).to.eq(10.00)
                    expect(response.body[0].description).to.eq(`Bill Payment to ${globalThis.user[1].name}`)
                    expect(response.body[0].type).to.eq('Debit');
                    expect(response.status).to.eq(200);
                });
            });
        })
    });
});