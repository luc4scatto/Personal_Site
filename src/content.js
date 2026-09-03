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
      'My path into 3D started at **EssilorLuxottica**, where I spent over four years as a 3D Render Specialist working on **Prada Group**, **Burberry** and **Oliver Peoples** eyewear lines. \n' +
      'In my last two years there I moved into improving and building new features for the 3D pipeline itself, a focus I carried forward into **Thélios**.\n' +
      'Today I\'m part of the 3D R&D team at **Thélios** (**LVMH** eyewear), where I develop and maintain the 3D pipeline, from 2D design all the way to renders, 3D configurators and video.\n'
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
  // placeholder page - Luca hasn't picked the project yet, fill in kicker/meta/description when he does
  projectTwo: {
    kicker: 'Project',
    meta: 'Details coming soon',
    description1: 'This page is a placeholder - content for this project is on its way.',
    backCta: '← Back to projects',
  },
  homelab: {
    kicker: 'Project',
    meta: 'Personal project · Self-hosted · Ongoing',
    description1:
      'A homelab I run for the sake of learning: self-hosting, networking and sysadmin work, outside of anything work-related.',
    // TODO Luca: swap this in once hardware/services are settled - what's running, why, what it does
    description2: 'Hardware, services and stack details coming soon.',
    backCta: '← Back to projects',
  },
  notFound: {
    kicker: 'Error',
    meta: 'That page doesn\'t exist',
    description1: 'The link might be broken, or the page moved. Head back home and try again.',
    backCta: '← Back home',
  },
  // shown when a 3D hero object is clicked (src/hero3d.js) — keyed by model filename
  hero3dObjects: {
    turntable: { title: 'Vinyl Playing', text: 'I spin records and love the ritual of mixing on a real turntable in my studio.' },
    pile_of_vinyl: { title: 'Vinyl Collection', text: 'An ever-growing crate of records I hunt for on weekends.' },
    mixing_board_01: { title: 'Mixing', text: 'Mixing audio across vinyl and digital gives me the flexibility and refinement I\'m seeking.' },
    mixing_board_03: { title: 'CDJs', text: 'Where vinyl brings warmth and fragility, digital brings versatility. I like working the line between them.' },
    synthesizer: { title: 'Music Production', text: 'When I have time, I like messing around with music production too, with Ableton and all the plugins out there..' },
    knob_39: { title: 'Tweaking', text: 'Endless fine-tuning is half the fun.' },
    knob_44: { title: 'Tweaking', text: 'Endless fine-tuning is half the fun.' },
    gaming_computer: { title: 'PC & Technology', text: 'Always been a fan of computers and technology, forever chasing what\'s new in the field.' },
    gaming_gpu: { title: 'Hardware', text: 'Always hunting for the best deal on PC and server components. Sadly they\'re very expensive right now!' },
    integrated_circuit_01: { title: 'Electronics', text: 'Tinkering with circuits and small hardware projects.' },
    integrated_circuit_02: { title: 'Chips & Boards', text: 'Tinkering with circuits and small hardware projects.' },
    transistor_03: { title: 'Tinkering', text: 'Tinkering with circuits and small hardware projects.' },
    '3d_printer': { title: '3D Printing', text: 'Lets me give concrete shape to my craziest ideas, one layer at a time.' },
    classical_computer_mouse_03: { title: 'Everyday Tools', text: 'The trusty tools I work with every day.' },
    cable_ethernet_coiled: { title: 'Connectivity', text: 'A tidy network is a happy network.' },
    sunglasses_04: { title: 'Eyewear', text: 'Eyewear is where my day job at Thélios meets technology.' },
    concert_speaker_02: { title: 'Speakers', text: 'I like listening to music wherever I am.' },
    server_console_station: { title: 'Server', text: 'My self-hosted homelab. Head to the Projects section for more info!' },
    compact_camera: { title: 'Photography/Video', text: 'I like documenting the trips I take with photos and videos.' },
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
      bullets: [
        'Rendering',
        'Shading',
        'Lighting',
        'Compositing',
        'Scripting and Automation',
        'Animation',
        'Modeling',
      ],
    },
    'autodesk-maya': {
      title: 'Autodesk Maya',
      text: 'Industry-standard 3D animation and rigging software used across film, games and VFX production.',
      color: '#37A5CC',
      bullets: [
        'Rendering',
        'Scripting and Automation',
        'Shading',
        'Lighting',
        'Animation',
        'Modeling',
        'Rigging',
      ],
    },
    'adobe-substance-3d': {
      title: 'Adobe Substance 3D',
      text: "Adobe's texturing suite for painting and building procedural materials for real-time and offline rendering.",
      color: '#E03028',
      bullets: [
        {
          label: 'Substance Painter',
          subs: [
            'UV based texture',
            'Triplanar Textures',
            'Bake Textures',
          ],
        },
        {
          label: 'Substance Designer',
          subs: [
            'Procedural Materials',
            'Tiled Textures',
            'SBSAR and SBR material ready to every DCCs',
          ],
        },
      ],
    },
    'nvidia-omniverse': {
      title: 'NVIDIA Omniverse',
      text: "NVIDIA's platform for real-time 3D collaboration and simulation, built on USD.",
      color: '#76B900',
      selfTaught: true,
      bullets: [
        'Automation and Extensions',
        'Rendering',
        'MTLX, OpenPBR Shading',
        'Manage USD complex files',
      ],
    },
    'unreal-engine': {
      title: 'Unreal Engine',
      text: 'Real-time 3D engine for interactive experiences, virtual production and high-fidelity visualization.',
      color: '#FFFFFF',
      bullets: [
        'Real-Time Rendering',
        'Path-Tracing Rendering',
        'Animation and Sequences',
        'Real-Time Experiences (with TouchDesigner)',
        'Real-Time Scenes',
        'Configurators',
        'Substrate Materials',
      ],
    },
    touchdesigner: {
      title: 'TouchDesigner',
      text: 'Node-based visual programming environment for real-time interactive and generative media.',
      color: '#707D51',
      selfTaught: true,
      bullets: [
        'Audio-reactive Visuals',
        'Connection between TD and other DCCs',
        'Real-Time Experiences',
        'External controller connection',
        'Scripting',
        '3D Scenes',
      ],
    },
    'after-effects': {
      title: 'After Effects',
      text: "Adobe's motion graphics and compositing tool for animation and video effects.",
      color: '#9999FF',
      selfTaught: true,
      bullets: [
        'Post Production',
        'Motion Design',
        'Scripting, UI custom panels and Tools',
      ],
    },
    'premiere-pro': {
      title: 'Premiere Pro',
      text: "Adobe's non-linear video editing software for cutting and finishing footage.",
      color: '#9999FF',
      bullets: [
        'Video Editing',
        'Color Correction',
        'Color Grading',
      ],
    },
    'davinci-resolve': {
      title: 'DaVinci Resolve',
      text: 'Editing, color grading and finishing suite built around a professional color pipeline.',
      color: '#F0506B',
      selfTaught: true,
      bullets: [
        'Editing',
        'Post Production',
        'Color Correction',
        'Color Grading',
      ],
    },
    photoshop: {
      title: 'Photoshop',
      text: "Adobe's raster image editor for photo retouching, compositing and texture work.",
      color: '#31A8FF',
      bullets: [
        'General Post Production',
        '3D Multipass Shots',
      ],
    },
    illustrator: {
      title: 'Illustrator',
      text: "Adobe's vector graphics editor for logos, icons and scalable artwork.",
      color: '#FF9A00',
      bullets: [
        'Assets creation for Motion Design',
        '2D Assets for presentation',
      ],
    },
    python: {
      title: 'Python',
      text: 'General-purpose scripting language used to automate pipelines and extend DCC tools.',
      color: '#3776AB',
      selfTaught: true,
      bullets: [
        'Scripts and UI for automation in basically every DCC',
        'Connecting multiple sources of truth (PLM, PIM, DAM, SAP, databases) to 3D software',
        'Building tools to speed up the pipeline and everyday work',
        'PyQt5/6 and PySide for the UI',
      ],
    },
    'qt-designer': {
      title: 'Qt Designer',
      text: 'Visual layout tool for building Qt-based desktop application interfaces.',
      color: '#41CD52',
      selfTaught: true,
    },
    'agentic-workflow': {
      title: 'Agentic Workflow',
      text: 'AI agents wired into the daily pipeline: coding, automation and repetitive tasks handled end to end.',
      color: '#D97757',
      selfTaught: true,
      bullets: [
        'Hermes Agent',
        'Claude Code',
        'OpenClaw',
        'n8n',
      ],
    },
    'second-brain': {
      title: 'Second Brain',
      text: 'Personal knowledge system for capturing, connecting and retrieving notes.',
      color: '#A78BFA',
      selfTaught: true,
      bullets: [
        'Corporate Brain',
        'Personal Brain',
        'Obsidian',
        'Feeding the brain to AI agents for fast, on-point answers',
        'Running it with local models to keep sensitive data private',
      ],
    },
    comfyui: {
      title: 'ComfyUI',
      text: 'Node-based environment for generative image pipelines - models, controls and post-processing chained into repeatable workflows.',
      color: '#B4EC17',
      selfTaught: true,
      bullets: [
        'Product-oriented workflows',
        'Placing real products on human models',
        'Integration with other DCCs',
      ],
    },
    'ableton-live': {
      title: 'Ableton Live',
      text: 'Digital audio workstation for producing, arranging and performing music.',
      color: '#FFFFFF',
      selfTaught: true,
      bullets: [
        'Mixing and Arrangement',
        'Sound Design',
        'Plugins and Instruments',
      ],
    },
  },
};
