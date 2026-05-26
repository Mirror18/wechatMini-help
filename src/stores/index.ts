import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useUserStore } from './user'
export { useFoodStore } from './food'
