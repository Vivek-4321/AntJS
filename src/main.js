import { createComponent, router } from "../utils/antFramework.js";

async function initializeApp() {
  try {
    // Configure router
    router.mode = 'hash'; // or 'hash'
    router.root = '/';

    // Set loading indicator
    router.setLoadingIndicator("./components/LoadingIndicator.ant");

    // Define routes
    router.addRoute("/", "./components/Home.ant", { loadingMessage: "Loading Home page..." });
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
    console.error("Failed to initialize app:", error);
    const appElement = document.querySelector("#app");
    appElement.innerHTML = 'An error occurred while initializing the app.';
  }
}

initializeApp();