import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { buildLocaleRoutes } from './utils/sidebar'

// docs/ root, resolved without relying on __dirname (config runs as ESM)
const docsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

const en = buildLocaleRoutes(docsDir, 'en')
const id = buildLocaleRoutes(docsDir, 'id')

/**
 * Groups the auto-generated section links (Info, Policy, ...) under one
 * nav dropdown instead of listing each section as its own top-level link.
 * Keeps the nav bar short no matter how many sections get added later.
 * VitePress renders this as its native compact nav dropdown - a small
 * anchored menu, not a full-width mega menu / modal.
 *
 * Falls back to the plain flat item when there's only one (or zero)
 * section, since a one-item dropdown has nothing to save.
 */
function groupAsDropdown(label: string, items: DefaultTheme.NavItem[]): DefaultTheme.NavItem[] {
  if (items.length <= 1) return items

  const activeMatch = items
    .map((item) => ('activeMatch' in item ? item.activeMatch : undefined))
    .filter((match): match is string => Boolean(match))
    .join('|')

  return [
    {
      text: label,
      items: items as DefaultTheme.NavItemWithLink[],
      ...(activeMatch ? { activeMatch } : {})
    }
  ]
}

/**
 * A nav entry rendered by the custom WebsiteMenu.vue component (globe
 * icon, opens a small dropdown of external links) instead of a plain
 * text link - registered as a global component in theme/index.ts.
 * VitePress automatically re-renders it appropriately inside the mobile
 * full-screen menu too.
 */
function websiteMenuItem(
  label: string,
  links: { text: string; link: string }[]
): DefaultTheme.NavItem {
  return { component: 'WebsiteMenu', props: { label, links } } as DefaultTheme.NavItem
}

// Placeholder external links - point these at the project's real website,
// community, and store (or trim the list to just one). Shown as a
// globe-icon dropdown in the nav, opening each link in a new tab.
const websiteLinksEn = [
  { text: 'Main Website', link: 'https://www.cubeocean.web.id' },
  { text: 'Community', link: 'https://www.cubeocean.web.id/community' },
  { text: 'Store', link: 'https://www.cubeocean.web.id/store' },
  { text: 'Events website', link: 'https://events.cubeocean.web.id' },
  { text: 'News', link: 'https://events.cubeocean.web.id/news' }
]

const websiteLinksId = [
  { text: 'Website Utama', link: 'https://www.cubeocean.web.id' },
  { text: 'Community', link: 'https://www.cubeocean.web.id/community' },
  { text: 'Store', link: 'https://www.cubeocean.web.id/store' },
  { text: 'Events website', link: 'https://events.cubeocean.web.id' },
  { text: 'News', link: 'https://events.cubeocean.web.id/news' }
]

// Single place to set the real repo - reused by the GitHub icon in the
// nav and by the "Edit this page" link on every doc page.
const GITHUB_REPO = 'https://github.com/CubeOcean-Network/CubeOcean-Games-Docs'
const GITHUB_BRANCH = 'main'

// Ad slot shown at the very bottom of the right-hand "on this page" aside
// (below the outline). One is picked at random client-side on every page
// load - see AdBox.vue. Swap the image paths for real creatives dropped
// into docs/public/ads/, and point `link` at whatever each one should open.
const ads = [
  {
    image: '/ads/ad-cog.png',
    link: 'https://www.cubeocean.web.id',
    alt: 'CubeOcean Games',
    description: "Let's go on an adventure."
  },
  {
    image: '/ads/ad-habibsmp.svg',
    link: 'https://www.habibsmp.my.id',
    alt: 'HabibSMP',
    description: 'Custom survival training server for Minecraft Java Edition and Bedrock Edition.'
  }
]

const sharedSearchLocales = {
  id: {
    translations: {
      button: {
        buttonText: 'Cari',
        buttonAriaLabel: 'Cari dokumentasi'
      },
      modal: {
        noResultsText: 'Tidak ada hasil untuk',
        resetButtonTitle: 'Hapus pencarian',
        footer: {
          selectText: 'pilih',
          navigateText: 'navigasi',
          closeText: 'tutup'
        }
      }
    }
  }
}

export default defineConfig({
  title: 'CubeOcean Games Docs',
  description: 'CubeOcean Games documentation',
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.png', type: 'image/png' }],
    ['meta', { name: 'theme-color', content: '#0a0a0a' }]
  ],

  themeConfig: {
    i18nRouting: true,

    logo: '/favicon.png',

    socialLinks: [
      // Replace GITHUB_REPO above with the project's real repository.
      { icon: 'github', link: GITHUB_REPO }
    ],

    search: {
      provider: 'local',
      options: {
        locales: sharedSearchLocales
      }
    }
  },

  // Runs for every page at build time. Attaches the GitHub-style "last
  // edited by" author, read straight from git history, next to the
  // built-in git-based lastUpdated timestamp.
  transformPageData(pageData) {
    if (!pageData.filePath) return

    const absPath = path.join(docsDir, pageData.filePath)
    let author: string | null = null

    try {
      author = execFileSync(
        'git',
        ['log', '-1', '--format=%an', '--', absPath],
        { cwd: docsDir }
      )
        .toString()
        .trim() || null
    } catch {
      author = null
    }

    ;(pageData as Record<string, unknown>).lastUpdatedBy = author
  },

  locales: {
    // Bare "/" is just a minimal language chooser (see docs/index.md) and
    // is intentionally left out of the language switcher dropdown - real
    // content only ever lives under /en/ or /id/.
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      title: 'CubeOcean Games Docs',
      description: 'CubeOcean Games documentation',
      themeConfig: {
        nav: [...groupAsDropdown('Docs', en.nav), websiteMenuItem('Website', websiteLinksEn)],
        sidebar: en.sidebar,
        outline: { label: 'On this page' },
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        langMenuLabel: 'Change language',
        docFooter: { prev: 'Previous page', next: 'Next page' },
        lastUpdatedText: 'Last updated',
        lastUpdated: { text: 'Last updated' },
        editLink: {
          pattern: `${GITHUB_REPO}/edit/${GITHUB_BRANCH}/docs/:path`,
          text: 'Edit this page on GitHub'
        },
        ads
      }
    },
    id: {
      label: 'Bahasa Indonesia',
      lang: 'id',
      link: '/id/',
      title: 'Dokumentasi Platform',
      description: 'Dokumentasi platform',
      themeConfig: {
        nav: [...groupAsDropdown('Dokumentasi', id.nav), websiteMenuItem('Situs Web', websiteLinksId)],
        sidebar: id.sidebar,
        outline: { label: 'Di halaman ini' },
        returnToTopLabel: 'Kembali ke atas',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Tampilan',
        lightModeSwitchTitle: 'Beralih ke mode terang',
        darkModeSwitchTitle: 'Beralih ke mode gelap',
        langMenuLabel: 'Ubah bahasa',
        docFooter: { prev: 'Halaman sebelumnya', next: 'Halaman selanjutnya' },
        lastUpdatedText: 'Terakhir diperbarui',
        lastUpdated: { text: 'Terakhir diperbarui' },
        editLink: {
          pattern: `${GITHUB_REPO}/edit/${GITHUB_BRANCH}/docs/:path`,
          text: 'Edit halaman ini di GitHub'
        },
        ads
      }
    }
  }
})