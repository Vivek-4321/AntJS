// antFetch.js
const antFetch = {
  async request(url, options = {}) {
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (mergedOptions.body && typeof mergedOptions.body === "object") {
      mergedOptions.body = JSON.stringify(mergedOptions.body);
    }

    try {
      const response = await fetch(url, mergedOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  },

  get(url, options = {}) {
    return this.request(url, { ...options, method: "GET" });
  },

  post(url, data, options = {}) {
    return this.request(url, { ...options, method: "POST", body: data });
  },

  put(url, data, options = {}) {
    return this.request(url, { ...options, method: "PUT", body: data });
  },

  delete(url, options = {}) {
    return this.request(url, { ...options, method: "DELETE" });
  },
};

export default antFetch;
