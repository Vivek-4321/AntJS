// Scheduler.js
class PriorityQueue {
    constructor() {
      this.queue = [];
    }
  
    enqueue(element, priority) {
      this.queue.push({ element, priority });
      this.sort();
    }
  
    dequeue() {
      if (this.isEmpty()) {
        return null;
      }
      return this.queue.shift().element;
    }
  
    isEmpty() {
      return this.queue.length === 0;
    }
  
    sort() {
      this.queue.sort((a, b) => a.priority - b.priority);
    }
  }
  
  // Asynchronous rendering scheduler
  const scheduler = {
    priorityQueue: new PriorityQueue(),
    isRendering: false,
    currentTask: null,
    isBatching: false,
    batchedUpdates: [],
  
    scheduleUpdate(effect, priority) {
      if (this.isBatching) {
        this.batchedUpdates.push({ effect, priority });
      } else {
        this.priorityQueue.enqueue(effect, priority);
        if (!this.isRendering) {
          this.processQueue();
        }
      }
    },
  
    processQueue() {
      if (this.priorityQueue.isEmpty()) {
        this.isRendering = false;
        return;
      }
  
      this.isRendering = true;
      this.currentTask = this.priorityQueue.dequeue();
  
      requestIdleCallback((deadline) => {
        while (deadline.timeRemaining() > 0 && this.currentTask) {
          this.currentTask();
          this.currentTask = this.priorityQueue.dequeue();
        }
  
        if (this.currentTask) {
          requestIdleCallback(this.processQueue.bind(this));
        } else {
          this.isRendering = false;
        }
      });
    },
  
    interruptCurrentTask(newTask, priority) {
      if (this.currentTask) {
        this.priorityQueue.enqueue(this.currentTask, priority + 1);
      }
      this.currentTask = newTask;
    },
  
    startBatch() {
      this.isBatching = true;
      this.batchedUpdates = [];
    },
  
    endBatch() {
      this.isBatching = false;
      this.batchedUpdates.forEach(({ effect, priority }) => {
        this.priorityQueue.enqueue(effect, priority);
      });
      this.batchedUpdates = [];
      if (!this.isRendering) {
        this.processQueue();
      }
    }
  };
  
  function batchUpdates(updates) {
    scheduler.startBatch();
    updates();
    scheduler.endBatch();
  }

  export { scheduler, batchUpdates };