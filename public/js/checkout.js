//Jill: 100% from https://docs.stripe.com/checkout/custom/quickstart
const stripe = Stripe(
  "pk_test_51RuqvMIk9V5T0vLoVYZ7cRI1tZmCQY5JAA5TH2vee5k8xrg30ooeNRGPKWMnsrvAVGjlj9kj0jDecGHPuu46bGhC005iERMAVs" //Jill: update PK here
);

let checkout;
initialize();
const emailInput = document.getElementById("email");
const emailErrors = document.getElementById("email-errors");

const validateEmail = async (email) => {
  const updateResult = await checkout.updateEmail(email);
  const isValid = updateResult.type !== "error";

  return { isValid, message: !isValid ? updateResult.error.message : null };
};

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

// Fetches a Checkout Session and captures the client secret
async function initialize() {
  const item = document.getElementById("itemId").value;
  const promise = fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item }),
  })
    .then((r) => r.json())
    .then((r) => r.clientSecret);

  const appearance = {
    theme: "stripe",
  };
  checkout = await stripe.initCheckout({
    fetchClientSecret: () => promise,
    elementsOptions: { appearance },
  });

  checkout.on("change", (session) => {
    // Handle changes to the checkout session
  });

  document.querySelector("#button-text").textContent = `Pay ${
    checkout.session().total.total.amount
  } now`;
  emailInput.addEventListener("input", () => {
    // Clear any validation errors
    emailErrors.textContent = "";
    emailInput.classList.remove("error");
  });

  emailInput.addEventListener("blur", async () => {
    const newEmail = emailInput.value;
    if (!newEmail) {
      return;
    }

    const { isValid, message } = await validateEmail(newEmail);
    if (!isValid) {
      emailInput.classList.add("error");
      emailErrors.textContent = message;
    }
  });

  const paymentElement = checkout.createPaymentElement();
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const email = document.getElementById("email").value;
  const { isValid, message } = await validateEmail(email);
  if (!isValid) {
    emailInput.classList.add("error");
    emailErrors.textContent = message;
    showMessage(message);
    setLoading(false);
    return;
  }

  const { error } = await checkout.confirm();

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  showMessage(error.message);

  setLoading(false);
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 10000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#button-text").classList.remove("hidden");
  }
}
