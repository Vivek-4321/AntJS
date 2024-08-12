// todoStore.js
import { defineStore } from "../../utils/stateManagement.js";

export const todoStore = defineStore("todo", ({ state, actions }) => {
  // Define initial state
  state.todos = [];
  state.nextTodoId = 1;

  // Define actions
  actions.addTodo = (text) => {
    state.todos.push({
      id: state.nextTodoId++,
      text,
      completed: false,
    });
  };

  actions.toggleTodo = (id) => {
    const todo = state.todos.find((todo) => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  actions.removeTodo = (id) => {
    state.todos = state.todos.filter((todo) => todo.id !== id);
  };
});
