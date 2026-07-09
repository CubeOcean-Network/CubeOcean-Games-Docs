<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'

interface AdItem {
  image: string
  link: string
  alt?: string
  description?: string
}

const { theme, lang } = useData()

// Starts empty on purpose: VitePress statically renders this page once at
// build time, so picking randomly here would freeze the same "random"
// image into the HTML for every visitor until the next rebuild. Picking
// inside onMounted() runs in the browser instead, so it's re-rolled on
// every real page load.
const current = ref<AdItem | null>(null)

const label = computed(() => (lang.value === 'id' ? 'Iklan' : 'Advertisement'))

onMounted(() => {
  const ads = (theme.value as Record<string, unknown>).ads as AdItem[] | undefined
  if (ads && ads.length > 0) {
    current.value = ads[Math.floor(Math.random() * ads.length)]
  }
})
</script>

<template>
  <div v-if="current" class="ad-box">
    <p class="ad-box-label">{{ label }}</p>
    <a
      class="ad-box-link"
      :href="current.link"
      target="_blank"
      rel="noopener sponsored"
    >
      <img class="ad-box-image" :src="current.image" :alt="current.alt || label" />
    </a>
    <a
      v-if="current.description"
      class="ad-box-description"
      :href="current.link"
      target="_blank"
      rel="noopener sponsored"
    >
      {{ current.description }}
    </a>
  </div>
</template>

<style scoped>
.ad-box {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.ad-box-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.ad-box-link {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.ad-box-link:hover {
  border-color: var(--vp-c-brand-1);
}

.ad-box-image {
  display: block;
  width: 100%;
  height: auto;
}

.ad-box-description {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.ad-box-description:hover {
  color: var(--vp-c-brand-1);
}
</style>