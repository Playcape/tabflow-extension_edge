/* ================================================================
   TabFlow — theme, accent and font data (pure data, no logic)
   ================================================================ */

export const THEMES = {
  dark: {
    name: 'Dark',
    vars: {
      '--bg': '#16151a', '--sidebar-bg': '#1c1b22', '--main-bg': '#1a1920',
      '--card-bg': '#252330', '--card-hover': '#2e2b40', '--border': '#2e2c3a',
      '--text': '#e2e0ee', '--text-muted': '#8b899a', '--text-faint': '#55536a',
      '--divider': '#2a2836', '--sidebar-active': '#2a2738', '--shadow': 'rgba(0,0,0,.4)',
      '--scrollbar': '#3a3852', '--input-bg': '#1e1d25',
    },
    preview: { sidebar: '#1c1b22', main: '#1a1920', card: '#252330', card2: '#2e2b40' },
  },
  light: {
    name: 'Light',
    vars: {
      '--bg': '#f4f3f8', '--sidebar-bg': '#eceaf4', '--main-bg': '#f4f3f8',
      '--card-bg': '#ffffff', '--card-hover': '#f0effe', '--border': '#dcdae8',
      '--text': '#1c1a2e', '--text-muted': '#6b6880', '--text-faint': '#aaa8bc',
      '--divider': '#e2e0f0', '--sidebar-active': '#e6e3f8', '--shadow': 'rgba(0,0,0,.08)',
      '--scrollbar': '#c8c5df', '--input-bg': '#f8f7fc',
    },
    preview: { sidebar: '#eceaf4', main: '#f4f3f8', card: '#ffffff', card2: '#f0effe' },
  },
  dracula: {
    name: 'Dracula',
    vars: {
      '--bg': '#282a36', '--sidebar-bg': '#21222c', '--main-bg': '#282a36',
      '--card-bg': '#343746', '--card-hover': '#3d3f52', '--border': '#44475a',
      '--text': '#f8f8f2', '--text-muted': '#a0a0b8', '--text-faint': '#6272a4',
      '--divider': '#44475a', '--sidebar-active': '#373a50', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#44475a', '--input-bg': '#21222c',
    },
    preview: { sidebar: '#21222c', main: '#282a36', card: '#343746', card2: '#3d3f52' },
  },
  nord: {
    name: 'Nord',
    vars: {
      '--bg': '#2e3440', '--sidebar-bg': '#272c37', '--main-bg': '#2e3440',
      '--card-bg': '#3b4252', '--card-hover': '#434c5e', '--border': '#434c5e',
      '--text': '#eceff4', '--text-muted': '#9099ab', '--text-faint': '#5a6475',
      '--divider': '#3b4252', '--sidebar-active': '#3b4252', '--shadow': 'rgba(0,0,0,.45)',
      '--scrollbar': '#434c5e', '--input-bg': '#272c37',
    },
    preview: { sidebar: '#272c37', main: '#2e3440', card: '#3b4252', card2: '#434c5e' },
  },
  monokai: {
    name: 'Monokai',
    vars: {
      '--bg': '#272822', '--sidebar-bg': '#1e1f1a', '--main-bg': '#272822',
      '--card-bg': '#3e3d32', '--card-hover': '#49483e', '--border': '#49483e',
      '--text': '#f8f8f2', '--text-muted': '#a59f85', '--text-faint': '#75715e',
      '--divider': '#3e3d32', '--sidebar-active': '#3e3d32', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#49483e', '--input-bg': '#1e1f1a',
    },
    preview: { sidebar: '#1e1f1a', main: '#272822', card: '#3e3d32', card2: '#49483e' },
  },
  solarized: {
    name: 'Solarized',
    vars: {
      '--bg': '#002b36', '--sidebar-bg': '#073642', '--main-bg': '#002b36',
      '--card-bg': '#073642', '--card-hover': '#0d4556', '--border': '#124052',
      '--text': '#fdf6e3', '--text-muted': '#839496', '--text-faint': '#586e75',
      '--divider': '#073642', '--sidebar-active': '#0d4556', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#124052', '--input-bg': '#002028',
    },
    preview: { sidebar: '#073642', main: '#002b36', card: '#073642', card2: '#0d4556' },
  },
  rose: {
    name: 'Rosé Pine',
    vars: {
      '--bg': '#191724', '--sidebar-bg': '#1f1d2e', '--main-bg': '#191724',
      '--card-bg': '#26233a', '--card-hover': '#2e2b42', '--border': '#393552',
      '--text': '#e0def4', '--text-muted': '#9893b8', '--text-faint': '#6e6a86',
      '--divider': '#393552', '--sidebar-active': '#2e2b42', '--shadow': 'rgba(0,0,0,.45)',
      '--scrollbar': '#393552', '--input-bg': '#1a1829',
    },
    preview: { sidebar: '#1f1d2e', main: '#191724', card: '#26233a', card2: '#2e2b42' },
  },
  forest: {
    name: 'Forest',
    vars: {
      '--bg': '#1a1f1a', '--sidebar-bg': '#1e241e', '--main-bg': '#1a1f1a',
      '--card-bg': '#252c25', '--card-hover': '#2d362d', '--border': '#2d362d',
      '--text': '#d4e8d4', '--text-muted': '#8aaa8a', '--text-faint': '#4a6a4a',
      '--divider': '#252c25', '--sidebar-active': '#2d362d', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#2d362d', '--input-bg': '#151a15',
    },
    preview: { sidebar: '#1e241e', main: '#1a1f1a', card: '#252c25', card2: '#2d362d' },
  },
  catppuccin: {
    name: 'Catppuccin',
    vars: {
      '--bg': '#1e1e2e', '--sidebar-bg': '#181825', '--main-bg': '#1e1e2e',
      '--card-bg': '#313244', '--card-hover': '#45475a', '--border': '#45475a',
      '--text': '#cdd6f4', '--text-muted': '#a6adc8', '--text-faint': '#585b70',
      '--divider': '#313244', '--sidebar-active': '#45475a', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#45475a', '--input-bg': '#181825',
    },
    preview: { sidebar: '#181825', main: '#1e1e2e', card: '#313244', card2: '#45475a' },
  },
  'catppuccin-latte': {
    name: 'Catppuccin Latte',
    vars: {
      '--bg': '#eff1f5', '--sidebar-bg': '#e6e9ef', '--main-bg': '#eff1f5',
      '--card-bg': '#dce0e8', '--card-hover': '#ccd0da', '--border': '#bcc0cc',
      '--text': '#4c4f69', '--text-muted': '#6c6f85', '--text-faint': '#9ca0b0',
      '--divider': '#ccd0da', '--sidebar-active': '#ccd0da', '--shadow': 'rgba(76,79,105,.12)',
      '--scrollbar': '#bcc0cc', '--input-bg': '#dce0e8',
    },
    preview: { sidebar: '#e6e9ef', main: '#eff1f5', card: '#dce0e8', card2: '#ccd0da' },
  },
  'tokyo-night': {
    name: 'Tokyo Night',
    vars: {
      '--bg': '#1a1b26', '--sidebar-bg': '#16161e', '--main-bg': '#1a1b26',
      '--card-bg': '#24283b', '--card-hover': '#2f3354', '--border': '#292e42',
      '--text': '#c0caf5', '--text-muted': '#787c99', '--text-faint': '#414868',
      '--divider': '#292e42', '--sidebar-active': '#2f3354', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#292e42', '--input-bg': '#16161e',
    },
    preview: { sidebar: '#16161e', main: '#1a1b26', card: '#24283b', card2: '#2f3354' },
  },
  'one-dark': {
    name: 'One Dark',
    vars: {
      '--bg': '#282c34', '--sidebar-bg': '#21252b', '--main-bg': '#282c34',
      '--card-bg': '#2c313c', '--card-hover': '#3a3f4b', '--border': '#3a3f4b',
      '--text': '#abb2bf', '--text-muted': '#636d83', '--text-faint': '#4b5263',
      '--divider': '#3a3f4b', '--sidebar-active': '#3a3f4b', '--shadow': 'rgba(0,0,0,.45)',
      '--scrollbar': '#3a3f4b', '--input-bg': '#21252b',
    },
    preview: { sidebar: '#21252b', main: '#282c34', card: '#2c313c', card2: '#3a3f4b' },
  },
  gruvbox: {
    name: 'Gruvbox',
    vars: {
      '--bg': '#282828', '--sidebar-bg': '#1d2021', '--main-bg': '#282828',
      '--card-bg': '#3c3836', '--card-hover': '#504945', '--border': '#504945',
      '--text': '#ebdbb2', '--text-muted': '#a89984', '--text-faint': '#665c54',
      '--divider': '#3c3836', '--sidebar-active': '#504945', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#504945', '--input-bg': '#1d2021',
    },
    preview: { sidebar: '#1d2021', main: '#282828', card: '#3c3836', card2: '#504945' },
  },
  'ayu-mirage': {
    name: 'Ayu Mirage',
    vars: {
      '--bg': '#1f2430', '--sidebar-bg': '#1a1f2e', '--main-bg': '#1f2430',
      '--card-bg': '#2a3140', '--card-hover': '#343e51', '--border': '#343e51',
      '--text': '#cccac2', '--text-muted': '#707a8c', '--text-faint': '#3d4756',
      '--divider': '#2a3140', '--sidebar-active': '#343e51', '--shadow': 'rgba(0,0,0,.5)',
      '--scrollbar': '#343e51', '--input-bg': '#1a1f2e',
    },
    preview: { sidebar: '#1a1f2e', main: '#1f2430', card: '#2a3140', card2: '#343e51' },
  },
  'material-ocean': {
    name: 'Material Ocean',
    vars: {
      '--bg': '#0f111a', '--sidebar-bg': '#090b11', '--main-bg': '#0f111a',
      '--card-bg': '#1a1c25', '--card-hover': '#222537', '--border': '#2a2d3b',
      '--text': '#8f93a2', '--text-muted': '#5a5f78', '--text-faint': '#3a3d50',
      '--divider': '#1a1c25', '--sidebar-active': '#222537', '--shadow': 'rgba(0,0,0,.6)',
      '--scrollbar': '#2a2d3b', '--input-bg': '#090b11',
    },
    preview: { sidebar: '#090b11', main: '#0f111a', card: '#1a1c25', card2: '#222537' },
  },
  synthwave: {
    name: 'Synthwave',
    vars: {
      '--bg': '#1a0533', '--sidebar-bg': '#12012a', '--main-bg': '#1a0533',
      '--card-bg': '#2a1040', '--card-hover': '#3a1d52', '--border': '#4a2060',
      '--text': '#f0d0ff', '--text-muted': '#a070c0', '--text-faint': '#6040a0',
      '--divider': '#2a1040', '--sidebar-active': '#3a1d52', '--shadow': 'rgba(0,0,0,.6)',
      '--scrollbar': '#4a2060', '--input-bg': '#12012a',
    },
    preview: { sidebar: '#12012a', main: '#1a0533', card: '#2a1040', card2: '#3a1d52' },
  },
  midnight: {
    name: 'Midnight',
    vars: {
      '--bg': '#0a0e1a', '--sidebar-bg': '#070b14', '--main-bg': '#0a0e1a',
      '--card-bg': '#111827', '--card-hover': '#1e2740', '--border': '#1e2740',
      '--text': '#c9d1e0', '--text-muted': '#5d6b8a', '--text-faint': '#2e3a50',
      '--divider': '#111827', '--sidebar-active': '#1e2740', '--shadow': 'rgba(0,0,0,.7)',
      '--scrollbar': '#1e2740', '--input-bg': '#070b14',
    },
    preview: { sidebar: '#070b14', main: '#0a0e1a', card: '#111827', card2: '#1e2740' },
  },
  paper: {
    name: 'Paper',
    vars: {
      '--bg': '#f7f4ef', '--sidebar-bg': '#ede8e0', '--main-bg': '#f7f4ef',
      '--card-bg': '#ffffff', '--card-hover': '#f0ebe0', '--border': '#ddd8cc',
      '--text': '#2d2a25', '--text-muted': '#6b6560', '--text-faint': '#a09a90',
      '--divider': '#e5e0d5', '--sidebar-active': '#e0d8c8', '--shadow': 'rgba(0,0,0,.07)',
      '--scrollbar': '#c8c0b0', '--input-bg': '#f0ebe0',
    },
    preview: { sidebar: '#ede8e0', main: '#f7f4ef', card: '#ffffff', card2: '#f0ebe0' },
  },
};

export const ACCENT_COLORS = [
  { name: 'Violet', hex: '#7c6af5' },
  { name: 'Blue', hex: '#4f8ef7' },
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Orange', hex: '#fb923c' },
  { name: 'Red', hex: '#f87171' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Teal', hex: '#2dd4bf' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Sky', hex: '#0ea5e9' },
];

/* Liquid Glass accents — luminous jewel/neon tones that glow through the
   frosted material and keep strong contrast on translucent surfaces. */
export const GLASS_ACCENTS = [
  { name: 'Amethyst', hex: '#9b8cff' },
  { name: 'Azure', hex: '#4c9aff' },
  { name: 'Aqua', hex: '#2ae0e0' },
  { name: 'Mint', hex: '#35e3a4' },
  { name: 'Spring', hex: '#46e07a' },
  { name: 'Citron', hex: '#f5d742' },
  { name: 'Tangerine', hex: '#ff9e4a' },
  { name: 'Coral', hex: '#ff6f6f' },
  { name: 'Blossom', hex: '#ff6fb5' },
  { name: 'Orchid', hex: '#e070ff' },
  { name: 'Periwinkle', hex: '#7c8cff' },
  { name: 'Sky Glow', hex: '#48c6ff' },
  { name: 'Turquoise', hex: '#22d3c5' },
  { name: 'Flamingo', hex: '#ff7a9c' },
  { name: 'Gold', hex: '#ffc24a' },
  { name: 'Lavender', hex: '#b39cff' },
];

/* Material You accents — Material 3 seed tones. Balanced chroma so they
   tint the whole tonal interface pleasantly rather than overpowering it. */
export const MATERIAL_ACCENTS = [
  { name: 'Blue', hex: '#4285f4' },
  { name: 'Indigo', hex: '#5c6bc0' },
  { name: 'Deep Purple', hex: '#7e57c2' },
  { name: 'Violet', hex: '#7c5dd6' },
  { name: 'Pink', hex: '#e8477e' },
  { name: 'Red', hex: '#e5484d' },
  { name: 'Deep Orange', hex: '#f4783b' },
  { name: 'Amber', hex: '#f5a623' },
  { name: 'Yellow', hex: '#f6c244' },
  { name: 'Green', hex: '#43a047' },
  { name: 'Emerald', hex: '#1ba97a' },
  { name: 'Teal', hex: '#009688' },
  { name: 'Cyan', hex: '#00acc1' },
  { name: 'Sky', hex: '#2196f3' },
  { name: 'Lime', hex: '#7cb342' },
  { name: 'Magenta', hex: '#c453c4' },
];

/** The accent palette tuned for the active design language. */
export function accentsFor(settings = {}) {
  if (settings.materialYou) return MATERIAL_ACCENTS;
  if (settings.liquidGlass) return GLASS_ACCENTS;
  return ACCENT_COLORS;
}

/*
 * Font choices are locally-available stacks instead of runtime Google Fonts:
 * remote fonts leak browsing signals, break offline, and are a review
 * problem on addons.mozilla.org. These stacks pick the best installed match
 * per OS.
 */
export const FONT_STACKS = [
  {
    key: 'system',
    label: 'System',
    stack: `system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
  },
  {
    key: 'humanist',
    label: 'Humanist',
    stack: `Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', 'Trebuchet MS', sans-serif`,
  },
  {
    key: 'geometric',
    label: 'Geometric',
    stack: `Avenir, Montserrat, Corbel, 'URW Gothic', 'Century Gothic', sans-serif`,
  },
  {
    key: 'rounded',
    label: 'Rounded',
    stack: `ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, 'Arial Rounded MT', 'Segoe UI', sans-serif`,
  },
  {
    key: 'mono',
    label: 'Monospace',
    stack: `ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, 'Fira Code', monospace`,
  },
];

export function fontStackFor(key) {
  return (FONT_STACKS.find((f) => f.key === key) ?? FONT_STACKS[0]).stack;
}

/** Color slots exposed in the custom theme editor. */
export const THEME_SLOTS = [
  { key: '--bg', label: 'Background' },
  { key: '--sidebar-bg', label: 'Sidebar' },
  { key: '--main-bg', label: 'Main Area' },
  { key: '--card-bg', label: 'Card' },
  { key: '--card-hover', label: 'Card Hover' },
  { key: '--border', label: 'Border' },
  { key: '--text', label: 'Text' },
  { key: '--text-muted', label: 'Text Muted' },
  { key: '--text-faint', label: 'Text Faint' },
  { key: '--divider', label: 'Divider' },
  { key: '--sidebar-active', label: 'Active Item' },
  { key: '--input-bg', label: 'Input BG' },
];

export const SPACE_COLORS = [
  '#7c6af5', '#4f8ef7', '#22d3ee', '#4ade80',
  '#facc15', '#fb923c', '#f87171', '#f472b6',
];

export const SPACE_EMOJIS = ['🌐', '📌', '📚', '💼', '🔖', '⭐', '🎯', '🚀', '💡', '🎨'];

export const COLLECTION_COLORS = [
  { key: 'red', hex: '#f87171' },
  { key: 'orange', hex: '#fb923c' },
  { key: 'yellow', hex: '#facc15' },
  { key: 'green', hex: '#4ade80' },
  { key: 'cyan', hex: '#22d3ee' },
  { key: 'blue', hex: '#60a5fa' },
  { key: 'purple', hex: '#a78bfa' },
  { key: 'pink', hex: '#f472b6' },
];
