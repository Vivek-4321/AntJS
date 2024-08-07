# 🐜 Ant.js Framework Documentation

Welcome to the Ant.js framework documentation! This guide will help you get started with building powerful and reactive web applications using Ant.js. Let's explore the features and concepts that make Ant.js a great choice for your next project.

## Table of Contents
1. [Introduction](#introduction)
2. [Creating Components](#creating-components)
3. [Component Structure](#component-structure)
4. [Data Binding and Reactivity](#data-binding-and-reactivity)
5. [Event Handling](#event-handling)
6. [Lifecycle Hooks](#lifecycle-hooks)
7. [State Management](#state-management)
8. [Routing](#routing)
9. [Styling](#styling)
10. [Best Practices](#best-practices)

## 1. Introduction 🚀

Ant.js is a lightweight and intuitive framework for building reactive web applications. It provides a component-based architecture, state management, and routing out of the box, making it easy to create dynamic and interactive user interfaces.

## 2. Creating Components 🏗️

In Ant.js, components are the building blocks of your application. Each component is defined in a `.ant` file, which contains the template, script, and style for that component.

To create a new component, create a file with the `.ant` extension, for example, `MyComponent.ant`.

## 3. Component Structure 📐

A typical Ant.js component consists of three main sections: template, script, and style. Here's the basic structure:

```html
<template>
  <!-- Your HTML template goes here -->
</template>

<script>
  // Your component logic goes here
</script>

<style>
  /* Your component-specific styles go here */
</style>
```

Let's break down each section:

### Template 🖼️

The template section contains your HTML markup. You can use directives and expressions to create dynamic content:

```html
<template>
  <div class="greeting">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### Script 📜

The script section defines your component's logic, including data, methods, and lifecycle hooks:

```html
<script>
data = {
  title: 'Welcome to Ant.js',
  count: 0
};

methods = {
  increment() {
    data.count++;
  }
};

onMounted = () => {
  console.log("Component mounted");
};
</script>
```

### Style 🎨

The style section contains component-specific CSS:

```html
<style>
.greeting {
  font-family: Arial, sans-serif;
  text-align: center;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
}
</style>
```

## 4. Data Binding and Reactivity ⚡

Ant.js provides reactive data binding out of the box. You can use double curly braces `{{ }}` to display data in your template:

```html
<template>
  <p>{{ message }}</p>
</template>

<script>
data = {
  message: 'Hello, Ant.js!'
};
</script>
```

## 5. Event Handling 🖱️

Handling events in Ant.js is straightforward. Use the `@` symbol followed by the event name to bind methods to events:

```html
<template>
  <button @click="handleClick">Click me</button>
</template>

<script>
methods = {
  handleClick() {
    console.log('Button clicked!');
  }
};
</script>
```

## 6. Lifecycle Hooks 🔄

Ant.js provides lifecycle hooks to perform actions at specific stages of a component's lifecycle:

```html
<script>
onMounted = () => {
  console.log('Component mounted');
};

onUpdated = () => {
  console.log('Component updated');
};

onUnmounted = () => {
  console.log('Component unmounted');
};
</script>
```

## 7. State Management 📊

Ant.js includes a built-in state management system. You can define and use stores to manage application-wide state:

```javascript
// todoStore.js
import { defineStore } from './antFramework.js';

export const todoStore = defineStore('todo', {
  state: {
    todos: []
  },
  actions: {
    addTodo(text) {
      this.todos.push({ id: Date.now(), text, completed: false });
    },
    toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo(id) {
      this.todos = this.todos.filter(t => t.id !== id);
    }
  }
});

// In your component
<script>
import { todoStore } from './todoStore.js';

const { state: todoState, actions: todoActions } = useStore('todo');

data = {
  newTodo: '',
  get todos() {
    return todoState.todos;
  }
};

methods = {
  addTodo() {
    if (data.newTodo.trim()) {
      todoActions.addTodo(data.newTodo.trim());
      data.newTodo = '';
    }
  },
  toggleTodo(id) {
    todoActions.toggleTodo(id);
  },
  removeTodo(id) {
    todoActions.removeTodo(id);
  }
};
</script>
```

## 8. Routing 🛣️

Ant.js comes with a built-in router for managing navigation in your application. Here's how to set up and use the router:

```javascript
// main.js
import { createComponent, router } from "./antFramework.js";

async function initializeApp() {
  try {
    // Configure router
    router.mode = 'browser'; // or 'hash'
    router.root = '/';
    router.notFoundComponent = "./NotFound.ant";

    // Set loading indicator
    router.setLoadingIndicator("./LoadingIndicator.ant");

    // Define routes
    router.addRoute("/", "./Home.ant", { loadingMessage: "Loading Home page..." });
    router.addRoute("/about", "./About.ant", { showLoading: false });
    router.addRoute("/contact", "./Contact.ant");

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
  }
}

initializeApp();
```

To use the router in your components:

```html
<template>
  <nav>
    <a router-link href="/">Home</a>
    <a router-link href="/about">About</a>
    <a router-link href="/contact">Contact</a>
  </nav>
</template>

<script>
methods = {
  goToAbout() {
    this.navigate('/about');
  }
};
</script>
```

## 9. Styling 🎭

Ant.js supports both inline styles and separate CSS files:

### Inline Styles

```html
<style>
.my-component {
  background-color: #f0f0f0;
  padding: 20px;
}
</style>
```

### External CSS

You can import external CSS files in your component's script section:

```html
<script>
import "./MyComponent.css";

// Rest of your component logic
</script>
```

## 10. Best Practices 🏆

1. **Keep components small and focused**: Each component should have a single responsibility.
2. **Use props for parent-child communication**: Pass data down to child components using props.
3. **Leverage the built-in state management**: Use stores for managing application-wide state.
4. **Follow a consistent naming convention**: Use descriptive names for components, methods, and variables.
5. **Separate concerns**: Keep template, script, and style sections organized and focused on their respective responsibilities.
6. **Use lifecycle hooks wisely**: Perform setup and cleanup operations in the appropriate lifecycle hooks.
7. **Optimize performance**: Use computed properties and avoid unnecessary reactivity.
8. **Handle errors gracefully**: Implement error boundaries and provide meaningful error messages to users.
9. **Write clean and readable code**: Use proper indentation, meaningful variable names, and add comments where necessary.
10. **Test your components**: Write unit tests for your components to ensure they behave as expected.

By following these guidelines and exploring the features of Ant.js, you'll be well on your way to building robust and efficient web applications. Happy coding with Ant.js! 🐜✨
