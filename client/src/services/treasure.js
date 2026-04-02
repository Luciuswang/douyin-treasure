import api from './api.js'

export const treasureService = {
  async getNearby(lat, lng, radius = 5000, options = {}) {
    return api.get('/treasures/nearby', { params: { lat, lng, radius, ...options } })
  },

  async getMy() {
    return api.get('/treasures/my')
  },

  async getDiscovered() {
    return api.get('/treasures/discovered')
  },

  async getById(id) {
    return api.get(`/treasures/${id}`)
  },

  async create(data) {
    return api.post('/treasures', data)
  },

  async update(id, data) {
    return api.put(`/treasures/${id}`, data)
  },

  async remove(id) {
    return api.delete(`/treasures/${id}`)
  },

  async discover(id, lat, lng, password) {
    return api.post(`/treasures/${id}/discover`, { lat, lng, password })
  },

  async toggleLike(id) {
    return api.post(`/treasures/${id}/like`)
  },

  async report(id, reason, detail) {
    return api.post(`/treasures/${id}/report`, { reason, detail })
  }
}
