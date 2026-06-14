<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>

<style>
@import "@/assets/base.css";

#app {
  display: flex;
  flex: 1;
  height: 100vh;
  margin: 0 auto;
  overflow: hidden;
  font-weight: normal;
}

@media (hover: hover) {
  a:hover {
    cursor: pointer;
  }
}
</style>
