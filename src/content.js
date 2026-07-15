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
      'I work in the 3D R&D team at Thélios (LVMH eyewear), where I develop and maintain the 3D pipeline — from 2D design all the way to renders, 3D configurators and video.\nI recently built an interactive experience with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris. Python ties it all together, across the whole 3D stack.',
  },
  projects: {
    vivatech: {
      title: 'Vivatech — Interactive Experience',
      description:
        'Real-time interactive installation built with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris.',
    },
    two: {
      title: 'Project Two',
      description: 'Short description of the project, what it does and why it matters.',
    },
    three: {
      title: 'Project Three',
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
      "At Vivatech 2026 — the tenth edition of Europe's biggest tech event — LVMH brought ten of its Maisons to the Dream Gallery pavilion in Paris, showing how technology amplifies craftsmanship across the whole value chain.",
    description2:
      'For the Thélios space I developed the real-time interactive experience: a live 3D showcase of eyewear digital twins, built with TouchDesigner and Unreal Engine, letting visitors explore frames, materials and details up close as they interact with the installation.',
  },
  // shown when a 3D hero object is clicked (src/hero3d.js) — keyed by model filename
  hero3dObjects: {
    turntable: { title: 'Vinyl & DJing', text: 'Placeholder — I spin records and love the ritual of mixing on a real turntable.' },
    pile_of_vinyl: { title: 'Vinyl Collection', text: 'Placeholder — an ever-growing crate of records I hunt for on weekends.' },
    mixing_board_01: { title: 'Mixing', text: 'Placeholder — layering tracks and riding faders is my kind of flow state.' },
    mixing_board_03: { title: 'Live Sound', text: 'Placeholder — patching a console and dialing in a mix for a room.' },
    synthesizer: { title: 'Synths', text: 'Placeholder — chasing sounds and building patches from scratch.' },
    knob_39: { title: 'Sound Design', text: 'Placeholder — I tweak knobs until a patch finally clicks.' },
    knob_44: { title: 'Tweaking', text: 'Placeholder — endless fine-tuning is half the fun.' },
    gaming_computer: { title: 'PC Gaming', text: 'Placeholder — I built this rig myself and it doubles as my render machine.' },
    gaming_gpu: { title: 'Hardware', text: 'Placeholder — GPUs, benchmarks and the occasional upgrade rabbit hole.' },
    integrated_circuit_01: { title: 'Electronics', text: 'Placeholder — tinkering with circuits and small hardware projects.' },
    integrated_circuit_02: { title: 'Chips & Boards', text: 'Placeholder — I like understanding how the silicon actually works.' },
    transistor_03: { title: 'Tinkering', text: 'Placeholder — soldering, breadboards and figuring things out by hand.' },
    '3d_printer': { title: '3D Printing', text: 'Placeholder — prototyping props and parts one layer at a time.' },
    classical_computer_mouse_03: { title: 'Everyday Tools', text: 'Placeholder — the trusty tools I work with every day.' },
    connector_iec_c19_coiled: { title: 'Gear & Cables', text: 'Placeholder — the unglamorous cables that keep the studio running.' },
    cable_ethernet_coiled: { title: 'Connectivity', text: 'Placeholder — a tidy network is a happy network.' },
    sunglasses_04: { title: 'Eyewear & Design', text: 'Placeholder — eyewear is where my day job at Thélios meets good design.' },
    concert_speaker_02: { title: 'Live Music', text: 'Placeholder — gigs, festivals and chasing the perfect drop.' },
    _default: { title: 'One of my things', text: 'Placeholder description — this object represents one of my interests.' },
  },
  // shown in the Skills section panel (src/main.js) — color = brand color extracted from each icon
  skills: {
    blender: { title: 'Blender', text: 'Placeholder — what I actually do with Blender goes here.', color: '#E87D0D' },
    'autodesk-maya': { title: 'Autodesk Maya', text: 'Placeholder — what I actually do with Maya goes here.', color: '#37A5CC' },
    'adobe-substance-3d': { title: 'Adobe Substance 3D', text: 'Placeholder — what I actually do with Substance 3D goes here.', color: '#E03028' },
    'nvidia-omniverse': { title: 'NVIDIA Omniverse', text: 'Placeholder — what I actually do with Omniverse goes here.', color: '#76B900' },
    'unreal-engine': { title: 'Unreal Engine', text: 'Placeholder — what I actually do with Unreal Engine goes here.', color: '#FFFFFF' },
    touchdesigner: { title: 'TouchDesigner', text: 'Placeholder — what I actually do with TouchDesigner goes here.', color: '#707D51' },
    'after-effects': { title: 'After Effects', text: 'Placeholder — what I actually do with After Effects goes here.', color: '#9999FF' },
    'premiere-pro': { title: 'Premiere Pro', text: 'Placeholder — what I actually do with Premiere Pro goes here.', color: '#9999FF' },
    'davinci-resolve': { title: 'DaVinci Resolve', text: 'Placeholder — what I actually do with DaVinci Resolve goes here.', color: '#F0506B' },
    photoshop: { title: 'Photoshop', text: 'Placeholder — what I actually do with Photoshop goes here.', color: '#31A8FF' },
    illustrator: { title: 'Illustrator', text: 'Placeholder — what I actually do with Illustrator goes here.', color: '#FF9A00' },
    python: { title: 'Python', text: 'Placeholder — what I actually do with Python goes here.', color: '#3776AB' },
  },
};
