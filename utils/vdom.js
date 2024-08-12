// vdom.js
import { executeLifecycleMethod } from "./lifecycle.js";

// Performance Profiling
const performanceMetrics = {};

const elementPool = new Map();

function recycleElement(element) {
  const tag = element.tagName.toLowerCase();
  if (!elementPool.has(tag)) {
    elementPool.set(tag, []);
  }
  elementPool.get(tag).push(element);
}

function getRecycledElement(tag) {
  if (elementPool.has(tag) && elementPool.get(tag).length > 0) {
    return elementPool.get(tag).pop();
  }
  return null;
}

function startMeasure(label) {
  if (!performanceMetrics[label]) {
    performanceMetrics[label] = {
      count: 0,
      totalTime: 0,
      startTime: performance.now(),
    };
  } else {
    performanceMetrics[label].startTime = performance.now();
  }
}

function endMeasure(label) {
  if (performanceMetrics[label]) {
    const endTime = performance.now();
    const duration = endTime - performanceMetrics[label].startTime;
    performanceMetrics[label].count++;
    performanceMetrics[label].totalTime += duration;
  }
}

function getPerformanceReport() {
  const report = {};
  for (const [label, metrics] of Object.entries(performanceMetrics)) {
    report[label] = {
      averageTime: metrics.totalTime / metrics.count,
      totalTime: metrics.totalTime,
      count: metrics.count,
    };
  }
  return report;
}

function logPerformanceReport() {
  console.log("Performance report:", getPerformanceReport());
}

const eventListeners = new WeakMap();
const memoCache = new Map();

function memoize(fn) {
  return function (...args) {
    const key = JSON.stringify(args);
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    const result = fn.apply(this, args);
    memoCache.set(key, result);
    return result;
  };
}

const memoizedDiff = memoize(diff);
function diff(oldVNode, newVNode) {
  if (oldVNode == null) {
    return { type: "CREATE", newVNode };
  }

  if (newVNode == null) {
    return { type: "REMOVE" };
  }

  if (
    typeof oldVNode !== typeof newVNode ||
    (typeof oldVNode === "string" && oldVNode !== newVNode) ||
    oldVNode.type !== newVNode.type
  ) {
    return { type: "REPLACE", newVNode, oldVNode };
  }

  if (newVNode.type) {
    if (newVNode.component) {
      return {
        type: "UPDATE_COMPONENT",
        oldVNode,
        newVNode,
      };
    }

    const propsDiff = diffProps(oldVNode.props, newVNode.props);
    const childrenDiff = diffChildren(oldVNode.children, newVNode.children);

    if (propsDiff || childrenDiff) {
      return {
        type: "UPDATE",
        propsDiff,
        childrenDiff,
        newVNode,
        oldVNode,
      };
    }
  }

  return null;
}

function diffProps(oldProps, newProps) {
  const patches = [];

  for (const [key, value] of Object.entries(newProps)) {
    if (!Object.is(value, oldProps[key])) {
      patches.push({ type: "SET_PROP", key, value });
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) {
      patches.push({ type: "REMOVE_PROP", key });
    }
  }

  return patches.length ? patches : null;
}

function diffChildren(oldChildren, newChildren) {
  const patches = [];
  const oldKeyedChildren = new Map();
  const newKeyedChildren = new Map();

  // First pass: build maps of keyed children
  oldChildren.forEach((child, i) => {
    const key = child.props?.key ?? i.toString();
    oldKeyedChildren.set(key, { child, index: i });
  });

  newChildren.forEach((child, i) => {
    const key = child.props?.key ?? i.toString();
    newKeyedChildren.set(key, { child, index: i });
  });

  // Second pass: determine operations
  let lastIndex = 0;
  newChildren.forEach((newChild, newIndex) => {
    const key = newChild.props?.key ?? newIndex.toString();
    const oldChildInfo = oldKeyedChildren.get(key);

    if (oldChildInfo) {
      const childDiff = memoizedDiff(oldChildInfo.child, newChild);
      if (childDiff) {
        patches.push({ ...childDiff, index: newIndex });
      }
      if (oldChildInfo.index < lastIndex) {
        patches.push({
          type: "MOVE",
          from: oldChildInfo.index,
          to: newIndex,
        });
      } else {
        lastIndex = oldChildInfo.index;
      }
      oldKeyedChildren.delete(key);
    } else {
      patches.push({
        type: "CREATE",
        newVNode: newChild,
        index: newIndex,
      });
    }
  });

  // Remove any remaining old children
  oldKeyedChildren.forEach(({ index }) => {
    patches.push({ type: "REMOVE", index });
  });

  return patches.length ? patches : null;
}

function setEventListener(element, eventName, listener) {
  if (!eventListeners.has(element)) {
    eventListeners.set(element, new Map());
  }
  const elementListeners = eventListeners.get(element);
  elementListeners.set(eventName, listener);
}

function getEventListener(element, eventName) {
  return eventListeners.get(element)?.get(eventName);
}

function setProps(element, props) {
  Object.entries(props || {}).forEach(([key, value]) => {
    if (key.startsWith("on")) {
      const eventName = key.toLowerCase().slice(2);
      const existingListener = getEventListener(element, eventName);
      if (existingListener) {
        element.removeEventListener(eventName, existingListener);
      }
      element.addEventListener(eventName, value);
      setEventListener(element, eventName, value);
    } else if (key === "value") {
      element.value = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (key === "className") {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });
}

function cleanupElement(element) {
  if (element.nodeType === Node.ELEMENT_NODE) {
    Array.from(element.children).forEach(cleanupElement);
    recycleElement(element);
  }
}

function createElement(vNode) {
  startMeasure("createElement");

  if (typeof vNode === "string") {
    return document.createTextNode(vNode);
  }

  if (vNode.component) {
    const componentInstance = vNode.component;
    componentInstance.props = vNode.props || {};
    const element = document.createElement("div");
    componentInstance.mount(element);
    return element;
  }

  const element = document.createElement(vNode.type);

  if (vNode.props && vNode.props.key !== undefined) {
    element.setAttribute('key', vNode.props.key);
  }

  setProps(element, vNode.props);

  if (Array.isArray(vNode.children)) {
    vNode.children.forEach((child) => {
      const childElement = createElement(child);
      element.appendChild(childElement);
    });
  } else if (vNode.children) {
    const childElement = createElement(vNode.children);
    element.appendChild(childElement);
  }

  executeLifecycleMethod("componentDidMount", element);

  endMeasure("createElement");
  return element;
}

let pendingUpdates = [];
let updateScheduled = false;

let uniqueKeyCounter = 0;

function generateUniqueKey() {
  return `key_${uniqueKeyCounter++}`;
}

export { generateUniqueKey };

function scheduleDOMUpdate(update) {
  pendingUpdates.push(update);
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(processDOMUpdates);
  }
}

function processDOMUpdates() {
  startMeasure("processDOMUpdates");
  const updates = pendingUpdates;
  pendingUpdates = [];
  updateScheduled = false;
  updates.forEach((update) => update());
  endMeasure("processDOMUpdates");
}

function patch(parent, patches, index = 0) {
  startMeasure("patch");
  if (!parent) {
    console.warn("Attempted to patch with undefined parent", patches);
    return;
  }

  if (!patches) return;

  if (!Array.isArray(patches)) {
    patches = [patches];
  }

  patches.forEach((patch) => {
    if (patch.type === "MOVE") {
      scheduleDOMUpdate(() => {
        const elementToMove = parent.childNodes[patch.from];
        if (elementToMove) {
          parent.insertBefore(
            elementToMove,
            parent.childNodes[patch.to] || null
          );
        } else {
          console.warn("Unable to move: child node not found", patch);
        }
      });
      return;
    }

    const target = parent.childNodes[index];

    try {
      switch (patch.type) {
        case "CREATE":
          scheduleDOMUpdate(() => {
            const newElement = createElement(patch.newVNode);
            parent.insertBefore(newElement, parent.childNodes[patch.index] || null);
            executeLifecycleMethod("componentDidMount", newElement);
          });
          break;
        case "REMOVE":
          if (target) {
            scheduleDOMUpdate(() => {
              executeLifecycleMethod("componentWillUnmount", target);
              cleanupElement(target);
              parent.removeChild(target);
            });
          }
          break;
        case "REPLACE":
          scheduleDOMUpdate(() => {
            const replacementElement = createElement(patch.newVNode);
            executeLifecycleMethod("componentWillUnmount", target);
            cleanupElement(target);
            parent.replaceChild(replacementElement, target);
            executeLifecycleMethod("componentDidMount", replacementElement);
          });
          break;
        case "UPDATE":
          scheduleDOMUpdate(() => {
            patchProps(target, patch.propsDiff);
            patchChildren(target, patch.childrenDiff);
            executeLifecycleMethod(
              "componentDidUpdate",
              target,
              patch.oldVNode.props,
              patch.newVNode.props
            );
          });
          break;
        case "UPDATE_COMPONENT":
          scheduleDOMUpdate(() => {
            const componentInstance = patch.newVNode.component;
            componentInstance.props = patch.newVNode.props;
            // Pass children to the component
            componentInstance.props.children = patch.newVNode.children;
            componentInstance.updateView();
          });
          break;
        case "MOVE":
          scheduleDOMUpdate(() => {
            const elementToMove = parent.childNodes[patch.from];
            parent.insertBefore(
              elementToMove,
              parent.childNodes[patch.to] || null
            );
          });
          break;
      }
    } catch (error) {
      handleError(error, parent);
    }
  });
  endMeasure("patch");
}

function patchProps(element, patches) {
  if (!patches) return;
  patches.forEach((patch) => {
    if (patch.type === "SET_PROP") {
      if (patch.key.startsWith("on") && element) {
        const eventName = patch.key.toLowerCase().slice(2);
        const existingListener = getEventListener(element, eventName);
        if (existingListener) {
          element.removeEventListener(eventName, existingListener);
        }
        element.addEventListener(eventName, patch.value);
        setEventListener(element, eventName, patch.value);
      } else if (patch.key === "value" && element) {
        element.value = patch.value;
      } else if (element) {
        element.setAttribute(patch.key, patch.value);
      }
    } else if (patch.type === "REMOVE_PROP" && element) {
      if (patch.key.startsWith("on")) {
        const eventName = patch.key.toLowerCase().slice(2);
        const existingListener = getEventListener(element, eventName);
        if (existingListener) {
          element.removeEventListener(eventName, existingListener);
          eventListeners.get(element).delete(eventName);
        }
      } else {
        element.removeAttribute(patch.key);
      }
    }
  });
}

function patchChildren(parent, patches) {
  if (!patches) return;
  if (!Array.isArray(patches)) {
    patches = [patches];
  }
  patches.forEach((childPatch) => {
    patch(parent, childPatch, childPatch.index);
  });
}

function displayGlobalError(error) {
  const errorContainer = document.createElement("div");
  errorContainer.style.cssText =
    "background-color: #ffebee; color: #b71c1c; padding: 20px; margin: 20px; border: 1px solid #ef9a9a; border-radius: 4px;";

  const errorTitle = document.createElement("h2");
  errorTitle.textContent = "An unexpected error occurred";

  const errorMessage = document.createElement("p");
  errorMessage.textContent = error.message;

  const errorStack = document.createElement("pre");
  errorStack.textContent = error.stack;
  errorStack.style.cssText =
    "white-space: pre-wrap; font-size: 12px; margin-top: 10px;";

  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  errorContainer.appendChild(errorStack);

  document.body.insertBefore(errorContainer, document.body.firstChild);
}

function scheduleIdleUpdate(component) {
  requestIdleCallback(() => component.updateView());
}

class ErrorBoundary {
  constructor(fallback) {
    this.fallback = fallback;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleError(error) {
    this.state = ErrorBoundary.getDerivedStateFromError(error);
    this.updateView();
  }

  render() {
    if (this.state.hasError) {
      return this.fallback(this.state.error);
    }
    return this.props.children;
  }

  updateView() {
    const newVNode = this.render();
    const patches = diff(this.vdom, newVNode);
    patch(this.el, patches);
    this.vdom = newVNode;
  }
}

function handleError(error, element) {
  let currentElement = element;
  while (currentElement) {
    if (currentElement._errorBoundary) {
      const errorBoundary = currentElement._errorBoundary;
      errorBoundary.handleError(error);
      return;
    }
    currentElement = currentElement.parentElement;
  }
  // If no error boundary found, display error in the DOM
  displayErrorInDOM(error);
}

function displayErrorInDOM(error) {
  const errorContainer = document.createElement("div");
  errorContainer.style.cssText =
    "background-color: #ffebee; color: #b71c1c; padding: 20px; margin: 20px; border: 1px solid #ef9a9a; border-radius: 4px; font-family: Arial, sans-serif;";

  const errorTitle = document.createElement("h2");
  errorTitle.textContent = "An error occurred";

  const errorMessage = document.createElement("p");
  errorMessage.textContent = error.message;

  const errorStack = document.createElement("pre");
  errorStack.textContent = error.stack;
  errorStack.style.cssText =
    "white-space: pre-wrap; font-size: 12px; margin-top: 10px; background-color: #f8f8f8; padding: 10px; border-radius: 4px;";

  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  errorContainer.appendChild(errorStack);

  // Find the app root element or use body as fallback
  const appRoot = document.querySelector("#app") || document.body;
  appRoot.innerHTML = "";
  appRoot.appendChild(errorContainer);
}

class PureComponent {
  shouldUpdate(newProps, newState) {
    return (
      !shallowEqual(this.props, newProps) || !shallowEqual(this.state, newState)
    );
  }
}

function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
    if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) return false;
  }
  return true;
}

export {
  diff,
  createElement,
  patch,
  setProps,
  patchProps,
  patchChildren,
  displayGlobalError,
  scheduleIdleUpdate,
  PureComponent,
  logPerformanceReport,
  ErrorBoundary,
  handleError,
  displayErrorInDOM,
};
