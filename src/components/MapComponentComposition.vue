<template>
  <div class="map-container">
    <l-map
      ref="mapLeaflet"
      v-model="mapState.zoom"
      v-model:zoom="mapState.zoom"
      :center="[mapState.latitude, mapState.longitude]"
      @update:bounds="boundsUpdated"
      @ready="onLoad"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
      <!-- <l-control-layers /> -->
      <l-control position="topright">
        <!-- <button @click="log('click')">
          I am a useless button!
        </button> -->
        <div class="options-panel">
          <a class="toggle-menu" @click="showOption = !showOption"
          :class="{ active: showOption }"
          >
            <i></i>
            <i></i>
            <i></i>
          </a>

          <transition name="expand">

          <div class="options" v-show="showOption">
            <!-- <div>Checked options: {{ checkedOptions }}</div> -->
            <ul class="options-list">
              <li class="options-item">
                <input
                  type="checkbox"
                  id="free"
                  value="fee_no"
                  v-model="checkedOptions"
                />
                <label for="free">Free only</label>
              </li>
              <li class="options-item">
                <input
                  type="checkbox"
                  id="wheelchair"
                  value="wheelchair"
                  v-model="checkedOptions"
                />
                <label for="wheelchair">Wheelchair ?</label>
              </li>
              <li class="options-item">
                <input
                  type="checkbox"
                  id="drinking_water"
                  value="drinking_water"
                  v-model="checkedOptions"
                />
                <label for="drinking_water">Drinking water ?</label>
              </li>
            </ul>
          </div>

          </transition>
        </div>
      </l-control>

      <l-marker
              :lat-lng="[mapState.latitude, mapState.longitude]"
              :icon="userIcon"
            />

      <l-circle
      :lat-lng="[mapState.latitude, mapState.longitude]"
      :radius="mapState.accuracy"
      :fill="true"
    />


      <l-marker
        v-for="{ tags, lat, lon, id } in mapState?.toiletMarkers"
        :key="id"
        :lat-lng="[lat, lon]"
      >
        <l-popup v-if="tags">
          <ul>
            <li v-for="(tagValue, tagKey) in tags">
              {{ tagKey }}: {{ tagValue }}
            </li>
          </ul>
          <a :href="`geo:${lat},${lon}`" target="_blank">Open on maps</a>
        </l-popup>
      </l-marker>
    </l-map>
    <!-- <button @click="changeIcon">New kitten icon</button> -->
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  flex: 1;
}

.options-panel {
  display: flex;
  background-color: white;
  color: black;
  min-width: 50px;
  transition: all .3s;
}

.options {
  order: 1;
}

.options-list {
    list-style-type: none;
    padding: 12px;
    font-size: medium;
  }

  .options-item input {
    margin-right: 12px;
  }

  .toggle-menu {
  width: 30px;
  height: 50px;
  display: block;
  position: relative;
  margin-left: auto;
      margin-right: 9px;
  /* display: inline-block;
  top: 10px;
  float: right; */
  z-index: 1000;
  order: 2;
}

.toggle-menu i {
  position: absolute;
  display: block;
  height: 2px;
  background: #0094FC;
  width: 30px;
  -webkit-transition: all .3s;
  transition: all .3s;
}

.toggle-menu i:nth-child(1) {
  top: 16px;
}

.toggle-menu i:nth-child(2) {
  top: 24px;
}

.toggle-menu i:nth-child(3) {
  top: 32px;
}

.toggle-menu.active i:nth-child(1) {
  top: 25px;
  -webkit-transform: rotateZ(45deg);
  transform: rotateZ(45deg);
}

.toggle-menu.active i:nth-child(2) {
  background: transparent;
}

.toggle-menu.active i:nth-child(3) {
  top: 25px;
  -webkit-transform: rotateZ(-45deg);
  transform: rotateZ(-45deg);
}

.expand-enter-active, .expand-leave-active, .expand-enter-to {
  transition: all .3s;
  max-height: 200px;
  max-width: 250px;
  overflow: hidden;
}
.expand-enter, .expand-leave-to  {
  transition: all .3s;
  max-height: 0;
  max-width: 0;
  opacity: 0;
}




</style>

<script setup lang="ts">
import {
  LMap,
  LIcon,
  LTileLayer,
  LMarker,
  LCircle,
  LControlLayers,
  LTooltip,
  LControl,
  LPopup,
  LPolyline,
  LPolygon,
  LRectangle,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { defineComponent, watch } from "vue";
import type { PropType } from "vue";
import axios from "axios";
import { debounce } from "lodash";
import OverpassApi, { type OverpassElement } from "../services/overpass-api";
import { ref, reactive } from "vue";
import { computed, type Ref } from "@vue/reactivity";
import { divIcon, icon } from 'leaflet';

const mapLeaflet = ref(null);
const checkedOptions: Ref<string[]> = ref(['fee_no']);
const showOption = ref(false);
const showCurrentLocation = ref(false);

const userIcon =  divIcon({
              html: `
                <svg viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" fill="#fff"/>
                  <circle cx="5" cy="5" r="2" fill="#1981FB">
                    <animate attributeName="r" begin="0s" dur="5s" repeatCount="indefinite" values="1.5;3;1.5"/>
                  </circle>
                </svg>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [32 / 2, 32 / 2],
      });

const mapState = reactive({
  zoom: 16,
  latitude: 45,
  longitude: 12,
  accuracy: 100,
  userCoords: {} as GeolocationPosition,
  bounds: null,
  map: {},
  toiletMarkers: [] as OverpassElement[],
});

let iconWidth = 25;
let iconHeight = 40;
let watchLocationID = 0;

const iconUrl = computed(() => {
  return `https://placekitten.com/${iconWidth}/${iconHeight}`;
});

const iconSize = computed(() => {
  return [iconWidth, iconHeight];
});

const log = (a: any) => {
  console.log(a);
};

const changeIcon = () => {
  console.log("toto", mapState.userCoords);
  mapState.latitude = 1;
  mapState.longitude = 1;
  iconWidth += 2;
  if (iconWidth > iconHeight) {
    iconWidth = Math.floor(iconHeight / 2);
  }
};

const onLoad = (event: any) => {
  console.log(event);
  mapState.map = (mapLeaflet as any).value.leafletObject;
  console.log((mapState.map as any).getBounds(), mapState.bounds);
  if (window.navigator.geolocation) {
    // Geolocation available
    window.navigator.geolocation.getCurrentPosition((position) => {
      console.log(position);
      updatePosition(position);
      loadToiletMarkers((mapState.map as any).getBounds());
    }, console.error);

    watchLocationID = navigator.geolocation.watchPosition((position) => {
      updatePosition(position);
    });
  }
};

const loadToiletMarkers = async (bounds: any) => {
  mapState.bounds = bounds;
  mapState.toiletMarkers = await OverpassApi.searchToiletSpots(bounds, checkedOptions);
};

const updatePosition = (position: GeolocationPosition) => {
  showCurrentLocation.value = true;
  mapState.latitude = position.coords.latitude;
  mapState.longitude = position.coords.longitude;
  mapState.accuracy = position.coords.accuracy;
}

const boundsUpdated = debounce(loadToiletMarkers, 1000);

watch(checkedOptions, () => boundsUpdated((mapState.map as any).getBounds()));
</script>
