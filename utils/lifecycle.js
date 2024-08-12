const lifecycleMethods = {
    componentDidMount: [],
    componentDidUpdate: [],
    componentWillUnmount: [],
    componentDidCatch: [],
  };
  
  export function registerLifecycleMethod(method, callback) {
    lifecycleMethods[method].push(callback);
  }
  
  export function executeLifecycleMethod(method, ...args) {
    lifecycleMethods[method].forEach(callback => callback(...args));
  }
  
  export function onMounted(callback) {
    registerLifecycleMethod('componentDidMount', callback);
  }
  
  export function onUpdated(callback) {
    registerLifecycleMethod('componentDidUpdate', callback);
  }
  
  export function onUnmounted(callback) {
    registerLifecycleMethod('componentWillUnmount', callback);
  }