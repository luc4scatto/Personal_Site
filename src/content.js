// Single source of truth for the site's editable copy. Change a value here — the
// site picks it up on the next `npm run dev` / `npm run build`. Applies to
// index.html and vivatech.html (via [data-copy] attributes, wired in main.js) and
// to src/hero3d.js, src/animations.js (imported directly).
//
// A '\n' inside a string becomes a line break (<br>) where it's rendered.
export const content = {
  hero: {
    kicker: "Hi, I'm Luca Scattolin",
    line1: 'Bringing ideas',
    line2Prefix: 'to life with',
    words: ['3D', '2D', 'AI'], // cycles through the accent word after "to life with"
    subtitle: '3D Technical Artist & Creative Technologist',
    tagline:
      'I build 2D-3D pipelines across every major DCC softwares,\npowering also configurators and interactive 3D experiences.',
    hint: '✦ click on an object to learn more',
    cta: 'See my works ↓',
  },
  // scrolling marquee band between hero and about (src/main.js builds the loop from this array)
  // keep an even number of words or the lime/violet alternation jumps at the loop seam
  marquee: {
    words: ['USD Enthusiast', 
            'Omniverse Wizard', 
            'Blender Endorser', 
            'Unreal Engine Explorer', 
            'Maya Wrangler', 
            'TouchDesigner Lover',
            'Adobe Suite Aficionado',
            'Python Ninja'],
  },
  about: {
    paragraph:
      'I work in the 3D R&D team at Thélios (LVMH eyewear), where I develop and maintain the 3D pipeline - from 2D design all the way to renders, 3D configurators and video.\nI recently built an interactive experience with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris. Python ties it all together, across the whole 3D stack.',
  },
  projects: {
    vivatech: {
      title: 'Vivatech - Interactive Experience',
      description:
        'Real-time interactive installation built with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris.',
    },
    two: {
      title: 'Project Two',
      description: 'Short description of the project, what it does and why it matters.',
    },
    three: {
      title: 'Homelab',
      description: 'Short description of the project, what it does and why it matters.',
    },
  },
  contact: {
    tagline: 'Got a project in mind or just want to say hi?',
    email: 'scattolinluca2@gmail.com',
  },
  footer: {
    copyright: '© 2026 Luca Scattolin',
  },
  vivatech: {
    kicker: 'Project',
    meta: 'Thélios · LVMH Dream Gallery · Vivatech Paris 2026 · TouchDesigner + Unreal Engine',
    description1:
      "At Vivatech 2026 - the tenth edition of Europe's biggest tech event - LVMH brought ten of its Maisons to the Dream Gallery pavilion in Paris, showing how technology amplifies craftsmanship across the whole value chain.",
    description2:
      'For the Thélios space I developed the real-time interactive experience: a live 3D showcase of eyewear digital twins, built with TouchDesigner and Unreal Engine, letting visitors explore frames, materials and details up close as they interact with the installation.',
    backCta: '← Back to projects',
  },
  // shown when a 3D hero object is clicked (src/hero3d.js) — keyed by model filename
  hero3dObjects: {
    turntable: { title: 'Vinyl & DJing', text: 'Placeholder - I spin records and love the ritual of mixing on a real turntable.' },
    pile_of_vinyl: { title: 'Vinyl Collection', text: 'Placeholder - an ever-growing crate of records I hunt for on weekends.' },
    mixing_board_01: { title: 'Mixing', text: 'Placeholder - layering tracks and riding faders is my kind of flow state.' },
    mixing_board_03: { title: 'Live Sound', text: 'Placeholder - patching a console and dialing in a mix for a room.' },
    synthesizer: { title: 'Synths', text: 'Placeholder - chasing sounds and building patches from scratch.' },
    knob_39: { title: 'Sound Design', text: 'Placeholder - I tweak knobs until a patch finally clicks.' },
    knob_44: { title: 'Tweaking', text: 'Placeholder - endless fine-tuning is half the fun.' },
    gaming_computer: { title: 'PC Gaming', text: 'Placeholder - I built this rig myself and it doubles as my render machine.' },
    gaming_gpu: { title: 'Hardware', text: 'Placeholder - GPUs, benchmarks and the occasional upgrade rabbit hole.' },
    integrated_circuit_01: { title: 'Electronics', text: 'Placeholder - tinkering with circuits and small hardware projects.' },
    integrated_circuit_02: { title: 'Chips & Boards', text: 'Placeholder - I like understanding how the silicon actually works.' },
    transistor_03: { title: 'Tinkering', text: 'Placeholder - soldering, breadboards and figuring things out by hand.' },
    '3d_printer': { title: '3D Printing', text: 'Placeholder - prototyping props and parts one layer at a time.' },
    classical_computer_mouse_03: { title: 'Everyday Tools', text: 'Placeholder - the trusty tools I work with every day.' },
    connector_iec_c19_coiled: { title: 'Gear & Cables', text: 'Placeholder - the unglamorous cables that keep the studio running.' },
    cable_ethernet_coiled: { title: 'Connectivity', text: 'Placeholder - a tidy network is a happy network.' },
    sunglasses_04: { title: 'Eyewear & Design', text: 'Placeholder - eyewear is where my day job at Thélios meets good design.' },
    concert_speaker_02: { title: 'Live Music', text: 'Placeholder - gigs, festivals and chasing the perfect drop.' },
    _default: { title: 'One of my things', text: 'Placeholder description - this object represents one of my interests.' },
  },
  // invitation filling the empty gutter beside the skills grid until a pill is clicked
  // (.skill-ghost in index.html — only rendered from 1000px up, see sections.css)
  skillsHint: {
    title: 'Pick a skill',
    text: 'Click any tool to see what I actually do with it.',
  },
  // shown in the Skills section panel (src/main.js) — color = brand color extracted from each icon
  skills: {
    blender: {
      title: 'Blender',
      text: 'Free, open-source 3D suite covering the full pipeline: modeling, shading, animation and rendering.',
      color: '#E87D0D',
      selfTaught: true,
      bullets: ['Rendering', 'Shading', 'Lighting', 'Compositing', 'Scripting and Automation', 'Animation', 'Modeling'],
    },
    'autodesk-maya': {
      title: 'Autodesk Maya',
      text: 'Industry-standard 3D animation and rigging software used across film, games and VFX production.',
      color: '#37A5CC',
      bullets: ['Rendering', 'Scripting and Automation', 'Shading', 'Lighting', 'Animation', 'Modeling', 'Rigging'],
    },
    'adobe-substance-3d': {
      title: 'Adobe Substance 3D',
      text: "Adobe's texturing suite for painting and building procedural materials for real-time and offline rendering.",
      color: '#E03028',
      bullets: [
        { label: 'Substance Painter', subs: ['UV based texture', 'Triplanar Textures', 'Bake Textures'] },
        { label: 'Substance Designer', subs: ['Procedural Materials', 'Tiled Textures', 'SBSAR and SBR material ready to every DCCs'] },
      ],
    },
    'nvidia-omniverse': { title: 'NVIDIA Omniverse', text: "NVIDIA's platform for real-time 3D collaboration and simulation, built on USD.", color: '#76B900', selfTaught: true },
    'unreal-engine': { title: 'Unreal Engine', text: 'Real-time 3D engine for interactive experiences, virtual production and high-fidelity visualization.', color: '#FFFFFF' },
    touchdesigner: { title: 'TouchDesigner', text: 'Node-based visual programming environment for real-time interactive and generative media.', color: '#707D51', selfTaught: true },
    'after-effects': { title: 'After Effects', text: "Adobe's motion graphics and compositing tool for animation and video effects.", color: '#9999FF', selfTaught: true },
    'premiere-pro': { title: 'Premiere Pro', text: "Adobe's non-linear video editing software for cutting and finishing footage.", color: '#9999FF' },
    'davinci-resolve': { title: 'DaVinci Resolve', text: 'Editing, color grading and finishing suite built around a professional color pipeline.', color: '#F0506B' },
    photoshop: { title: 'Photoshop', text: "Adobe's raster image editor for photo retouching, compositing and texture work.", color: '#31A8FF' },
    illustrator: { title: 'Illustrator', text: "Adobe's vector graphics editor for logos, icons and scalable artwork.", color: '#FF9A00' },
    python: { title: 'Python', text: 'General-purpose scripting language used to automate pipelines and extend DCC tools.', color: '#3776AB', selfTaught: true },
    'qt-designer': { title: 'Qt Designer', text: 'Visual layout tool for building Qt-based desktop application interfaces.', color: '#41CD52', selfTaught: true },
    'hermes-agent': { title: 'Hermes Agent', text: 'Custom AI agent built to automate day-to-day tasks and workflows.', color: '#D7B97B' },
    'claude-code': { title: 'Claude Code', text: "Anthropic's agentic coding CLI for pair-programming and repo-wide automation.", color: '#D97757' },
    'second-brain': { title: 'Second Brain', text: 'Personal knowledge system for capturing, connecting and retrieving notes.', color: '#A78BFA' },
    comfyui: { title: 'ComfyUI', text: 'Node-based interface for building and running Stable Diffusion image generation pipelines.', color: '#B4EC17' },
  },
};
