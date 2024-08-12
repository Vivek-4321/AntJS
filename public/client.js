(function() {
  const socket = new WebSocket(`http://localhost:3000`);

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('🔄 Reloading page due to file changes...');
      location.reload();
    }
  });

  socket.addEventListener('open', () => {
    console.log('🔌 Hot reload connected');
  });

  socket.addEventListener('close', () => {
    console.log('🔌 Hot reload disconnected. Attempting to reconnect...');
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
})();