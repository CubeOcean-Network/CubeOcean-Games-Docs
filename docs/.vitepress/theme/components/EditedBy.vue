<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, lang } = useData()

const author = computed(() => {
  const value = (page.value as Record<string, unknown>).lastUpdatedBy
  return typeof value === 'string' && value.length ? value : null
})

const label = computed(() => (lang.value === 'id' ? 'Diedit oleh' : 'Edited by'))
</script>

<template>
  <p v-if="author" class="edited-by">
    {{ label }} <span class="edited-by-name">{{ author }}</span>
  </p>
</template>

<style scoped>
.edited-by {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.edited-by-name {
  color: var(--vp-c-text-2);
  font-weight: 500;
}
</style>
