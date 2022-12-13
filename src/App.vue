<template>
  <div id="app">
    <HomePage/>
  </div>
</template>

<script>
  import HomePage from './components/HomePage.vue';
  import load from "../public/load.gif"
  export default {
    name: 'App',
    components : {
      HomePage
    },
    data() {
      return{
        load: load
      }
    }
  }
</script>

<style>
#app {
}
</style>
 