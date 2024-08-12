// // utils/lazyLoad.js
// import { createComponent } from "./template.js";

// const Suspense = createComponent(`
//   <template>
//     <div>
//       <div v-if="isLoading">{{ fallback }}</div>
//       <div v-if="!isLoading">
//         <slot></slot>
//       </div>
//     </div>
//   </template>

//   <script>
//     props = {
//       fallback: "Loading...",
//     };

//     data = {
//       isLoading: true,
//     };

//     onMounted(() => {
//       // This will be called by the parent component when the lazy-loaded component is ready
//       component.setLoaded = () => {
//         data.isLoading = false;
//       };
//     });
//   </script>
// `);

// function lazyLoad(importFunc) {
//     return async (router) => {
//       try {
//         const module = await importFunc();
//         return module.default;
//       } catch (error) {
//         console.error('Error lazy loading component:', error);
//         throw error;
//       }
//     };
//   }

// export { lazyLoad, Suspense };


//lazyLoad.js
import { createComponent } from "./antFramework.js";

const Suspense = (customFallback) => createComponent(`
    <template>
      <div>
        <div v-if="isLoading">${customFallback || '{{ fallback }}'}</div>
        <div v-if="!isLoading">
        </div>
      </div>
    </template>
  
    <script>
      props = {
        fallback: "",
      };
  
      data = {
        isLoading: true,
      };
  
      onMounted(() => {
        component.setLoaded = () => {
          data.isLoading = false;
          component.updateView();
        };
  
        component.getSlotElement = () => {
          return component.el.querySelector('div:not([v-if])');
        };
      });
    </script>
  `);
  
function lazyLoad(importFunc) {
  return async (router) => {
    try {
      const module = await importFunc();
      return module.default;
    } catch (error) {
      console.error('Error lazy loading component:', error);
      throw error;
    }
  };
}

export { lazyLoad, Suspense };