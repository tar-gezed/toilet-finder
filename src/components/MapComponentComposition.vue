<template>
  <div class="app-layout">
    <!-- Modern Floating Filter Pills -->
    <div class="filter-bar">
      <button
        class="filter-pill"
        :class="{ active: checkedOptions.includes('fee_no') }"
        @click="toggleFilter('fee_no')"
      >
        <PiggyBank class="pill-icon" />
        <span>Free Toilets</span>
      </button>

      <button
        class="filter-pill"
        :class="{ active: checkedOptions.includes('wheelchair') }"
        @click="toggleFilter('wheelchair')"
      >
        <Accessibility class="pill-icon" />
        <span>Wheelchair Accessible</span>
      </button>

      <button
        class="filter-pill"
        :class="{ active: checkedOptions.includes('drinking_water') }"
        @click="toggleFilter('drinking_water')"
      >
        <Droplet class="pill-icon" />
        <span>Drinking Water Nearby</span>
      </button>
    </div>

    <!-- Map Container -->
    <div class="map-container">
      <l-map
        ref="mapLeaflet"
        :zoom="mapState.zoom"
        :center="[mapState.latitude, mapState.longitude]"
        v-model:zoom="mapState.zoom"
        @update:bounds="boundsUpdated"
        @ready="onLoad"
        @click="onMapClick"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        ></l-tile-layer>

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
          v-for="toilet in mapState?.toiletMarkers"
          :key="toilet.id"
          :lat-lng="[toilet.lat, toilet.lon]"
          @click="onMarkerClick(toilet)"
        >
          <l-popup v-if="!isMobile && toilet.tags">
            <div class="popup-detail-content">
              <h3 class="popup-title">{{ getToiletName(toilet.tags) }}</h3>
              <span
                class="popup-distance"
                v-if="getDistanceText(toilet.lat, toilet.lon)"
              >
                {{ getDistanceText(toilet.lat, toilet.lon).toUpperCase() }} AWAY
              </span>

              <div class="popup-info-list">
                <div class="popup-info-item">
                  <PiggyBank class="info-icon" />
                  <span>{{ getFeeLabel(toilet.tags) }}</span>
                </div>

                <div class="popup-info-item">
                  <Accessibility class="info-icon" />
                  <span>{{ getAccessibilityLabel(toilet.tags) }}</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="hasChangingTableInfo(toilet.tags)"
                >
                  <Baby class="info-icon" />
                  <span>{{ getChangingTableLabel(toilet.tags) }}</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="hasDrinkingWater(toilet.tags)"
                >
                  <Droplet class="info-icon" />
                  <span>Drinking Water Nearby</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="getToiletPositionLabel(toilet.tags)"
                >
                  <SquareDot class="info-icon" />
                  <span>{{ getToiletPositionLabel(toilet.tags) }}</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="getToiletDisposalLabel(toilet.tags)"
                >
                  <Globe class="info-icon" />
                  <span>{{ getToiletDisposalLabel(toilet.tags) }}</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="toilet.tags.unisex === 'yes'"
                >
                  <Users class="info-icon" />
                  <span>Unisex Restroom</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="toilet.tags['toilets:handwashing']"
                >
                  <Hand class="info-icon" />
                  <span
                    >Handwashing:
                    {{
                      toilet.tags["toilets:handwashing"] === "yes"
                        ? "Yes"
                        : "No"
                    }}</span
                  >
                </div>

                <div
                  class="popup-info-item"
                  v-if="toilet.tags['toilets:paper_provided']"
                >
                  <FileText class="info-icon" />
                  <span
                    >Toilet Paper Provided:
                    {{
                      toilet.tags["toilets:paper_provided"] === "yes"
                        ? "Yes"
                        : "No"
                    }}</span
                  >
                </div>

                <div
                  class="popup-info-item"
                  v-if="getPaymentLabel(toilet.tags)"
                >
                  <CreditCard class="info-icon" />
                  <span>Payment: {{ getPaymentLabel(toilet.tags) }}</span>
                </div>

                <div
                  class="popup-info-item"
                  v-if="getAccessTypeLabel(toilet.tags)"
                >
                  <Key class="info-icon" />
                  <span>{{ getAccessTypeLabel(toilet.tags) }}</span>
                </div>

                <div class="popup-info-item" v-if="toilet.tags.opening_hours">
                  <Clock class="info-icon" />
                  <span>Hours: {{ toilet.tags.opening_hours }}</span>
                </div>
              </div>

              <a
                class="cta-button"
                :href="getDirectionsUrl(toilet.lat, toilet.lon)"
                target="_blank"
              >
                <span>Get Directions</span>
                <navigation class="cta-icon" />
              </a>
            </div>
          </l-popup>
        </l-marker>
      </l-map>
    </div>

    <!-- Locate User FAB -->
    <button
      class="locate-fab"
      :class="{ 'offset-up': isMobile && showBottomSheet && selectedToilet }"
      @click="centerOnUserLocation"
      aria-label="Center on my location"
    >
      <Locate class="fab-icon" />
    </button>

    <!-- Bottom Sheet Backdrop -->
    <transition name="fade">
      <div
        class="bottom-sheet-backdrop"
        v-if="isMobile && showBottomSheet && selectedToilet"
        @click="showBottomSheet = false"
      ></div>
    </transition>

    <!-- Bottom Sheet Slide-Up Panel -->
    <transition name="slide-up">
      <div
        class="bottom-sheet-panel"
        v-if="isMobile && showBottomSheet && selectedToilet"
      >
        <div class="bottom-sheet-handle" @click="showBottomSheet = false"></div>

        <div class="bottom-sheet-body">
          <h2 class="bottom-sheet-title">
            {{ getToiletName(selectedToilet.tags) }}
          </h2>

          <div class="bottom-sheet-badges">
            <span
              class="badge badge-distance"
              v-if="getDistanceText(selectedToilet.lat, selectedToilet.lon)"
            >
              {{
                getDistanceText(
                  selectedToilet.lat,
                  selectedToilet.lon
                ).toUpperCase()
              }}
              AWAY
            </span>

            <span
              class="badge"
              :class="isFree(selectedToilet.tags) ? 'badge-free' : 'badge-paid'"
            >
              <PiggyBank class="badge-icon" />
              <span>{{ getFeeLabel(selectedToilet.tags) }}</span>
            </span>

            <span
              class="badge"
              :class="
                isAccessible(selectedToilet.tags)
                  ? 'badge-accessible'
                  : 'badge-inaccessible'
              "
            >
              <Accessibility class="badge-icon" />
              <span>{{ getAccessibilityLabel(selectedToilet.tags) }}</span>
            </span>

            <span
              class="badge badge-neutral"
              v-if="hasChangingTableInfo(selectedToilet.tags)"
            >
              <Baby class="badge-icon" />
              <span>{{ getChangingTableLabel(selectedToilet.tags) }}</span>
            </span>

            <span
              class="badge badge-neutral"
              v-if="hasDrinkingWater(selectedToilet.tags)"
            >
              <Droplet class="badge-icon" />
              <span>Drinking Water</span>
            </span>
          </div>

          <div class="bottom-sheet-details">
            <div
              class="detail-row"
              v-if="getToiletPositionLabel(selectedToilet.tags)"
            >
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{
                getToiletPositionLabel(selectedToilet.tags)
              }}</span>
            </div>
            <div
              class="detail-row"
              v-if="getToiletDisposalLabel(selectedToilet.tags)"
            >
              <span class="detail-label">Disposal:</span>
              <span class="detail-value">{{
                getToiletDisposalLabel(selectedToilet.tags)
              }}</span>
            </div>
            <div class="detail-row" v-if="selectedToilet.tags.unisex">
              <span class="detail-label">Unisex:</span>
              <span class="detail-value">{{
                selectedToilet.tags.unisex === "yes" ? "Yes" : "No"
              }}</span>
            </div>
            <div
              class="detail-row"
              v-if="selectedToilet.tags['toilets:handwashing']"
            >
              <span class="detail-label">Handwashing:</span>
              <span class="detail-value">{{
                selectedToilet.tags["toilets:handwashing"] === "yes"
                  ? "Yes"
                  : "No"
              }}</span>
            </div>
            <div
              class="detail-row"
              v-if="selectedToilet.tags['toilets:paper_provided']"
            >
              <span class="detail-label">Toilet Paper Provided:</span>
              <span class="detail-value">{{
                selectedToilet.tags["toilets:paper_provided"] === "yes"
                  ? "Yes"
                  : "No"
              }}</span>
            </div>
            <div class="detail-row" v-if="getPaymentLabel(selectedToilet.tags)">
              <span class="detail-label">Payment:</span>
              <span class="detail-value">{{
                getPaymentLabel(selectedToilet.tags)
              }}</span>
            </div>
            <div
              class="detail-row"
              v-if="getAccessTypeLabel(selectedToilet.tags)"
            >
              <span class="detail-label">Access:</span>
              <span class="detail-value">{{
                getAccessTypeLabel(selectedToilet.tags)
              }}</span>
            </div>
            <div class="detail-row" v-if="selectedToilet.tags.opening_hours">
              <span class="detail-label">Hours:</span>
              <span class="detail-value">{{
                selectedToilet.tags.opening_hours
              }}</span>
            </div>
          </div>

          <a
            class="bottom-sheet-cta"
            :href="getDirectionsUrl(selectedToilet.lat, selectedToilet.lon)"
            target="_blank"
          >
            <navigation class="cta-icon-large" />
            <span>Get Directions</span>
          </a>
        </div>
      </div>
    </transition>
  </div>
  <transition name="spinner">
    <div class="loading" v-show="loadingMarkers">
      <div class="loading-text">Loading data, please wait...</div>
      <spinner-component></spinner-component>
    </div>
  </transition>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.loading {
  position: absolute;
  bottom: 0;
  z-index: 10000;
  left: 50%;
  transform: translate(-50%, 0);
  background-color: rgba(32, 33, 36, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  border-radius: 16px 16px 0px 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
}

.loading-text {
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.map-container {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
}

/* Floating Filter Pills */
.filter-bar {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 6px 16px;
  background: transparent;
  box-shadow: none;
  border: none;
  scrollbar-width: none; /* Hide scrollbar Firefox */
  -webkit-overflow-scrolling: touch;
}

.filter-bar::-webkit-scrollbar {
  display: none; /* Hide scrollbar Chrome/Safari/Opera */
}

.filter-pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: white;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.filter-pill:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.filter-pill.active {
  background: #1981fb;
  color: white;
  border-color: #1981fb;
  box-shadow: 0 4px 6px -1px rgba(25, 129, 251, 0.2);
}

.pill-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.25s;
}

.filter-pill.active .pill-icon {
  transform: scale(1.05);
}

/* Locate User FAB */
.locate-fab {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 50%;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: #1981fb;
}

.locate-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.locate-fab:active {
  transform: scale(0.95);
}

.locate-fab.offset-up {
  transform: translateY(-260px); /* Lift above mobile bottom sheet */
}

@media (max-width: 480px) {
  .locate-fab.offset-up {
    transform: translateY(-280px);
  }
}

.fab-icon {
  width: 22px;
  height: 22px;
}

/* Mobile Bottom Sheet */
.bottom-sheet-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.25);
  z-index: 9998;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.bottom-sheet-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  z-index: 9999;
  box-shadow: 0 -10px 30px -10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  padding: 8px 20px 28px;
  max-height: 80vh;
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.5);
}

.bottom-sheet-handle {
  width: 36px;
  height: 5px;
  background: #cbd5e1;
  border-radius: 999px;
  align-self: center;
  margin-bottom: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.bottom-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bottom-sheet-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  margin: 0 0 4px;
}

.bottom-sheet-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.badge-distance {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.badge-free {
  background-color: #eff6ff;
  color: #1e40af;
  border: 1px solid #dbeafe;
}

.badge-paid {
  background-color: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
}

.badge-accessible {
  background-color: #f1f5f9;
  color: #334155;
}

.badge-inaccessible {
  background-color: #fef2f2;
  color: #991b1b;
}

.badge-neutral {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.badge-icon {
  width: 14px;
  height: 14px;
}

.bottom-sheet-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  line-height: 1.4;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #0f172a;
  font-weight: 600;
}

.bottom-sheet-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #1981fb;
  color: white;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  padding: 14px;
  border-radius: 16px;
  box-shadow: 0 8px 16px -4px rgba(25, 129, 251, 0.3);
  transition: all 0.2s;
  text-align: center;
  margin-top: 12px;
}

.bottom-sheet-cta:hover {
  background: #156edb;
}

.bottom-sheet-cta:active {
  transform: scale(0.98);
}

.cta-icon-large {
  width: 18px;
  height: 18px;
}

/* Spinner Transition */
.spinner-enter-active,
.spinner-leave-active {
  transition: all 0.3s ease;
}
.spinner-enter-from,
.spinner-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}
</style>

<script setup lang="ts">
import {
  LMap,
  LTileLayer,
  LMarker,
  LCircle,
  LPopup,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import {
  watch,
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  markRaw,
} from "vue";
import type { Ref } from "vue";
import { debounce } from "lodash";
import OverpassApi, { type OverpassElement } from "../services/overpass-api";
import L, { divIcon } from "leaflet";
import SpinnerComponent from "./SpinnerComponent.vue";
import { useToast } from "vue-toastification";
import {
  PiggyBank,
  Accessibility,
  Droplet,
  Baby,
  Users,
  Hand,
  FileText,
  CreditCard,
  Key,
  Clock,
  Navigation,
  Locate,
  SquareDot,
  Globe,
} from "@lucide/vue";

const mapLeaflet = ref(null);
const checkedOptions: Ref<string[]> = ref(["fee_no"]);
const showOption = ref(false);
const showCurrentLocation = ref(false);
const loadingMarkers = ref(false);

// Responsive detection
const isMobile = ref(
  typeof window !== "undefined" ? window.innerWidth < 768 : false
);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener("resize", checkMobile);
  checkMobile();
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

// Bottom sheet state
const selectedToilet = ref<OverpassElement | null>(null);
const showBottomSheet = ref(false);

const onMarkerClick = (toilet: OverpassElement) => {
  selectedToilet.value = toilet;
  if (isMobile.value) {
    showBottomSheet.value = true;
    if (mapState.map && (mapState.map as any).closePopup) {
      (mapState.map as any).closePopup();
    }
  } else {
    showBottomSheet.value = false;
  }
};

const onMapClick = () => {
  showBottomSheet.value = false;
};

// Toggle filters
const toggleFilter = (option: string) => {
  if (checkedOptions.value.includes(option)) {
    checkedOptions.value = checkedOptions.value.filter((o) => o !== option);
  } else {
    checkedOptions.value = [...checkedOptions.value, option];
  }
};

// Distance calculations
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  if (d < 1) {
    return `${Math.round(d * 1000)}m`;
  }
  return `${d.toFixed(1).replace(".", ",")}km`;
};

const getDistanceText = (toiletLat: number, toiletLon: number) => {
  if (!mapState.latitude || !mapState.longitude) return "";
  return calculateDistance(
    mapState.latitude,
    mapState.longitude,
    toiletLat,
    toiletLon
  );
};

// Label/tag helpers
const getToiletName = (tags: any) => {
  if (!tags) return "Toilettes";
  if (tags.name) return tags.name;
  if (tags.operator) return `Toilette (${tags.operator})`;
  return "Toilettes publiques";
};

const isFree = (tags: any) => {
  return !tags.fee || tags.fee === "no";
};

const getFeeLabel = (tags: any) => {
  if (!tags) return "Free to use";
  if (isFree(tags)) return "Free to use";
  if (tags.fee === "yes") return "Paid restroom";
  return `Paid (${tags.fee})`;
};

const isAccessible = (tags: any) => {
  return tags.wheelchair === "yes" || tags.wheelchair === "designated";
};

const getAccessibilityLabel = (tags: any) => {
  if (!tags || !tags.wheelchair) return "No wheelchair access";
  const val = tags.wheelchair;
  if (val === "yes" || val === "designated") return "Wheelchair accessible";
  if (val === "limited") return "Limited wheelchair access";
  return "No wheelchair access";
};

const hasChangingTable = (tags: any) => {
  return (
    tags.changing_table === "yes" ||
    tags.changing_table === "limited" ||
    tags.changing_table === "designated"
  );
};

const getChangingTableLabel = (tags: any) => {
  if (!tags || !tags.changing_table) return "No changing table";
  const val = tags.changing_table;
  if (val === "yes" || val === "designated") return "Changing table available";
  if (val === "limited") return "Limited changing table";
  return "No changing table";
};

const hasChangingTableInfo = (tags: any) => {
  return tags && tags.changing_table && tags.changing_table !== "no";
};

const hasDrinkingWater = (tags: any) => {
  return (
    tags &&
    (tags.drinking_water === "yes" ||
      tags.bottle === "yes" ||
      tags["drinking_water:legal"] === "yes")
  );
};

const getToiletPositionLabel = (tags: any) => {
  if (!tags || !tags["toilets:position"]) return null;
  const val = tags["toilets:position"];
  if (val === "squat") return "Squat Toilet";
  if (val === "seat") return "Seat Toilet";
  if (val === "urinal") return "Urinal";
  return val.charAt(0).toUpperCase() + val.slice(1) + " Toilet";
};

const getToiletDisposalLabel = (tags: any) => {
  if (!tags || !tags["toilets:disposal"]) return null;
  const val = tags["toilets:disposal"];
  if (val === "flush") return "Flush Toilet";
  if (val === "chemical") return "Chemical Toilet";
  if (val === "dry" || val === "composting") return "Dry Toilet";
  if (val === "pit") return "Pit Latrine";
  return val.charAt(0).toUpperCase() + val.slice(1) + " Toilet";
};

const getAccessTypeLabel = (tags: any) => {
  if (
    !tags ||
    !tags.access ||
    tags.access === "yes" ||
    tags.access === "public"
  )
    return null;
  const val = tags.access;
  if (val === "customers") return "Customers only";
  if (val === "private") return "Private";
  return val.charAt(0).toUpperCase() + val.slice(1) + " access";
};

const getPaymentLabel = (tags: any) => {
  if (!tags) return null;
  const methods = [];
  if (
    tags["payment:coins"] === "yes" ||
    tags["payment:cash"] === "yes" ||
    tags["payment:notes"] === "yes"
  )
    methods.push("Cash/Coins");
  if (
    tags["payment:cards"] === "yes" ||
    tags["payment:credit_cards"] === "yes" ||
    tags["payment:debit_cards"] === "yes"
  )
    methods.push("Cards");
  if (tags["payment:contactless"] === "yes") methods.push("Contactless");
  if (methods.length > 0) return methods.join(", ");
  return null;
};

// Universal Navigation Link
const getDirectionsUrl = (lat: number, lon: number) => {
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  if (isIOS) {
    return `https://maps.apple.com/?q=${lat},${lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
};

// Center map FAB logic
const centerOnUserLocation = () => {
  if (mapState.latitude && mapState.longitude && mapState.map) {
    const latLon = L.latLng(mapState.latitude, mapState.longitude);
    (mapState.map as any).setView(latLon, 16);
  } else {
    window.navigator.geolocation.getCurrentPosition((position) => {
      const latLon = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );
      (mapState.map as any).setView(latLon, 16);
      updatePosition(position);
    }, errorGetLocation);
  }
};

const userIcon = divIcon({
  html: `
                <svg viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" fill="#fff"/>
                  <circle cx="5" cy="5" r="2" fill="#1981FB">
                    <animate attributeName="r" begin="0s" dur="5s" repeatCount="indefinite" values="1.5;3;1.5"/>
                  </circle>
                </svg>`,
  className: "",
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

const toast = useToast();

let iconWidth = 25;
const iconHeight = 40;
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
  mapState.map = markRaw((mapLeaflet as any).value.leafletObject);
  console.log((mapState.map as any).getBounds(), mapState.bounds);
  if (window.navigator.geolocation) {
    // Geolocation available
    window.navigator.geolocation.getCurrentPosition((position) => {
      console.log(position);
      const latLon = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );
      (mapState.map as any).setView(latLon, mapState.zoom || 16);
      updatePosition(position);
      loadToiletMarkers((mapState.map as any).getBounds());
    }, errorGetLocation);

    watchLocationID = navigator.geolocation.watchPosition((position) => {
      updatePosition(position);
    });
  } else {
    errorAuthorizeLocation();
  }
};

const loadToiletMarkers = async (bounds: any) => {
  mapState.bounds = bounds;
  loadingMarkers.value = true;
  const newMarkers = await OverpassApi.searchToiletSpots(
    bounds,
    checkedOptions
  );
  mapState.toiletMarkers =
    newMarkers.length > 0 ? newMarkers : mapState.toiletMarkers;
  loadingMarkers.value = false;
};

const updatePosition = (position: GeolocationPosition) => {
  showCurrentLocation.value = true;
  mapState.latitude = position.coords.latitude;
  mapState.longitude = position.coords.longitude;
  mapState.accuracy = position.coords.accuracy;
};

const errorGetLocation = (error: GeolocationPositionError) => {
  toast.error(error?.message);
  console.error(error?.message, error?.code);
};

const errorAuthorizeLocation = () => {
  toast.error("Error Location Not Authorized");
};

const boundsUpdated = debounce(loadToiletMarkers, 3000, {
  leading: true,
  trailing: true,
});

watch(checkedOptions, () => boundsUpdated((mapState.map as any).getBounds()));
</script>
