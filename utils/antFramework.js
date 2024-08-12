//antFramework.js
import { diff, patch, createElement } from "./vdom.js";
import { scheduler } from "./scheduler.js";
import { defineStore, useStore } from "./stateManagement.js";
import router from "./router.js";

const parseTemplate = (componentContent) => {
  const templateMatch = componentContent.match(
    /<template>([\s\S]*?)<\/template>/
  );
  const scriptMatch = componentContent.match(/<script>([\s\S]*?)<\/script>/);
  const styleMatch = componentContent.match(/<style>([\s\S]*?)<\/style>/);

  return {
    template: templateMatch ? templateMatch[1].trim() : "",
    script: scriptMatch ? scriptMatch[1].trim() : "",
    style: styleMatch ? styleMatch[1].trim() : "",
  };
};

const createComponent = async (componentContent, options = {}) => {
  const { components = {}, dependencies = {} } = options;
  const { template, style, script } = parseTemplate(componentContent);

  // Handle inline styles
  if (style) {
    const styleElement = document.createElement("style");
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
  }

  const component = {
    data: {},
    methods: {},
    props: {},
    render: null,
    vdom: null,
    el: null,
    isMounted: false,
    lifecycleHooks: {
      mounted: [],
      updated: [],
      unmounted: [],
    },
    customComponents: components,
    dependencies: dependencies,
    refs: {},
    nonReactiveData: {},
    importedFunctions: {},
  };

  const proxyHandler = {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;
      if (component.isMounted && !Object.is(oldValue, value)) {
        scheduler.scheduleUpdate(() => component.updateView(), 1);
      }
      return true;
    },
  };

  component.updateView = function () {
    if (!this.isMounted) {
      console.warn(
        "Component is not mounted yet. Call mount() before updating."
      );
      return;
    }
    const newVDOM = this.render();
    const patches = diff(this.vdom, newVDOM);
    patch(this.el, patches);
    this.vdom = newVDOM;

    this.lifecycleHooks.updated.forEach((hook) => hook());
  };

  component.navigate = (path, queryParams = {}) => {
    router.navigate(path, queryParams);
  };

  component.mount = function (el) {
    if (typeof el === "string") {
      this.el = document.querySelector(el);
    } else if (el instanceof HTMLElement) {
      this.el = el;
    } else {
      throw new Error(
        "Invalid mounting element. Please provide a valid CSS selector or HTMLElement."
      );
    }

    if (!this.el) {
      throw new Error("Could not find the element to mount the component.");
    }

    this.vdom = this.render();
    const element = createElement(this.vdom);
    this.el.appendChild(element);

    this.isMounted = true;
    this.lifecycleHooks.mounted.forEach((hook) => hook());
  };

  component.unmount = function () {
    if (!this.isMounted) {
      console.warn("Component is not mounted.");
      return;
    }

    this.lifecycleHooks.unmounted.forEach((hook) => hook());

    this.el.innerHTML = "";
    this.el = null;
    this.vdom = null;
    this.isMounted = false;
  };

  const handleImports = async (script) => {
    const importRegex =
      /import\s+(?:(\w+)\s*,?\s*)?(?:{([\s\w,]+)})?\s+from\s+['"](.+)['"]/g;
    const cssImportRegex = /import\s+['"](.+\.css)['"]/g;
    const imports = {};
    const antComponents = {};
    let match;

    // Handle CSS imports
    while ((match = cssImportRegex.exec(script)) !== null) {
      const [, cssPath] = match;
      try {
        const cssContent = await fetch(cssPath).then((response) =>
          response.text()
        );
        const styleElement = document.createElement("style");
        styleElement.textContent = cssContent;
        document.head.appendChild(styleElement);
      } catch (error) {
        console.error(`Failed to import CSS from ${cssPath}:`, error);
      }
    }

    // Handle JS and component imports
    while ((match = importRegex.exec(script)) !== null) {
      const [, defaultImport, namedImports, path] = match;
      try {
        if (path.endsWith(".ant")) {
          // Handle .ant component imports
          const componentContent = await fetch(path).then((response) =>
            response.text()
          );
          const importedComponent = await createComponent(componentContent, {
            components,
            dependencies,
          });
          const componentName =
            defaultImport || path.split("/").pop().replace(".ant", "");
          antComponents[componentName] = importedComponent;
        } else {
          // Handle regular JS imports
          const importedModule = await import(path);

          if (defaultImport) {
            imports[defaultImport] = importedModule.default;
          }

          if (namedImports) {
            namedImports.split(",").forEach((name) => {
              const trimmedName = name.trim();
              imports[trimmedName] = importedModule[trimmedName];
            });
          }
        }
      } catch (error) {
        console.error(`Failed to import from ${path}:`, error);
      }
    }

    return { imports, antComponents };
  };

  // Handle imports
  const { imports, antComponents } = await handleImports(script);

  // Remove import statements from the script
  const scriptWithoutImports = script
    .replace(/import\s+.+\s+from\s+['"].+['"];?/g, "")
    .replace(/import\s+['"].+\.css['"];?/g, "");

  // Add imported functions to the component's context
  component.importedFunctions = imports;

  component.useStore = useStore;

  const scriptFunction = new Function(
    "component",
    "diff",
    "patch",
    "createElement",
    "scheduler",
    "imports",
    ...Object.keys(dependencies),
    `
    with (component) {
      with (dependencies) {
        with (imports) {
          ${scriptWithoutImports}
          component.data = data;
          component.methods = methods;
          if (typeof props !== 'undefined') component.props = props;
          if (typeof refs !== 'undefined') component.refs = refs;
          if (typeof nonReactiveData !== 'undefined') component.nonReactiveData = nonReactiveData;
          if (typeof onMounted !== 'undefined') component.lifecycleHooks.mounted.push(onMounted);
          if (typeof onUnmounted !== 'undefined') component.lifecycleHooks.unmounted.push(onUnmounted);
          if (typeof onUpdated !== 'undefined') component.lifecycleHooks.updated.push(onUpdated);
          if (typeof components !== 'undefined') component.customComponents = { ...component.customComponents, ...components };
        }
      }
    }
    return component;
  `
  );

  const evaluatedComponent = scriptFunction(
    component,
    diff,
    patch,
    createElement,
    scheduler,
    imports,
    ...Object.values(dependencies)
  );

  // Merge imported .ant components with custom components
  evaluatedComponent.customComponents = {
    ...evaluatedComponent.customComponents,
    ...antComponents,
  };

  evaluatedComponent.data = new Proxy(evaluatedComponent.data, proxyHandler);
  evaluatedComponent.props = new Proxy(evaluatedComponent.props, proxyHandler);
  evaluatedComponent.refs = new Proxy(evaluatedComponent.refs, {
    set(target, property, value) {
      if (property === "value" && target.hasOwnProperty(property)) {
        target[property] = value;
        if (evaluatedComponent.isMounted) {
          scheduler.scheduleUpdate(() => evaluatedComponent.updateView(), 1);
        }
      } else {
        target[property] = value;
      }
      return true;
    },
  });

  Object.keys(evaluatedComponent.methods).forEach((key) => {
    const originalMethod = evaluatedComponent.methods[key];
    evaluatedComponent.methods[key] = function (...args) {
      const result = originalMethod.apply(evaluatedComponent, args);
      if (evaluatedComponent.isMounted) {
        scheduler.scheduleUpdate(() => evaluatedComponent.updateView(), 1);
      }
      return result;
    };
  });

  const createVDOM = (
    element,
    component,
    loopVariables = {},
    dependencies = {},
    importedFunctions = {},
    parentSlots = {}
  ) => {
    if (!element) return null;
    if (element.nodeType === Node.TEXT_NODE) {
      const text = interpolate(
        element.textContent,
        component.data,
        component.props,
        loopVariables,
        dependencies,
        importedFunctions,
        parentSlots
      );
      return text.trim() ? text : null;
    }

    const tagName = element.tagName.toLowerCase();

    // Check for custom component
    const CustomComponent =
      component.customComponents[tagName] ||
      component.customComponents[capitalize(tagName)];
    const isCustomComponent = !!CustomComponent;

    if (isCustomComponent) {
      const props = {};
      const componentSlots = {};

      // Process attributes
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith("v-bind:") || attr.name.startsWith(":")) {
          const propName = attr.name.replace(/^(v-bind:|:)/, "");
          props[propName] = evaluateExpression(
            attr.value,
            component.data,
            component.props,
            loopVariables,
            dependencies,
            importedFunctions
          );
        } else {
          props[attr.name] = attr.value;
        }
      });

      // Process slots
      Array.from(element.children).forEach((child) => {
        const slotName = child.getAttribute("slot") || "default";
        if (!componentSlots[slotName]) {
          componentSlots[slotName] = [];
        }
        componentSlots[slotName].push(
          createVDOM(
            child,
            component,
            loopVariables,
            dependencies,
            importedFunctions,
            parentSlots
          )
        );
      });

      // Create and return the custom component vnode
      return {
        type: tagName,
        component: CustomComponent,
        props: props,
        slots: componentSlots,
      };
    }

    const vNode = {
      type: tagName,
      props: {},
      children: [],
    };

    // Handle slot elements
    if (tagName === "slot") {
      const slotName = element.getAttribute("name") || "default";
      return parentSlots[slotName] || [];
    }

    // Handle v-if directive
    const vIf = element.getAttribute("v-if");
    if (vIf) {
      const shouldRender = evaluateExpression(
        vIf,
        component.data,
        component.props,
        loopVariables,
        dependencies,
        importedFunctions
      );
      if (!shouldRender) {
        return null;
      }
    }

    // Handle v-for directive
    const vFor = element.getAttribute("v-for");
    if (vFor) {
      const [item, listName] = vFor.split(" in ").map((s) => s.trim());
      const list = evaluateExpression(
        listName,
        component.data,
        component.props,
        loopVariables,
        dependencies,
        importedFunctions
      );
      return list.map((itemValue, index) => {
        const clonedElement = element.cloneNode(true);
        clonedElement.removeAttribute("v-for");
        const newLoopVariables = { ...loopVariables, [item]: itemValue, index };
        return createVDOM(
          clonedElement,
          component,
          newLoopVariables,
          dependencies,
          importedFunctions,
          parentSlots
        );
      });
    }

    // Process attributes and events
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith("v-on:") || attr.name.startsWith("@")) {
        const eventName = attr.name.replace(/^(@|v-on:)/, "");
        const methodName = attr.value.split("(")[0];
        const argsMatch = attr.value.match(/\((.*?)\)/);
        const args = argsMatch
          ? argsMatch[1].split(",").map((arg) => arg.trim())
          : [];

        vNode.props[`on${eventName}`] = (e) => {
          let evaluatedArgs;
          if (args.length > 0) {
            evaluatedArgs = args.map((arg) => {
              if (arg.endsWith(".id")) {
                const itemType = arg.split(".")[0];
                const itemElement = e.target.closest(`[data-${itemType}-id]`);
                if (itemElement) {
                  const itemId = itemElement.dataset[`${itemType}Id`];
                  return parseInt(itemId, 10);
                }
              }
              return evaluateExpression(
                arg,
                component.data,
                component.props,
                loopVariables,
                dependencies,
                importedFunctions
              );
            });
          } else {
            evaluatedArgs = [e];
          }
          component.methods[methodName].apply(component, evaluatedArgs);
        };
      } else if (attr.name.startsWith("v-bind:") || attr.name.startsWith(":")) {
        const propName = attr.name.replace(/^(v-bind:|:)/, "");
        vNode.props[propName] = evaluateExpression(
          attr.value,
          component.data,
          component.props,
          loopVariables,
          dependencies,
          importedFunctions
        );
      } else if (attr.name === "v-model") {
        vNode.props.value = evaluateExpression(
          attr.value,
          component.data,
          component.props,
          loopVariables,
          dependencies,
          importedFunctions
        );
        vNode.props.oninput = (e) => {
          component.data[attr.value] = e.target.value;
        };
      } else {
        vNode.props[attr.name] = attr.value;
      }
    });

    // Process child nodes
    Array.from(element.childNodes).forEach((child) => {
      const childVNode = createVDOM(
        child,
        component,
        loopVariables,
        dependencies,
        importedFunctions,
        parentSlots
      );
      if (childVNode !== null) {
        if (Array.isArray(childVNode)) {
          vNode.children.push(...childVNode);
        } else {
          vNode.children.push(childVNode);
        }
      }
    });

    // Add support for router-link
    if (tagName === "a" && element.hasAttribute("router-link")) {
      const href = element.getAttribute("href");
      vNode.props.href = router.link(href);
      vNode.props.onclick = (e) => {
        e.preventDefault();
        router.navigate(href);
      };
    }

    return vNode;
  };

  const renderComponent = (vnode, parentSlots = {}) => {
    if (typeof vnode === "string") {
      return document.createTextNode(vnode);
    }

    if (!vnode.component) {
      const element = document.createElement(vnode.type);
      Object.entries(vnode.props || {}).forEach(([key, value]) => {
        if (key.startsWith("on") && typeof value === "function") {
          element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key !== "children") {
          element.setAttribute(key, value);
        }
      });
      (vnode.children || []).forEach((child) => {
        const renderedChild = renderComponent(child, parentSlots);
        if (Array.isArray(renderedChild)) {
          renderedChild.forEach((c) => element.appendChild(c));
        } else if (renderedChild) {
          element.appendChild(renderedChild);
        }
      });
      return element;
    }

    // Handle custom component
    const componentInstance = vnode.component();
    componentInstance.props = vnode.props;
    const renderedVNode = componentInstance.render();

    // Merge parent slots with component slots
    const mergedSlots = { ...parentSlots, ...vnode.slots };

    return renderComponent(renderedVNode, mergedSlots);
  };

  const interpolate = (
    text,
    data,
    props,
    loopVariables = {},
    dependencies = {},
    importedFunctions = {},
    slots = {}
  ) => {
    return text.replace(/{{(.*?)}}/g, (match, p1) => {
      const trimmed = p1.trim();
      if (trimmed === "children" || trimmed.startsWith("slot(")) {
        // Render slot content
        const slotName =
          trimmed === "children"
            ? "default"
            : trimmed.match(/slot\((.*?)\)/)[1];
        if (slots[slotName]) {
          return slots[slotName]
            .map((child) => renderComponent(child))
            .join("");
        }
        return "";
      }
      return evaluateExpression(
        trimmed,
        data,
        props,
        loopVariables,
        dependencies,
        importedFunctions
      );
    });
  };

  const evaluateExpression = (
    expression,
    data,
    props,
    loopVariables = {},
    dependencies = {},
    importedFunctions = {}
  ) => {
    const allVariables = {
      ...data,
      ...props,
      ...loopVariables,
      ...dependencies,
      ...importedFunctions,
    };
    const func = new Function(
      ...Object.keys(allVariables),
      `return ${expression}`
    );
    return func(...Object.values(allVariables));
  };

  // Helper function to capitalize the first letter of a string
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  evaluatedComponent.render = function () {
    const temp = document.createElement("template");
    temp.innerHTML = template;
    return createVDOM(
      temp.content.firstElementChild,
      this,
      {},
      dependencies,
      this.importedFunctions,
      this.props.slots || {}
    );
  };

  return evaluatedComponent;
};

export { createComponent, router };
