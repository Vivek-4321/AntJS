# 🚀 AntFramework Documentation

Welcome to the AntFramework documentation! This guide will help you create powerful web applications using components, state management, and routing. Let's dive in! 🏊‍♂️

## 📦 Creating Components

Components are the building blocks of your application. Here's how to create one:

```html
<!-- MyComponent.ant -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="incrementCount">Count: {{ count }}</button>
  </div>
</template>

<script>
  data = {
    title: "My Component",
    message: "Hello, AntFramework!",
    count: 0
  };

  methods = {
    incrementCount() {
      this.data.count++;
    }
  };

  onMounted() {
    console.log("Component mounted!");
  }
</script>

<style>
  h1 {
    color: #333;
  }
  button {
    background-color: #4caf50;
    color: white;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
  }
</style>
```

### 🔑 Key Features:

- `<template>`: Contains the HTML structure of your component
- `<script>`: Defines component logic, data, and methods
- `<style>`: Adds component-specific styles

## 🗃️ State Management

AntFramework provides a powerful state management system. Here's how to use it:

1. Define a store:

```javascript
// userStore.js
import { defineStore } from "./stateManagement.js";

export const useUserStore = defineStore("user", {
  state: {
    username: "",
    isLoggedIn: false,
  },
  actions: {
    login(username) {
      this.state.username = username;
      this.state.isLoggedIn = true;
    },
    logout() {
      this.state.username = "";
      this.state.isLoggedIn = false;
    },
  },
});
```

2. Use the store in a component:

```html
<!-- Login.ant -->
<template>
  <div>
    <input v-model="username" placeholder="Username" />
    <button @click="login">Login</button>
  </div>
</template>

<script>
  import { useUserStore } from "./userStore.js";

  const userStore = useUserStore();

  data = {
    username: "",
  };

  methods = {
    login() {
      userStore.actions.login(this.data.username);
      this.navigate("/dashboard");
    },
  };
</script>
```

## 🛣️ Routing

AntFramework includes a built-in router. Here's how to set it up:

```javascript
// main.js
import { createComponent } from "./antFramework.js";
import router from "./router.js";

async function initializeApp() {
  router.addRoute("/", async () => {
    const homeContent = await fetch("./Home.ant").then((r) => r.text());
    return await createComponent(homeContent);
  });

  router.addRoute("/about", async () => {
    const aboutContent = await fetch("./About.ant").then((r) => r.text());
    return await createComponent(aboutContent);
  });

  router.setViewElement("#app");
  router.handleRouteChange();
}

initializeApp();
```

To create links in your components:

```html
<a href="/" router-link>Home</a> <a href="/about" router-link>About</a>
```

To navigate programmatically:

```javascript
methods = {
  goToAbout() {
    this.navigate("/about");
  },
};
```

## 📥 Input Handling

AntFramework makes it easy to handle user input:

```html
<template>
  <div>
    <input v-model="name" placeholder="Enter your name" />
    <button @click="greet">Greet</button>
    <p>{{ greeting }}</p>
  </div>
</template>

<script>
  data = {
    name: "",
    greeting: "",
  };

  methods = {
    greet() {
      this.data.greeting = `Hello, ${this.data.name}!`;
    },
  };
</script>
```

## 🔄 Lifecycle Hooks

AntFramework provides lifecycle hooks for better control:

```javascript
onMounted() {
  console.log("Component is mounted!");
}

onUpdated() {
  console.log("Component is updated!");
}

onUnmounted() {
  console.log("Component is unmounted!");
}
```

## 🎨 Directives

AntFramework includes several useful directives:

- `v-if`: Conditional rendering
- `v-for`: List rendering
- `v-model`: Two-way data binding
- `v-bind` or `:`: Attribute binding
- `v-on` or `@`: Event handling

Example:

```html
<template>
  <div>
    <ul>
      <li v-for="item in items" :key="item.id">
        <span :class="{ 'completed': item.done }">{{ item.text }}</span>
        <button @click="toggleItem(item.id)">Toggle</button>
      </li>
    </ul>
  </div>
</template>

<script>
  data = {
    items: [
      { id: 1, text: "Learn AntFramework", done: false },
      { id: 2, text: "Build an app", done: false },
    ],
  };

  methods = {
    toggleItem(id) {
      const item = this.data.items.find((i) => i.id === id);
      if (item) item.done = !item.done;
    },
  };
</script>
```

## 🚀 Conclusion

AntFramework provides a powerful set of tools for building modern web applications. With components, state management, routing, and more, you can create robust and scalable apps with ease. Happy coding! 🎉

For more advanced features and detailed API references, please check out our full documentation website.
`