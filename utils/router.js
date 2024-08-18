// router.js
import { lazyLoad, Suspense } from "./lazyLoad.js";
import { createComponent } from "./antFramework.js";

class Router {
  constructor(options = {}) {
    this.mode = options.mode || "hash";
    this.root = options.root || "/";
    this.routes = [];
    this.params = {};
    this.query = {};
    this.middlewares = [];
    this.viewElement = null;
    this.notFoundComponent =
      options.notFoundComponent || (() => "Page not found");
    this.loadingIndicatorComponent = null;
    this.defaultLoadingMessage = "Loading...";
    this.componentCache = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.mode === "hash") {
      window.addEventListener("hashchange", () => this.handleRouteChange());
      window.addEventListener("load", () => this.handleRouteChange());
    } else {
      window.addEventListener("popstate", () => this.handleRouteChange());
      document.body.addEventListener("click", (e) => {
        if (e.target.matches("[data-router-link]")) {
          e.preventDefault();
          const href = e.target.getAttribute("href");
          this.navigate(href);
        }
      });
    }
  }

  addRoute(path, componentPath, options = {}) {
    this.routes.push({ path, componentPath, options });
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  setViewElement(selector) {
    this.viewElement = document.querySelector(selector);
    if (!this.viewElement) {
      console.error(`View element with selector "${selector}" not found.`);
    }
  }

  setLoadingIndicator(componentPath) {
    this.loadingIndicatorComponent = componentPath;
  }

  async handleRouteChange() {
    if (!this.viewElement) {
      console.error(
        "View element not set. Call setViewElement() before routing."
      );
      return;
    }

    const { path, queryString } = this.getPathAndQuery();
    this.query = Object.fromEntries(new URLSearchParams(queryString));

    const matchedRoute = this.findMatchingRoute(path);

    if (matchedRoute) {
      const { componentPath, params, options } = matchedRoute;
      this.params = params;

      try {
        await this.runMiddlewares();
        await this.renderComponent(componentPath, options);
      } catch (error) {
        console.error("Error in route handling:", error);
        this.viewElement.innerHTML = "Error loading page";
      }
    } else {
      console.warn(`No matching route found for path: ${path}`);
      this.renderComponent(this.notFoundComponent);
    }
  }

  getPathAndQuery() {
    let path, queryString;
    if (this.mode === "hash") {
      const hash = window.location.hash.slice(1) || "/";
      [path, queryString] = hash.split("?");
    } else {
      path = window.location.pathname;
      queryString = window.location.search.slice(1);
    }
    return { path, queryString };
  }

  async runMiddlewares() {
    for (const middleware of this.middlewares) {
      const result = await middleware(this);
      if (result === false) return false;
    }
    return true;
  }

  async renderComponent(componentPath, options = {}) {
    const container = document.createElement("div");
    this.viewElement.innerHTML = "";
    this.viewElement.appendChild(container);

    let loadingIndicator;
    if (this.loadingIndicatorComponent && options.showLoading !== false) {
      const loadingMessage =
        options.loadingMessage || this.defaultLoadingMessage;
      loadingIndicator = await this.createLoadingIndicator(loadingMessage);
      container.appendChild(loadingIndicator);
    }

    try {
      let componentInstance;

      if (this.componentCache.has(componentPath)) {
        componentInstance = this.componentCache.get(componentPath);
      } else {
        const componentContent = await fetch(componentPath).then((response) =>
          response.text()
        );
        componentInstance = await createComponent(componentContent);
        this.componentCache.set(componentPath, componentInstance);
      }

      if (loadingIndicator) {
        container.removeChild(loadingIndicator);
      }

      if (typeof componentInstance.mount === "function") {
        componentInstance.mount(container);
      } else {
        throw new Error(`Invalid component`);
      }

      this.dispatchRouteChangedEvent();
    } catch (error) {
      console.error("Error rendering component:", error);
      container.innerHTML = "";
    }
  }

  async createLoadingIndicator(message) {
    const loadingIndicatorContent = await fetch(
      this.loadingIndicatorComponent
    ).then((response) => response.text());
    const loadingIndicatorComponent = await createComponent(
      loadingIndicatorContent
    );
    loadingIndicatorComponent.props.message = message;
    const loadingContainer = document.createElement("div");
    loadingIndicatorComponent.mount(loadingContainer);
    return loadingContainer;
  }

  findMatchingRoute(path) {
    for (const route of this.routes) {
      const params = {};
      const routeParts = route.path.split("/");
      const pathParts = path.split("/");

      if (routeParts.length === pathParts.length) {
        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(":")) {
            params[routeParts[i].slice(1)] = pathParts[i];
          } else if (routeParts[i] !== pathParts[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          return { ...route, params };
        }
      }
    }
    return null;
  }

  navigate(path, queryParams = {}) {
    const queryString = new URLSearchParams(queryParams).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    if (this.mode === "hash") {
      window.location.hash = fullPath;
    } else {
      window.history.pushState(null, "", fullPath);
      this.handleRouteChange();
    }
  }

  link(path, queryParams = {}) {
    const queryString = new URLSearchParams(queryParams).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    return this.mode === "hash" ? `#${fullPath}` : fullPath;
  }

  dispatchRouteChangedEvent() {
    window.dispatchEvent(
      new CustomEvent("routeChanged", {
        detail: {
          path: this.getPathAndQuery().path,
          params: this.params,
          query: this.query,
        },
      })
    );
  }
}

const router = new Router();
export default router;
