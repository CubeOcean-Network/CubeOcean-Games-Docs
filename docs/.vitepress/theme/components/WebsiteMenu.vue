<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface WebsiteLink {
  text: string
  link: string
}

// `screenMenu` is passed in automatically by VitePress when this
// component is placed inside the mobile full-screen nav instead of the
// desktop nav bar - used to switch from a popover dropdown to a plain
// list, since an absolutely-positioned popover doesn't make sense inside
// a stacked mobile menu.
defineProps<{
  label: string
  links: WebsiteLink[]
  screenMenu?: boolean
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="screenMenu" class="website-menu-mobile">
    <p class="website-menu-mobile-label">{{ label }}</p>
    <a
      v-for="item in links"
      :key="item.link"
      class="website-menu-link"
      :href="item.link"
      target="_blank"
      rel="noopener"
    >
      <span>{{ item.text }}</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="external-icon"
        aria-hidden="true"
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </a>
  </div>

  <div v-else class="website-menu" ref="root">
    <button
      type="button"
      class="website-menu-button"
      :aria-label="label"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="globe-icon"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18" />
        <path d="M3.5 9h17M3.5 15h17" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chevron-icon"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <div class="website-menu-list">
      <a
        v-for="item in links"
        :key="item.link"
        class="website-menu-link"
        :href="item.link"
        target="_blank"
        rel="noopener"
      >
        <span>{{ item.text }}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="external-icon"
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Desktop: icon-triggered popover */
.website-menu {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.website-menu-button {
  /* reset default <button> box model so it centers like the other nav
     buttons instead of sitting on its own baseline/padding */
  appearance: none;
  margin: 0;
  border: none;
  background: none;
  font: inherit;
  line-height: 1;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  padding: 0 12px;
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.website-menu-button:hover,
.website-menu-button[aria-expanded='true'] {
  color: var(--vp-c-brand-1);
}

.globe-icon,
.chevron-icon,
.external-icon {
  display: block;
  flex-shrink: 0;
}

.globe-icon {
  width: 18px;
  height: 18px;
}

.chevron-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.website-menu-button[aria-expanded='true'] .chevron-icon {
  transform: rotate(180deg);
}

.website-menu-list {
  position: absolute;
  top: calc(var(--vp-nav-height) / 2 + 20px);
  right: 0;
  min-width: 176px;
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.website-menu:hover .website-menu-list,
.website-menu-button[aria-expanded='true'] + .website-menu-list {
  opacity: 1;
  visibility: visible;
}

.website-menu-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.website-menu-link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}

.website-menu-link .external-icon {
  width: 13px;
  height: 13px;
  color: var(--vp-c-text-3);
}

.website-menu-link:hover .external-icon {
  color: var(--vp-c-brand-1);
}

/* Mobile: plain list inside the full-screen nav menu */
.website-menu-mobile {
  padding: 12px 0;
  border-top: 1px solid var(--vp-c-divider);
}

.website-menu-mobile-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.website-menu-mobile .website-menu-link {
  padding: 8px 0;
  font-size: 16px;
}
</style>