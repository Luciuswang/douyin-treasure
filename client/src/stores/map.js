import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapStore = defineStore('map', () => {
  const userLocation = ref(null)   // { lat, lng, accuracy }
  const mapCenter = ref(null)       // { lat, lng }
  const mapReady = ref(false)
  const tracking = ref(false)
  const gpsAccuracy = ref(0)

  function setLocation(loc) {
    userLocation.value = loc
    gpsAccuracy.value = Math.round(loc.accuracy || 0)
  }

  function setCenter(center) {
    mapCenter.value = center
  }

  return { userLocation, mapCenter, mapReady, tracking, gpsAccuracy, setLocation, setCenter }
})
