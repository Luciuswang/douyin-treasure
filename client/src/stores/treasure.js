import { defineStore } from 'pinia'
import { ref } from 'vue'
import { treasureService } from '../services/treasure.js'

export const useTreasureStore = defineStore('treasure', () => {
  const nearbyTreasures = ref([])
  const myTreasures = ref([])
  const discoveredTreasures = ref([])
  const loading = ref(false)
  const selectedTreasure = ref(null)

  async function loadNearby(lat, lng, radius) {
    loading.value = true
    try {
      const res = await treasureService.getNearby(lat, lng, radius)
      if (res.success) nearbyTreasures.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function loadMy() {
    const res = await treasureService.getMy()
    if (res.success) myTreasures.value = res.data
  }

  async function loadDiscovered() {
    const res = await treasureService.getDiscovered()
    if (res.success) discoveredTreasures.value = res.data
  }

  async function createTreasure(data) {
    const res = await treasureService.create(data)
    if (res.success) {
      nearbyTreasures.value.unshift(res.data)
    }
    return res
  }

  async function discoverTreasure(id, lat, lng, password) {
    const res = await treasureService.discover(id, lat, lng, password)
    if (res.success) {
      const idx = nearbyTreasures.value.findIndex(t => t._id === id)
      if (idx !== -1) nearbyTreasures.value[idx].isDiscovered = true
    }
    return res
  }

  async function removeTreasure(id) {
    const res = await treasureService.remove(id)
    if (res.success) {
      nearbyTreasures.value = nearbyTreasures.value.filter(t => t._id !== id)
      myTreasures.value = myTreasures.value.filter(t => t._id !== id)
    }
    return res
  }

  async function reportTreasure(id, reason, detail) {
    return treasureService.report(id, reason, detail)
  }

  async function expressInterest(id) {
    return treasureService.expressInterest(id)
  }

  async function acceptInterest(id, userId) {
    return treasureService.acceptInterest(id, userId)
  }

  async function getInterests(id) {
    return treasureService.getInterests(id)
  }

  return {
    nearbyTreasures, myTreasures, discoveredTreasures, loading, selectedTreasure,
    loadNearby, loadMy, loadDiscovered, createTreasure, discoverTreasure, removeTreasure,
    reportTreasure, expressInterest, acceptInterest, getInterests
  }
})
