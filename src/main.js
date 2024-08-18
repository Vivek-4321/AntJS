// main.js
import { createComponent, router } from "../utils/antFramework.js";

let errorContainer;
let overlay;

function createOverlay() {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "error-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: none;
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function createErrorContainer() {
  if (!errorContainer) {
    errorContainer = document.createElement("div");
    errorContainer.id = "error-container";
    errorContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60vw;
      max-height: 80vh;
      overflow-y: auto;
      background-color: #181818;
      border-top: 6px solid #ff5555;
      color: white;
      padding: 20px;
      border-radius: 0.5rem;
      font-family: Arial, sans-serif;
      z-index: 9999;
      text-align: left;
      box-shadow: 0 2px 10px rgba(0,0,0,0.7);
      display: none;
    `;
    document.body.appendChild(errorContainer);
  }
  return errorContainer;
}

function displayError(error) {
  const container = createErrorContainer();
  const overlay = createOverlay();
  const errorElement = document.createElement("div");

  let errorMessage = "";
  let errorStack = "";

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else {
    errorMessage = JSON.stringify(error);
  }

  errorElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">An error occurred:</h2>
      <button id="close-error" style="background: none; border: none; color: #ff5555; font-size: 34px; cursor: pointer; padding: 0;">×</button>
    </div>
    <p style="margin-bottom: 20px; color: #ff7777;">${errorMessage}</p>
    ${
      errorStack
        ? `<h3 style="margin-bottom: 10px;">Stack Trace:</h3>
           <pre style="background-color: #222; color: #B7B7B7; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${errorStack}</pre>`
        : ""
    }
  `;

  container.innerHTML = "";
  container.appendChild(errorElement);

  overlay.style.display = "block";
  container.style.display = "block";

  document.getElementById("close-error").addEventListener("click", () => {
    overlay.style.display = "none";
    container.style.display = "none";
  });

  // Log the error to the console
  console.error("Error caught by Ant Framework:", error);
}

// We don't need to override console.error anymore, as we're logging in displayError
// Remove the console.error override

async function initializeApp() {
  try {
    // Configure router
    router.mode = "hash"; // or 'hash'
    router.root = "/";

    // Set loading indicator
    router.setLoadingIndicator("./components/LoadingIndicator.ant");

    // Define routes
    router.addRoute("/", "./components/Home.ant", {
      loadingMessage: "Loading Home page...",
    });
    router.addRoute("/about", "./components/About.ant", { showLoading: false });
    router.addRoute("/contact", "./components/Contact.ant");

    // Set the view element where components will be rendered
    router.setViewElement("#app");

    // Add a middleware example
    router.use(async (context) => {
      console.log("Route changed:", context.getPathAndQuery().path);
      // You can perform checks here and return false to cancel navigation
      return true;
    });

    // Start the router
    await router.handleRouteChange();

    // Make router globally available if needed
    window.router = router;
  } catch (error) {
    displayError(error);
  }
}

// Catch any unhandled errors and display them
window.addEventListener("error", (event) => {
  event.preventDefault();
  displayError(event.error || new Error(event.message));
});

// Catch any unhandled promise rejections and display them
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  displayError(event.reason);
});

// Catch and display syntax errors
document.addEventListener("DOMContentLoaded", () => {
  const scripts = document.getElementsByTagName("script");
  for (let script of scripts) {
    script.onerror = (event) => {
      displayError(new Error(`Syntax error in script: ${event.target.src}`));
    };
  }
});

initializeApp();
