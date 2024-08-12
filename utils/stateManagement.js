// stateManagement.js

const stores = {};

export const defineStore = (storeName, storeSetup) => {
  if (stores[storeName]) {
    console.warn(`Store "${storeName}" already exists. Overwriting...`);
  }

  const state = {};
  const actions = {};

  // Call storeSetup to populate state and actions
  storeSetup({ state, actions });

  // Create reactive state
  const reactiveState = new Proxy(state, {
    set(target, key, value) {
      target[key] = value;
      notifySubscribers(storeName);
      return true;
    },
  });

  // Wrap actions to trigger updates
  Object.keys(actions).forEach((actionName) => {
    const originalAction = actions[actionName];
    actions[actionName] = (...args) => {
      const result = originalAction.apply(
        { state: reactiveState, actions },
        args
      );
      notifySubscribers(storeName);
      return result;
    };
  });

  stores[storeName] = {
    state: reactiveState,
    actions,
    subscribers: [],
  };

  return stores[storeName];
};

export const useStore = (storeName) => {
  if (!stores[storeName]) {
    console.error(`Store "${storeName}" not found.`);
    return null;
  }

  return {
    state: stores[storeName].state,
    actions: stores[storeName].actions,
    subscribe: (callback) => {
      stores[storeName].subscribers.push(callback);
      return () => {
        const index = stores[storeName].subscribers.indexOf(callback);
        if (index > -1) {
          stores[storeName].subscribers.splice(index, 1);
        }
      };
    },
  };
};

const notifySubscribers = (storeName) => {
  stores[storeName].subscribers.forEach((callback) => callback());
};
