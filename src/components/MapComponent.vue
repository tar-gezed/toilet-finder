<template>
  <div>
    <l-map
      ref="map"
      v-model="zoom"
      v-model:zoom="zoom"
      :center="[latitude, longitude]"
      @update:bounds="boundsUpdated"
      @move="log('move')"
      @ready="onLoad"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
      <l-control-layers />

      <l-marker v-for="{tags, lat, lon, id} in toiletMarkers" :key="id" :lat-lng="[lat, lon]">
        <l-tooltip>
          <ul>
            <li v-for="(tagValue, tagKey) in tags">
              {{ tagKey }}: {{ tagValue }}
            </li>
          </ul>
        </l-tooltip>
      </l-marker>

      <!-- <l-marker :lat-lng="[47.41322, -1.219482]">
        <l-icon :icon-url="iconUrl" :icon-size="iconSize" />
      </l-marker>

      <l-marker :lat-lng="[50, 50]" draggable @moveend="log('moveend')">
        <l-popup> lol </l-popup>
      </l-marker> -->

      <!-- <l-polyline
        :lat-lngs="[
          [47.334852, -1.509485],
          [47.342596, -1.328731],
          [47.241487, -1.190568],
          [47.234787, -1.358337],
        ]"
        color="green"
      ></l-polyline>
      <l-polygon
        :lat-lngs="[
          [46.334852, -1.509485],
          [46.342596, -1.328731],
          [46.241487, -1.190568],
          [46.234787, -1.358337],
        ]"
        color="#41b782"
        :fill="true"
        :fillOpacity="0.5"
        fillColor="#41b782"
      />
      <l-rectangle
        :lat-lngs="[
          [46.334852, -1.509485],
          [46.342596, -1.328731],
          [46.241487, -1.190568],
          [46.234787, -1.358337],
        ]"
        :fill="true"
        color="#35495d"
      />
      <l-rectangle
        :bounds="[
          [46.334852, -1.190568],
          [46.241487, -1.090357],
        ]"
      >
        <l-popup> lol </l-popup>
      </l-rectangle> -->
    </l-map>
    <button @click="changeIcon">New kitten icon</button>
  </div>
</template>

<script lang="ts">
import {
  LMap,
  LIcon,
  LTileLayer,
  LMarker,
  LControlLayers,
  LTooltip,
  LPopup,
  LPolyline,
  LPolygon,
  LRectangle,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { defineComponent } from "vue";
import type { PropType } from "vue";
import axios from "axios";
import { debounce } from "lodash";
import OverpassApi, { type OverpassElement } from '../services/overpass-api';

export default defineComponent({
  components: {
    LMap,
    LIcon,
    LTileLayer,
    LMarker,
    LControlLayers,
    LTooltip,
    LPopup,
    LPolyline,
    LPolygon,
    LRectangle,
  },
  data() {
    return {
      zoom: 13,
      userCoords: {} as GeolocationPosition,
      latitude: 45,
      longitude: 12,
      iconWidth: 25,
      iconHeight: 40,
      map: null,
      bounds: null,
      toiletMarkers: [] as OverpassElement[]
    };
  },
  computed: {
    iconUrl() {
      return `https://placekitten.com/${this.iconWidth}/${this.iconHeight}`;
    },
    iconSize() {
      return [this.iconWidth, this.iconHeight];
    },
  },
  created() {
    this.boundsUpdated = debounce(this.loadToiletMarkers, 3000)
  },
  // async created() {
  //   try {
  //     const res = await axios.get(`http://localhost:3000/items`);
  //     this.items = res.data;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },
  methods: {
    log(a: any) {
      console.log(a);
    },
    changeIcon() {
      console.log("toto", this.userCoords);
      this.latitude = 1;
      this.longitude = 1;
      this.iconWidth += 2;
      if (this.iconWidth > this.iconHeight) {
        this.iconWidth = Math.floor(this.iconHeight / 2);
      }
    },
    onLoad() {
      this.map = (this.$refs?.["map"] as any).leafletObject;
      console.log((this.map as any).getBounds(), this.bounds)
      if (window.navigator.geolocation) {
        // Geolocation available
        window.navigator.geolocation.getCurrentPosition((coords) => {
          console.log(coords);
          this.latitude = coords.coords.latitude;
          this.longitude = coords.coords.longitude;
        }, console.error);
      }
    },
    boundsUpdated(bounds: any) {
      console.log("oeirpgkjdhgkljdsfhl");
    },
    async loadToiletMarkers(bounds: any) {
        this.bounds = bounds;
        console.log("Bounds: ", bounds);
        this.toiletMarkers = await OverpassApi.searchToiletSpots(bounds);
    }

  },
});
</script>
