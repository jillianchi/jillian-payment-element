const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

var app = express();

// view engine setup (Handlebars)
app.engine(
  "hbs",
  exphbs({
    defaultLayout: "main",
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

/**
 * Home route
 */
app.get("/", function (req, res) {
  res.render("index");
});

//Jill: Separating for reuse
function getItem(item) {
  switch (item) {
    case "1":
      return {
        title: "The Art of Doing Science and Engineering",
        amount: 2300,
      };
    case "2":
      return {
        title: "The Making of Prince of Persia: Journals 1985-1993",
        amount: 2500,
      };
    case "3":
      return {
        title: "Working in Public: The Making and Maintenance of Open Source",
        amount: 2800,
      };
    default:
      return null;
  }
}

//Jill: Reusing item from above
app.get("/checkout", function (req, res) {
  const details = getItem(req.query.item);
  res.render("checkout", {
    title: details?.title,
    amount: details?.amount,
    error: details ? null : "No item selected",
    item: req.query.item,
  });
});

//Jill: Create Checkout Session API
app.post("/create-checkout-session", async (req, res) => {
  const { item } = req.body;
  const details = getItem(item);
  if (!details) return res.status(400).json({ error: "Invalid item" });

  const YOUR_DOMAIN = "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    ui_mode: "custom",
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "sgd",
          unit_amount: details.amount,
          product_data: { name: details.title },
        },
        quantity: 1,
      },
    ],
    return_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.json({ clientSecret: session.client_secret });
});

//Jill: Success route to Retrieve Checkout Session API
app.get("/success", async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.render("success", { error: "Missing session_id" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  res.render("success", {
    payment_intent_id: session.payment_intent?.id || null,
    payment_status: session.payment_status,
    intent_status: session.payment_intent?.status || null,
    amount_total: (session.amount_total / 100).toFixed(2),
    currency: session.currency.toUpperCase(),
  });
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log("Getting served on port 3000");
});
