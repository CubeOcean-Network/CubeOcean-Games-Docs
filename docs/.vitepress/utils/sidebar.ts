/**
 * Auto-routing engine.
 *
 * Turns the folder structure under `docs/<locale>/` into VitePress nav +
 * sidebar config, with no manual sidebar arrays to maintain.
 *
 * Convention (matches the folder layout the site is built on):
 *
 *   docs/<locale>/<section>/<category>/<page>.md
 *
 *   docs/en/info/                  -> a top-level SECTION
 *                                     (its own nav item + its own scoped sidebar)
 *   docs/en/info/platform/         -> a CATEGORY (a group inside that sidebar)
 *   docs/en/info/platform/about.md -> a PAGE (a link inside that group)
 *
 * Because each section gets its own sidebar entry keyed to its own URL
 * prefix, sections never leak into each other: a page that lives under
 * `policy/` will never show up in the sidebar while browsing `info/`, even
 * if both sections happen to contain a same-named category folder (e.g.
 * both have a `platform/` category) or a same-named page.
 *
 * Folders can nest deeper than one level and it still works, since groups
 * are built recursively - a folder inside a category becomes a nested,
 * collapsible group.
 *
 * Titles and ordering:
 *   - A page's title comes from its frontmatter `title`, falling back to
 *     a humanized version of the filename.
 *   - A folder's title/order comes from an optional `_meta.json` file
 *     inside it (`{ "title": "Platform", "order": 1 }`), falling back to
 *     a humanized folder name.
 *   - Sort order comes from frontmatter/`_meta.json` `order` (lower first),
 *     falling back to alphabetical.
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'

interface RankedPage {
  kind: 'page'
  order: number
  title: string
  link: string
}

interface RankedGroup {
  kind: 'group'
  order: number
  title: string
  children: RankedNode[]
}

type RankedNode = RankedPage | RankedGroup

export interface LocaleRoutes {
  nav: DefaultTheme.NavItem[]
  sidebar: DefaultTheme.Sidebar
}

const META_FILE = '_meta.json'

function humanize(slug: string): string {
  return slug
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

function readFolderMeta(dir: string, fallbackTitle: string): { title: string; order: number } {
  const metaPath = path.join(dir, META_FILE)
  if (!fs.existsSync(metaPath)) return { title: fallbackTitle, order: 999 }

  try {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    return {
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : fallbackTitle,
      order: typeof raw.order === 'number' ? raw.order : 999
    }
  } catch {
    return { title: fallbackTitle, order: 999 }
  }
}

function readPageMeta(filePath: string, fallbackTitle: string): { title: string; order: number } {
  try {
    const { data } = matter(fs.readFileSync(filePath, 'utf-8'))
    return {
      title: typeof data.title === 'string' && data.title.trim() ? data.title : fallbackTitle,
      order: typeof data.order === 'number' ? data.order : 999
    }
  } catch {
    return { title: fallbackTitle, order: 999 }
  }
}

function sortNodes(nodes: RankedNode[]): RankedNode[] {
  return [...nodes].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

/** Recursively walk a directory, turning subfolders into groups and .md files into links. */
function walk(dir: string, urlBase: string): RankedNode[] {
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  const groups: RankedNode[] = entries
    .filter((e) => e.isDirectory())
    .map((entry): RankedGroup => {
      const subDir = path.join(dir, entry.name)
      const meta = readFolderMeta(subDir, humanize(entry.name))
      return {
        kind: 'group',
        order: meta.order,
        title: meta.title,
        children: walk(subDir, `${urlBase}/${entry.name}`)
      }
    })
    .filter((group) => group.children.length > 0)

  const pages: RankedNode[] = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md')
    .map((entry): RankedPage => {
      const filePath = path.join(dir, entry.name)
      const slug = entry.name.replace(/\.md$/, '')
      const meta = readPageMeta(filePath, humanize(slug))
      return {
        kind: 'page',
        order: meta.order,
        title: meta.title,
        link: `${urlBase}/${slug}`
      }
    })

  return sortNodes([...groups, ...pages])
}

function toSidebarItems(nodes: RankedNode[]): DefaultTheme.SidebarItem[] {
  return nodes.map((node) => {
    if (node.kind === 'page') {
      return { text: node.title, link: node.link }
    }
    return {
      text: node.title,
      collapsed: false,
      items: toSidebarItems(node.children)
    }
  })
}

function firstLink(nodes: RankedNode[]): string | undefined {
  for (const node of nodes) {
    if (node.kind === 'page') return node.link
    const nested = firstLink(node.children)
    if (nested) return nested
  }
  return undefined
}

/**
 * Build the nav + sidebar for one locale by scanning `docsDir/<locale>`.
 * Every direct subfolder of the locale becomes one nav item and one
 * path-scoped sidebar entry.
 */
export function buildLocaleRoutes(docsDir: string, locale: string): LocaleRoutes {
  const localeDir = path.join(docsDir, locale)
  const sidebar: DefaultTheme.Sidebar = {}

  if (!fs.existsSync(localeDir)) return { nav: [], sidebar }

  const sections = fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())

  const navRanked: Array<{ order: number; title: string; slug: string; link: string }> = []

  for (const section of sections) {
    const sectionDir = path.join(localeDir, section.name)
    const meta = readFolderMeta(sectionDir, humanize(section.name))
    const urlBase = `/${locale}/${section.name}`

    const nodes = walk(sectionDir, urlBase)
    if (nodes.length === 0) continue

    sidebar[`${urlBase}/`] = toSidebarItems(nodes)

    navRanked.push({
      order: meta.order,
      title: meta.title,
      slug: section.name,
      link: firstLink(nodes) ?? `${urlBase}/`
    })
  }

  navRanked.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

  const nav: DefaultTheme.NavItem[] = navRanked.map((item) => ({
    text: item.title,
    link: item.link,
    activeMatch: `^/${locale}/${item.slug}/`
  }))

  return { nav, sidebar }
}
