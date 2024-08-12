// store.js

import { reactive } from './reactivity.js';

const state = reactive({
  counter: {
    count: 0
  },
  todo: {
    newTodo: '',
    todos: [],
    nextTodoId: 1
  }
});

const getters = {
  completedTodos: () => state.todo.todos.filter(todo => todo.completed),
  incompleteTodos: () => state.todo.todos.filter(todo => !todo.completed)
};

const actions = {
  incrementCounter() {
    state.counter.count++;
  },
  addTodo() {
    if (state.todo.newTodo.trim()) {
      const newTodo = {
        id: state.todo.nextTodoId,
        text: state.todo.newTodo.trim(),
        completed: false
      };
      state.todo.todos.push(newTodo);
      state.todo.nextTodoId++;
      state.todo.newTodo = '';
    }
  },
  toggleTodo(todoId) {
    const todo = state.todo.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
    }
  },
  removeTodo(todoId) {
    state.todo.todos = state.todo.todos.filter(todo => todo.id !== todoId);
  }
};

export { state, getters, actions };