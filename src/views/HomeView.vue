<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue'
import MapComponent from '../components/MapComponent.vue'
import MapComponentComposition from '../components/MapComponentComposition.vue'
</script>

<template>
  <main class="main-container">
    <!-- <MapComponent /> -->
    <MapComponentComposition />
    <!-- <HelloWorld msg="toto"></HelloWorld> -->
  </main>
</template>

<style scoped>
.main-container {
  display: flex;
  flex: 1;
}
</style>
