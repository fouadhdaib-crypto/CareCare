# CareCare

CareCare is a car parts marketplace prototype built with HTML, CSS, and JavaScript. It helps customers find parts, compare supplier prices, and track vehicle mileage and service reminders.

## Features

- Search car parts by name or part number.
- Filter products by category and compare supplier offers.
- Add products to a cart and change quantities.
- Try a demo checkout and view an order confirmation.
- Save a vehicle selection and track mileage.
- View maintenance reminders and common questions.
- Sign in with sample customer, admin, or supplier accounts.
- Explore admin and supplier dashboards for products, orders, users, and reports.

## Technologies

- HTML for page structure.
- CSS for responsive styling.
- JavaScript for search, forms, cart actions, and sample login.
- Browser storage for cart items, vehicle selection, mileage, and demo sessions.

## Run the project

1. Extract the project ZIP.
2. Open a terminal inside the `carcare` folder.
3. Start a local server:

   ```sh
   python3 -m http.server 8000
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser.

No package installation is needed to run the website. Python 3 is needed for the server command above.

## Demo accounts

Open `login.html` and use one of these accounts. The password for all three accounts is `123`.

| Role | Email | Password | Login destination |
| --- | --- | --- | --- |
| Customer | user@carcare.com | 123 | Homepage |
| Admin | admin@carcare.com | 123 | Admin overview |
| Supplier | supplier@carcare.com | 123 | Supplier overview |

Sample accounts are defined in `app.js`. Selecting **Remember me** saves the demo session in localStorage; otherwise, it is saved in sessionStorage for the current tab.

## Main files

| File or folder | Purpose |
| --- | --- |
| `index.html` | Homepage |
| `login.html` | Sample account login |
| `marketplace.html` | Product catalog |
| `price-comparison.html` | Supplier price comparison |
| `cart.html` | Shopping cart |
| `checkout.html` | Demo checkout |
| `admin-*.html` | Admin dashboard pages |
| `supplier-*.html` | Supplier dashboard pages |
| `app.js` | Main JavaScript and sample accounts |
| `style.css` | Website styles |
| `assets/` | Local images and icons |
| `tests/` | Automated checks |
| `build.py` | Static link validation and build script |

## Build

Run this command from the project folder:

```sh
python3 build.py
```

The script checks local page and asset links and copies the website into `dist/`.

## Tests

With Node.js 22 or newer installed, run:

```sh
npm install
npm test
```

The tests check page initialization, search, cart behavior, demo checkout, sample logins, and removal of the notice from admin pages.

## Project status

CareCare is a front-end demonstration. Products, prices, dashboard figures, and orders use sample data. Payments, email delivery, and backend services are not connected.

Login runs in JavaScript with hardcoded demo passwords. Dashboard pages are publicly accessible, and roles are not enforced by a server. Some dashboard actions are previews. Form validation does not create real accounts or send messages.

Demo data is stored in the browser. Clearing site data resets saved information. Vehicle selection does not verify that a part fits; check manufacturer information before purchasing real parts.
