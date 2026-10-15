# Verification

- PASS: all 27 HTML pages initialize in a simulated DOM without JavaScript exceptions.
- PASS: SKU search, product-specific details, cart additions, quantity changes, removal, reload persistence, supplier offer pricing, delivery grouping, tax and totals.
- PASS: demo order state, confirmation contents and clearing the cart after checkout.
- PASS: mobile menu state, FAQ expansion and garage mileage persistence.
- PASS: JavaScript syntax and HTML/CSS parser checks.
- PASS: static build and local HTML asset/link checks.

The DOM tests do not render pixels or emulate a full browser. Automated browser installation/launch failed in the provided environment; screenshots, breakpoint layout, real-browser navigation, focus order and reduced-motion appearance were not visually verified. The responsive CSS and reduced-motion handling are implemented but need a final browser review before launch.

To rerun functional tests, install Node.js 22 or newer, run `npm install`, then `npm test`. Runtime and static build do not require Node.js or those development dependencies.
