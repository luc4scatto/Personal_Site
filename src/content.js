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
      'I build 2D-3D pipelines across every major DCC tool,\nalso powering configurators and interactive 3D experiences,\nwith a touch of AI.',
    hint: '✦ click on an object to learn more',
    cta: 'See my works ↓',
  },
  // scrolling marquee band between hero and about (src/main.js builds the loop from this array)
  // keep an even number of words or the lime/violet alternation jumps at the loop seam
  marquee: {
    words: [
      'USD Enthusiast',
      'Omniverse Wizard',
      'Blender Endorser',
      'Unreal Engine Explorer',
      'Maya Wrangler',
      'TouchDesigner Lover',
      'Adobe Suite Aficionado',
      'Python Ninja',
    ],
  },
  about: {
    paragraph:
      'My path into 3D started at **EssilorLuxottica**, where I spent over four years as a 3D Render Specialist working on **Prada Group**, **Burberry** and **Oliver Peoples** eyewear lines. \n' +
      'In my last two years there I moved into improving and building new features for the 3D pipeline itself, a focus I carried forward into **Thélios**.\n' +
      "Today I'm part of the 3D R&D team at **Thélios** (**LVMH** eyewear), where I develop and maintain the 3D pipeline, from 2D design all the way to renders, 3D configurators and videos.\n",
  },
  projects: {
    vivatech: {
      title: 'Vivatech - Interactive Experience',
      description:
        'Real-time interactive installation built with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris.',
    },
    pipeline: {
      title: 'Pipeline Projects',
      description:
        'Five in-house tools for Maya, Unreal Engine, Omniverse and PowerPoint, from USD and MaterialX look-dev to renders and decks, each built to remove one slow, manual step from the 3D workflow.',
    },
    companyBrain: {
      title: 'Company Brain',
      description:
        'A self-hosted AI assistant that answers questions about our products in plain language, reading live from the company systems and replying with photos, drawings and charts. Nothing leaves the company.',
    },
    three: {
      title: 'Personal project: Homelab',
      description:
        'A self-hosted rack running on Proxmox and TrueNAS, media, backups, automation and an AI agent, built from a 3D-printed case and one spare mini PC.',
    },
  },
  contact: {
    tagline: 'Got a project in mind or just want to say hi?',
    // Formspree endpoint — keeps the address off the page entirely instead of just obfuscating it
    formEndpoint: 'https://formspree.io/f/mqpkyvlq',
  },
  footer: {
    copyright: '© 2026 Luca Scattolin',
  },
  vivatech: {
    kicker: 'Project',
    description1:
      "At Vivatech 2026 - the tenth edition of Europe's biggest tech event - LVMH brought ten of its Maisons to the Dream Gallery pavilion in Paris, showing how technology amplifies craftsmanship across the whole value chain.",
    description2:
      'For the Thélios space I developed the real-time interactive experience: a live 3D showcase of eyewear digital twins, built with TouchDesigner and Unreal Engine, letting visitors explore frames, materials and details up close as they interact with the installation.',
    // "How it works": the installation's own chain and the visitor's path through it.
    // Sanitized like pipelineProjects: no brand names, model codes, IPs or internal level names.
    how: {
      title: 'How it works',
      intro:
        "Nothing in the booth is touched. A webcam follows one hand and the visitor's head, TouchDesigner turns that into gestures, and Unreal Engine answers in real time - both running on the same machine.",
      flow: [
        { name: 'Webcam', text: '1080p, one hand and the head' },
        {
          name: 'TouchDesigner',
          text: 'MediaPipe hand and pose tracking, gestures built in CHOPs',
        },
        { name: 'OSC', text: 'One message per gesture channel, over localhost' },
        { name: 'Unreal Engine 5.7', text: 'Levels, sequences and UI driven by those messages' },
      ],
      journeyLabel: "The visitor's path",
      steps: [
        {
          gesture: 'Thumbs up',
          text: 'An attract loop plays until someone holds a thumb up to start.',
        },
        { gesture: 'One or two fingers', text: 'Held up to pick one of the two Maisons.' },
        {
          gesture: 'Pick, zoom, grab',
          text: 'At a workbench the frame lies in parts: one finger picks, two zoom in, a closed fist puts it back together, each gesture playing its own assembly sequence.',
        },
        {
          gesture: 'Pinch, move, flip',
          text: 'A gesture opens free exploration: pinch and hold to take the frame, move to turn it, push forward to zoom, flip the hand to change color.',
        },
        {
          gesture: 'Thumbs up again',
          text: 'When the session runs long, a thumbs up keeps it going. Otherwise it returns to the loop.',
        },
      ],
      detailLabel: 'The interesting part',
      details: [
        {
          title: 'Hold to confirm',
          text: "Every choice fills a round progress bar while the gesture is held, so a hand passing through a crowded booth can't trigger anything by accident.",
        },
        {
          title: 'Tuned on site',
          text: "Every range and threshold lives in one control panel in TouchDesigner, so tracking could be recalibrated to the booth's distance and light without touching the network.",
        },
        {
          title: 'Training built in',
          text: 'Nobody reads instructions at a fair. Free exploration opens with four short video steps, and each one only moves on once the visitor has done the gesture.',
        },
      ],
    },
    backCta: '← Back to projects',
  },
  // Company Brain: sanitized like pipelineProjects - no brand names, system names, vendors, hosts or real data.
  companyBrain: {
    kicker: 'Internal project',
    meta: 'A self-hosted AI assistant that answers questions about our products from the company systems',
    description1:
      'Information about a product lives in many systems: **technical data**, **commercial texts and attributes**, **official photos**, **technical drawings** and standard components, **prototype tracking**, plus design manuals and internal notes. Each has its own interface, its own login, its own way of searching, so a simple question like "what material is this model, and how is it built?" often means opening three or four programs and knowing exactly where to look.',
    description2:
      '**Company Brain** is one chat that fixes that. You ask in plain language, like you would ask an expert colleague, and it reads the answer live from the company systems and gives it back with photos, drawings and charts. It runs on our own servers, so nothing leaves the company, and every answer says which system each piece of data came from.',
    demoIntro:
      'Redrawn with made-up data. One question goes through a chat, a language model that decides what to do, and small purpose-built tools that each know how to talk to one system. Pick a question to watch it travel.',
    how: {
      title: 'How it works',
      flow: [
        {
          name: 'Chat',
          text: 'Internal web chat, questions in plain language',
        },
        {
          name: 'Language model',
          text: 'Runs on our own server on a dedicated GPU, understands the question and picks a tool',
        },
        {
          name: 'Tools',
          text: 'Small custom programs, one per source: fetch, calculate, prepare the result',
        },
        {
          name: 'Company systems',
          text: 'Technical data, catalog, photos, drawings, prototypes, manuals',
        },
      ],
      detailLabel: 'Design choices',
      details: [
        {
          title: 'Everything in-house',
          text: 'The model runs on an internal server with a dedicated GPU. No question and no data is ever sent to an external service.',
        },
        {
          title: 'Read-only, and gated',
          text: 'It consults the company systems but cannot change them: every connection uses a read-only account, and each group only sees the tools relevant to its own work.',
        },
        {
          title: 'The code does the math',
          text: 'Language models are good with words and less reliable with numbers, so averages, counts, comparisons and charts are computed exactly by the tools. The model only receives the result to explain.',
        },
        {
          title: 'No copies of the data',
          text: 'Photos, drawings and documents are read from the original source at the moment of the question, never duplicated on the server, so what you see is always current.',
        },
      ],
      monitorLabel: 'Monitoring',
      monitor:
        'An internal dashboard shows whether every service is up, how loaded the server is and which tools get used the most. It tells us where to invest next.',
      retroTitle: 'Looking back',
      lessonsLabel: 'What I learned',
      lessons: [
        {
          title: 'Small and well taught beats big and alone',
          text: 'The real work is in the tools: giving the model data that is already clean, ordered and short.',
        },
        {
          title: 'Less text is better',
          text: 'Long answers confuse the model and eat memory, so every tool returns only what is needed.',
        },
        {
          title: 'Charts need a point',
          text: 'A chart earns its place when it shows a trend or a comparison, not fifty nearly equal values.',
        },
      ],
      limitsLabel: 'Limits and next steps',
      limits: [
        {
          title: 'One GPU, for now',
          text: 'With many users at once, answers slow down. More capable models would need a more powerful machine, which is the next step, along with more data sources and other departments.',
        },
        {
          title: 'Finds and summarizes',
          text: 'It is good at finding and summarizing. Decisions stay with people.',
        },
      ],
    },
    backCta: '← Back to projects',
  },
  // coming-soon page - a standing placeholder for whatever gets added next, not one named project
  projectTwo: {
    kicker: "What's next",
    meta: 'New work in progress',
    description1:
      'A few more projects are underway - more 3D pipeline work, interactive builds and self-hosted experiments like the homelab. This page will fill in as they land.',
    backCta: '← Back to projects',
  },
  homelab: {
    kicker: 'Personal Project',
    description1:
      'It started with something simple: a shared folder my Windows machine and my Mac could both reach, instead of shuffling files between them by hand with an external hard drive, inconvenient enough over time, that I went looking for a better way. That one NAS folder opened a door into **self-hosted software**, and I never really came back out.',
    description2:
      'The rack runs on an **HP EliteDesk 800G5** mini PC with **32GB of RAM**, 2.5G custom Network card and an unmanaged switch, wired into a **3D-printed rack case**: an open design I found and adapted, swapping in other printable parts until it fit what I actually needed. A **JetKVM** sits on top for headless remote management; BIOS access and reboots from anywhere, no monitor or keyboard needed on-site.',
    description3:
      'Virtualized on **Proxmox**: **TrueNAS SCALE** runs the containerized stack on **ZFS** storage, media streaming and automation, photo backup, personal finance, network tooling, while **Hermes** handles agentic workflows.',
    description4:
      'Most of what I know about networking and sysadmin work, I picked up here, one broken config at a time.',
    backCta: '← Back to projects',
    // Powers the service tree in src/homelabDiagram.js. Labels only - no IPs,
    // ports, hostnames or versions (this page is public). Each service name maps
    // to public/icons/services/<slug>.svg by slug (lowercased, spaces to
    // dashes) - add a service here and drop its mark in that folder.
    diagram: {
      hub: 'Proxmox',
      categories: [
        { label: 'Media Streaming', services: ['Jellyfin', 'Navidrome', 'Jellyseerr'] },
        { label: 'Media Automation', services: ['Sonarr', 'Radarr', 'Prowlarr'] },
        {
          label: 'Downloads & Networking',
          services: ['qBittorrent', 'Qui', 'Tailscale', 'WireGuard'],
        },
        { label: 'Photos & Backup', services: ['Immich'] },
        { label: 'Home Automation', services: ['Home Assistant'] },
        { label: 'Dashboard', services: ['Homarr', 'Beszel'] },
        { label: 'Personal Finance', services: ['Actual Budget'] },
        { label: 'Infra & Dev Tools', services: ['TrueNAS', 'Dockge', 'code-server'] },
        { label: 'Agent', services: ['Hermes Agent'] },
      ],
    },
    servicesHint: 'Pick a service to read what it does.',
    // Card copy for the service tree, keyed by the same name used above - a
    // service with no entry here simply isn't clickable. Kept as a flat map
    // rather than inline in `categories` so that list stays a scannable
    // one-per-line index (same split as hero3dObjects further down).
    // These describe what each tool IS. The personal angle - why it's in this
    // rack, what it replaced, what it's for here - is Luca's to add.
    serviceInfo: {
      Proxmox:
        'The hypervisor the whole lab runs on. One machine split into VMs and containers, so every service below is isolated from the others and can be snapshotted or rolled back on its own.',
      Jellyfin:
        'Open-source media server. Streams a personal film and TV library to any device, with no subscription and nothing reporting back to a vendor.',
      Navidrome:
        'Music streaming for a local library. Subsonic-compatible, so any of the existing Subsonic clients works against it without a custom app.',
      Jellyseerr:
        'Request front-end for Jellyfin. Turns "can you add this title" into an entry the automation stack below picks up on its own.',
      Sonarr:
        'Follows TV series and watches for new episodes, then hands each one to the download client without anyone checking manually.',
      Radarr: 'The same job as Sonarr, for films: a wanted list, watched until a release shows up.',
      Prowlarr:
        'Indexer manager. Sources are configured once here and synced out to Sonarr and Radarr, instead of being set up twice and drifting apart.',
      qBittorrent:
        'The download client the rest of the stack hands work to. Open source, no ads, and controllable over its own API.',
      Qui: 'Web dashboard for qBittorrent, built for running more than one instance from a single screen. Cross-seed automation, scheduled backups and orphan-file cleanup, in one Go binary.',
      Tailscale:
        'Mesh VPN built on WireGuard. Puts every device on one private network without opening a single port on the router.',
      WireGuard:
        'The VPN protocol underneath Tailscale. Small enough to audit in an afternoon, which is why it displaced the older, heavier stacks.',
      Immich:
        'Self-hosted photo and video backup. Phone gallery sync, search and albums, without handing the library to a cloud provider.',
      Homarr:
        'The dashboard in front of everything else: one page with the status of each service and a way into it.',
      Beszel:
        'Resource monitor for the host and its containers: CPU, memory, disk, network, Docker stats and alerts, recorded over time instead of read once and forgotten.',
      'Home Assistant':
        'Home automation hub. Pulls smart-home devices from different brands onto one local dashboard and rule engine, instead of a separate app per manufacturer.',
      'Actual Budget':
        'Local-first envelope budgeting. The data lives on the server and the app syncs to it, rather than to somebody else.',
      TrueNAS:
        'Storage operating system. Runs the ZFS pools everything else reads and writes, with snapshots and scheduled scrubs underneath.',
      Dockge:
        'Manager for Docker Compose stacks. Edits the compose file and tails the logs from a browser instead of over ssh.',
      'code-server':
        'VS Code running on the server and reached through a browser, so a config can be edited from any machine without setting one up first.',
      'Hermes Agent':
        'Self-hosted AI agent from Nous Research, reachable over Telegram and Discord instead of a web UI. Builds its own skills from experience and keeps memory across sessions, rather than starting blank every chat.',
    },
  },
  // Internal tools built at Thélios. This page is public and so is the repo:
  // no internal tool names, brands, systems, vendors, paths or real product
  // codes - only what each tool does, in general terms. The mockups in
  // pipeline-projects.html follow the same rule (redrawn, fake data).
  pipelineProjects: {
    kicker: 'Built at Thélios',
    intro1:
      'In the **3D R&D team** at Thélios, a lot of the slow work was not modeling or rendering, it was everything around it: cleaning and naming meshes by hand, building the variants for every colorway, renaming hundreds of renders, assembling presentation decks slide by slide.',
    intro2:
      'None of these tools were planned as a system. Each one started from a specific problem the team kept hitting, and grew until those problems went away. They were built to make the most of what **Maya**, **Unreal Engine** and **NVIDIA Omniverse** can do, or as standalone **Python** desktop apps. The look-dev side is built on open standards: **USD** for everything in the scene and **OpenPBR in MaterialX** for every material.',
    disclaimer:
      'Built in-house. Tool names, data and interfaces shown here are generalized and redrawn - no proprietary code, data or assets.',
    indexHint: 'Five tools, each built to fix one problem. Pick one to see it.',
    backCta: '← Back to projects',
    // Rendered by src/pipelineProjects.js into the index tiles and each
    // chapter's text column. `id` matches the chapter's id in the page.
    tools: [
      {
        id: 'omniverse',
        name: 'Look-dev panel for Omniverse',
        icon: 'nvidia-omniverse.svg',
        // pills under the title: the tools each one is built with (icon optional)
        highlights: [
          { icon: 'usd.svg', label: 'USD' },
          { icon: 'materialx.svg', label: 'OpenPBR · MaterialX' },
          { icon: 'python.svg', label: 'Python' },
          { icon: 'omniverse.svg', label: 'Omniverse Kit' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Look-dev scenes built by hand, one model and one material at a time.',
        problem:
          'Setting up a look-dev scene meant importing models one by one, hunting materials across a shared library, cross-checking product data between separate databases to get it right, and rendering every model and colorway by hand, one at a time, before anything could go to review.',
        bullets: [
          'Brings hand-picked prototypes or single models into the scene straight from product data, each one composed into the stage as **USD**',
          'Searches, creates, updates and copies **OpenPBR** materials authored in **MaterialX**, with thumbnail renders on sample shapes',
          'Batch-renders the selected SKUs with **Omniverse RTX**, the ray-traced renderer that runs on NVIDIA GPUs',
          'Steps through every model and colorway in the scene to check each look before it goes out',
        ],
        idea: 'The whole kit is built around two open standards: **USD** for everything in the scene, from templates to models, and **OpenPBR in MaterialX** for every material, so a material is written once in a standard format that any USD or MaterialX-compatible tool can open, with no conversion. Materials are also **portable**: whenever one is created or updated, its links to textures and to its master material are saved as relative paths, so a material folder can be moved anywhere in the library and every scene that uses it keeps working.',
      },
      {
        id: 'maya',
        name: 'Maya prep toolkit',
        icon: 'autodesk-maya.svg',
        highlights: [
          { icon: 'autodesk-maya.svg', label: 'Maya' },
          { icon: 'python.svg', label: 'Python' },
          { icon: 'qt-designer.svg', label: 'PySide6' },
          { label: 'SQL' },
          { label: 'JSON' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Every artist prepped meshes their own way, so nothing matched downstream.',
        problem:
          'Every artist cleaned, unwrapped and named meshes a little differently, so models arrived downstream inconsistent and had to be fixed again before rendering.',
        bullets: [
          'One dockable panel for mesh cleanup: combine, separate, group, freeze, pivot, mirror with automatic left/right naming',
          'UV presets tuned for lenses and acetate parts, plus a dedicated lightmap UV set',
          'Diagnostic materials (checker, arrow pattern, RGB) to check UV direction and part separation at a glance',
          'Exports to Unreal as one FBX per part, after checking every mesh is ready for it',
          'A second tab looks the model up in product data: its SKUs, and which material goes on which component',
          'Exports that as JSON, one file per SKU or a whole release at once, ready for the render tools downstream',
        ],
        idea: "Naming comes from **product data**, not memory: the panel loads the model's component list and builds a tree, and picking a node renames the selected mesh to the standard convention, suffixes included. Every tool after it can trust the names.",
      },
      {
        id: 'unreal',
        name: 'Render automation for Unreal',
        icon: 'unreal-engine.svg',
        highlights: [
          { icon: 'unreal-engine.svg', label: 'Unreal Engine' },
          { icon: 'python.svg', label: 'Python' },
          { label: 'Editor Utility Widgets' },
          { label: 'Movie Render Graph' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Every colorway set up and rendered by hand, pass by pass.',
        problem:
          'Each model ships in many colorways, and every colorway needed its own variant for the beauty, HDR, mirror and shadow passes, set up by hand, then every rendered frame renamed by hand.',
        bullets: [
          'Imports new models from the shared folders, skipping anything already in the project',
          'Builds one Blueprint per model, with lighting channels, LOD settings and an ID material per part',
          'Creates Level Variant Sets for every pass from a data table, one variant per colorway',
          'Copies camera and light keyframes across sequences, then drives Movie Render Graph',
        ],
        idea: 'Everything is **incremental**: the scripts compare what is already in the project with the data table and only add the difference, so a new colorway is one click, not a rebuild. When the render queue finishes, a hook renames every EXR from frame numbers to Model_Colorway.Camera.',
      },
      {
        id: 'catalogue',
        name: 'Catalogue deck generator',
        icon: 'powerpoint.svg',
        highlights: [
          { icon: 'powerpoint.svg', label: 'PowerPoint' },
          { icon: 'python.svg', label: 'Python' },
          { icon: 'qt-designer.svg', label: 'PyQt6' },
          { label: 'REST APIs' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Seasonal catalogues pasted together in PowerPoint from three systems.',
        problem:
          'Seasonal catalogues were assembled by hand in PowerPoint, copying product data from one system, images from another and marketing copy from a third.',
        bullets: [
          'Pick a release and a brand, get a finished deck',
          'Merges product data, PIM attributes and DAM images for every SKU',
          'Places a hero image and up to seven variant groups per slide',
          'Gives variant families their own slides and flags prescription-ready models',
        ],
        idea: 'The layout is a small **engine**, not a fixed template: positions are computed from how many variant groups land on each slide, product images are auto-cropped, and one list of slide jobs decides both how many slides exist and what goes on each.',
      },
      {
        id: 'review',
        name: 'Review deck builder',
        icon: 'powerpoint.svg',
        highlights: [
          { icon: 'powerpoint.svg', label: 'PowerPoint' },
          { icon: 'python.svg', label: 'Python' },
          { icon: 'qt-designer.svg', label: 'PyQt5' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Evaluation decks typed up slide by slide, one style at a time.',
        problem:
          'Evaluation decks meant one slide per style, each with renders, worn shots, codes and technical specs typed in by hand.',
        bullets: [
          'Finds every style for a release, category and brand, and gives each one a slide',
          'Places renders and worn shots in layouts tuned for one to six images',
          'Fills sizes, materials and specs straight from product data',
          'A second tab splits any finished deck into 4K PNGs, named after the model on each slide',
        ],
        idea: 'python-pptx cannot duplicate slides faithfully, so the builder drives **PowerPoint itself** to clone the template, then hands the file back to python-pptx to fill every placeholder.',
      },
    ],
  },
  privacy: {
    kicker: 'Privacy',
    meta: "What this site collects, and what it doesn't",
    description1:
      'This site uses Google Analytics (GA4) to understand traffic - page views, general location, device type - but only after you accept the cookie banner. Decline or ignore it and nothing loads, nothing is tracked.',
    description2:
      "Beyond that: no ads, no other trackers, no data stored on this site's own servers, nothing sold. Questions or a removal request? Email scattolinluca2@gmail.com.",
    backCta: '← Back home',
  },
  notFound: {
    kicker: 'Error',
    meta: "That page doesn't exist",
    description1: 'The link might be broken, or the page moved. Head back home and try again.',
    backCta: '← Back home',
  },
  // shown when a 3D hero object is clicked (src/hero3d.js) — keyed by model filename
  hero3dObjects: {
    turntable: {
      title: 'Vinyl Playing',
      text: 'I spin records and love the ritual of mixing on a real turntable in my studio.',
    },
    pile_of_vinyl: {
      title: 'Vinyl Collection',
      text: 'An ever-growing crate of records I hunt for on weekends.',
    },
    mixing_board_01: {
      title: 'Mixing',
      text: "Mixing audio across vinyl and digital gives me the flexibility and refinement I'm seeking.",
    },
    mixing_board_03: {
      title: 'CDJs',
      text: 'Where vinyl brings warmth and fragility, digital brings versatility. I like working the line between them.',
    },
    synthesizer: {
      title: 'Music Production',
      text: 'When I have time, I like messing around with music production too, with Ableton and all the plugins out there..',
    },
    knob_39: { title: 'Tweaking', text: 'Endless fine-tuning is half the fun.' },
    knob_44: { title: 'Tweaking', text: 'Endless fine-tuning is half the fun.' },
    gaming_computer: {
      title: 'PC & Technology',
      text: "Always been a fan of computers and technology, forever chasing what's new in the field.",
    },
    gaming_gpu: {
      title: 'Hardware',
      text: "Always hunting for the best deal on PC and server components. Sadly they're very expensive right now!",
    },
    integrated_circuit_01: {
      title: 'Electronics',
      text: 'Tinkering with circuits and small hardware projects.',
    },
    integrated_circuit_02: {
      title: 'Chips & Boards',
      text: 'Tinkering with circuits and small hardware projects.',
    },
    transistor_03: {
      title: 'Tinkering',
      text: 'Tinkering with circuits and small hardware projects.',
    },
    '3d_printer': {
      title: '3D Printing',
      text: 'Lets me give concrete shape to my craziest ideas, one layer at a time.',
    },
    classical_computer_mouse_03: {
      title: 'Everyday Tools',
      text: 'The trusty tools I work with every day.',
    },
    cable_ethernet_coiled: { title: 'Connectivity', text: 'A tidy network is a happy network.' },
    sunglasses_04: {
      title: 'Eyewear',
      text: 'Eyewear is where my day job at Thélios meets technology.',
    },
    concert_speaker_02: { title: 'Speakers', text: 'I like listening to music wherever I am.' },
    server_console_station: {
      title: 'Server',
      text: 'My self-hosted homelab. Head to the Projects section for more info!',
    },
    compact_camera: {
      title: 'Photography/Video',
      text: 'I like documenting the trips I take with photos and videos.',
    },
    _default: {
      title: 'One of my things',
      text: 'Placeholder description - this object represents one of my interests.',
    },
  },
  // invitation shown above the skills grid until a tile is clicked (.skills-hint,
  // built in main.js)
  skillsHint: {
    title: 'Pick a skill',
    text: 'Click any tool to see what I actually do with it.',
    // shown beside the shut drawer (src/skillDrawer.js) in the dead space its own canvas
    // mask fades into on the right - the flat wall's line above talks about a tool, this one
    // about the drawer itself, since there's a whole extra gesture to invite first.
    // One line per newline: skillDrawer.js gives each its own <span>, and the two animate
    // differently - the first is nudged to the right, the second carries the colour sweep - so
    // breaking this copy differently changes which line does what
    drawerText: "Pull the last drawer\nSee what's inside.",
  },
  // DJ sets for the player that rides the open drawer (src/setPlayer.js). A set is a title
  // and a file - there is no line of blurb under it, because "melodic techno, Jun 2025" told
  // a visitor nothing they could not hear in five seconds of listening.
  // The audio itself is NOT hosted by this site: `track` is the public (or private-with-
  // token) SoundCloud URL, and the player streams it through a hidden SoundCloud iframe it
  // controls via their Widget API. That split exists for two reasons at once - it costs
  // this site nothing to serve an hour of audio, and it means the site never distributes a
  // copyrighted mp3 from its own domain the way self-hosting one would.
  // `peaks` is a file this repo does hold - tools/peaks.js writes it from Luca's own local
  // copy of the file, before or after it goes up to SoundCloud - and it is what lets the
  // waveform be drawn without fetching a byte of audio.
  // `duration` is committed too: the widget only reports it once ready, and a clock reading
  // --:-- until then is a broken one.
  // `label` is optional: the artwork at the centre of the record (Luca's logo, or a per-set
  // cover). Without it the label carries his initials and no image element is made at all.
  // An empty list mounts no player at all rather than an empty panel.
  // The line above the panel. It arrives a few seconds after the drawer does (sections.css
  // holds that delay), so it reads as an aside offered to someone already browsing rather
  // than a second thing shouting on arrival.
  // One line, and it has to stay one: it sits above a panel about 23rem wide.
  djSetsInvite: 'Fancy one of my sets while you dig?',
  // `duration: 0` below is honest, not lazy: SoundCloud doesn't expose exact track length
  // through any unauthenticated endpoint (oEmbed doesn't carry it, and the full REST API
  // now needs a paid Artist Pro plan just for a client_id). The widget reports the real
  // number itself once its READY event fires, and the clock swaps to it - usually inside a
  // second, since the script and iframe are already loaded by the time anyone presses play.
  // `peaks` files don't exist yet for these four: tools/peaks.js needs Luca's own local copy
  // of each mp3 to generate them, not just the SoundCloud link. Until then a missing peaks
  // fetch falls back to a flat rail (loadPeaks() in setPlayer.js) - fully playable and
  // seekable, just without the real waveform shape.
  djSets: [
    {
      id: 'round-trax-debut',
      title: 'Round Trax Debut',
      track: 'https://soundcloud.com/roundtr4x/round-trax-debut',
      peaks: '/peaks/round-trax-debut.json',
      duration: 0,
    },
    {
      id: 'round-trax-vibala',
      title: 'Round Trax: Vibala',
      track: 'https://soundcloud.com/roundtr4x/round-trax-vibala',
      peaks: '/peaks/round-trax-vibala.json',
      duration: 0,
    },
    {
      id: 'round-trax-throwback-house-selecta',
      title: 'Round Trax: Throwback House Selecta',
      track: 'https://soundcloud.com/roundtr4x/round-trax-throwback-house-selecta',
      peaks: '/peaks/round-trax-throwback-house-selecta.json',
      duration: 0,
    },
    {
      id: 'round-trax-easter-edition',
      title: 'Round Trax: Easter Edition',
      track: 'https://soundcloud.com/roundtr4x/round-trax-easter-edition',
      peaks: '/peaks/round-trax-easter-edition.json',
      duration: 0,
    },
  ],
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
    houdini: {
      title: 'Houdini',
      text: "SideFX's procedural 3D software, node-based from modeling to FX. I'm currently learning Solaris, its USD-native context, to see how it builds, layers and renders USD scenes.",
      color: '#FF4713',
      bullets: [
        'Solaris (LOPs) and USD stages',
        'USD layering and scene assembly',
        'Karma rendering',
        'Procedural, node-based workflows',
      ],
    },
    'adobe-substance-3d': {
      title: 'Adobe Substance 3D',
      text: "Adobe's texturing suite for painting and building procedural materials for real-time and offline rendering.",
      color: '#E03028',
      bullets: [
        {
          label: 'Substance Painter',
          subs: ['UV based texture', 'Triplanar Textures', 'Bake Textures'],
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
    pixyz: {
      title: 'Pixyz',
      text: 'CAD-to-mesh conversion and optimization tool for real-time pipelines and configurators.',
      color: '#fab10d',
      bullets: ['CAD-to-Mesh Conversion', 'Import/Export for Real-Time Pipelines'],
    },
    vray: {
      title: 'V-Ray',
      text: 'Production renderer plugin for Maya, used for photorealistic lighting and shading.',
      color: '#FFFFFF',
      bullets: ['Rendering', 'Lighting'],
    },
    redshift: {
      title: 'Redshift',
      text: 'GPU-accelerated renderer by Maxon, built for fast, production-quality 3D rendering.',
      color: '#F92A57',
      bullets: ['Rendering', 'Lighting', 'GPU-Accelerated Rendering'],
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
      bullets: ['Post Production', 'Motion Design', 'Scripting, UI custom panels and Tools'],
    },
    'premiere-pro': {
      title: 'Premiere Pro',
      text: "Adobe's non-linear video editing software for cutting and finishing footage.",
      color: '#9999FF',
      bullets: ['Video Editing', 'Color Correction', 'Color Grading'],
    },
    'davinci-resolve': {
      title: 'DaVinci Resolve',
      text: 'Editing, color grading and finishing suite built around a professional color pipeline.',
      color: '#F0506B',
      selfTaught: true,
      bullets: ['Editing', 'Post Production', 'Color Correction', 'Color Grading'],
    },
    photoshop: {
      title: 'Photoshop',
      text: "Adobe's raster image editor for photo retouching, compositing and texture work.",
      color: '#31A8FF',
      bullets: ['General Post Production', '3D Multipass Shots'],
    },
    illustrator: {
      title: 'Illustrator',
      text: "Adobe's vector graphics editor for logos, icons and scalable artwork.",
      color: '#FF9A00',
      bullets: ['Assets creation for Motion Design', '2D Assets for presentation'],
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
    usd: {
      title: 'USD',
      text: "Pixar's Universal Scene Description format for scene composition and interchange across 3D pipelines.",
      color: '#00A99D',
      selfTaught: true,
      bullets: [
        'Non-destructive composition: layers, variants, references',
        'Scene assembly and interchange across DCCs',
        'Pipeline format for real-time and configurator tools',
      ],
    },
    materialx: {
      title: 'MaterialX',
      text: 'Open standard for portable material and look-development data across renderers and applications.',
      color: '#EE7623',
      selfTaught: true,
      bullets: [
        'Shading graphs portable between DCCs and renderers',
        'Look-dev data for real-time and offline pipelines',
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
      bullets: ['Hermes Agent', 'Claude Code', 'OpenClaw', 'n8n'],
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
      bullets: ['Mixing and Arrangement', 'Sound Design', 'Plugins and Instruments'],
    },
    traktor: {
      title: 'Traktor',
      text: "Native Instruments' DJ software for live mixing and performance.",
      color: '#FFFFFF',
      selfTaught: true,
      bullets: ['DJing', 'Live Mixing'],
    },
    rekordbox: {
      title: 'rekordbox',
      text: "Pioneer DJ's software for track preparation, library management and performance.",
      color: '#FFFFFF',
      selfTaught: true,
      bullets: ['DJing', 'Track Prep and Library Management'],
    },
  },
};
