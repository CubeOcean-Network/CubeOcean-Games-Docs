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

  base: '/',

  title: 'CubeOcean Games Docs',
  description: 'Platform documentation',
  cleanUrls: true,
  lastUpdated: true,
  appearance: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.png', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#0a0a0a' }]
  ],

  themeConfig: {
    i18nRouting: true,

    logo: '/favicon.png',

    socialLinks: [
      // Replace with the project's real repository.
      { icon: 'github', link: 'https://github.com/your-org/your-repo' }
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
      description: 'Platform documentation',
      themeConfig: {
        nav: groupAsDropdown('Docs', en.nav),
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
        editLink: undefined
      }
    },
    id: {
      label: 'Bahasa Indonesia',
      lang: 'id',
      link: '/id/',
      title: 'Dokumentasi CubeOcean Games',
      description: 'Dokumentasi platform',
      themeConfig: {
        nav: groupAsDropdown('Dokumentasi', id.nav),
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
        lastUpdated: { text: 'Terakhir diperbarui' }
      }
    }
  }
})