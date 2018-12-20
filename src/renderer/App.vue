<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'my-project'
  }
</script>

<style>
  /* CSS */
  
::-webkit-scrollbar{
  width: 6px;
  height: 4px;
}
::-webkit-scrollbar-thumb{
  border-radius: 1em;
  background-color: rgba(0, 0, 0, 0.308);
}
::-webkit-scrollbar-track{
  /* border-radius: 1em; */
  background-color: rgba(255, 255, 255, 0.815);
}
</style>
