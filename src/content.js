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
      'I build 2D-3D pipelines across every major DCC tool, \nalso powering configurators and interactive 3D experiences, \nwith a touch of AI.',
    hint: '✦ click on an object to learn more',
    hintTouch: '✦ tap an object to learn more',
    cta: 'See my work ↓',
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
      'I started in 3D at **EssilorLuxottica**: over four years as a 3D Render Specialist on **Prada Group**, **Burberry** and **Oliver Peoples** eyewear, the last two spent building the 3D pipeline itself.\n' +
      "Today I'm in the 3D R&D team at **Thélios** (**LVMH** eyewear). I build internal tools for several departments and run the 3D pipeline, from 2D design to renders, configurators and videos.\n",
  },
  projects: {
    vivatech: {
      title: 'Vivatech Interactive Experience',
      description:
        'Real-time interactive installation built with TouchDesigner and Unreal Engine, showcased at Vivatech in Paris.',
    },
    pipeline: {
      title: 'Pipeline Projects',
      description:
        'Five in-house tools for Maya, Unreal, Omniverse and PowerPoint, each removing one slow, manual step from the 3D workflow.',
    },
    companyBrain: {
      title: 'Company Brain',
      description:
        'A self-hosted AI assistant that answers product questions from live company data, with photos, drawings and charts. Nothing leaves the company.',
    },
    three: {
      title: 'Homelab',
      description:
        'A two-node Proxmox cluster and a UniFi NAS in a 3D-printed rack, running media, backups and an AI agent.',
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
    kicker: 'Work · Live installation',
    description1:
      "Vivatech 2026 was the tenth edition of Europe's biggest tech event. LVMH brought ten of its Maisons to the Dream Gallery pavilion in Paris, showing how technology amplifies craftsmanship across the whole value chain.",
    description2:
      'For the Thélios space, my colleagues and I developed the real-time interactive experience: a live 3D showcase of eyewear digital twins, built with TouchDesigner and Unreal Engine, letting visitors explore frames, materials and details up close as they interact with the installation.',
    // "How it works": the installation's own chain and the visitor's path through it.
    // Sanitized like pipelineProjects: no brand names, model codes, IPs or internal level names.
    how: {
      title: 'How it works',
      intro:
        "Nothing in the booth is touched. A webcam follows one hand and the visitor's head, TouchDesigner turns that into gestures, and Unreal Engine answers in real time, both running on the same machine.",
      flow: [
        { name: 'Webcam', text: '1080p, one hand and the head' },
        {
          name: 'TouchDesigner',
          text: 'MediaPipe hand and pose tracking, gestures built from live data channels (CHOPs)',
        },
        {
          name: 'OSC',
          text: 'A lightweight message protocol: one message per gesture channel, over localhost',
        },
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
    kicker: 'Work · AI assistant',
    meta: 'A self-hosted AI assistant that answers questions about our products from the company systems',
    description1:
      'Product information is spread across many systems: **technical data**, **commercial texts**, **official photos**, **technical drawings**, **prototype tracking** and manuals. Each has its own login and its own search, so a simple question like "what material is this model?" means opening three or four programs.',
    description2:
      '**Company Brain** is one chat for all of them. Ask in plain language and it reads the answer live from the company systems, with photos, drawings and charts and the source of every piece of data. It runs on our own servers: nothing leaves the company.',
    demoIntro:
      'Sample data throughout. A language model picks the tools, and each tool talks to one company system. Pick a question and follow it through.',
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
          text: 'The model runs on an internal server with its own GPU. No question and no data ever goes to an external service.',
        },
        {
          title: 'Read-only, and gated',
          text: 'It reads the company systems but cannot change them, and each group only sees the tools for its own work.',
        },
        {
          title: 'The code does the math',
          text: 'Language models are good with words, less with numbers: averages, comparisons and charts are computed by the tools, and the model only explains the result.',
        },
        {
          title: 'No copies of the data',
          text: 'Photos, drawings and documents are read from the source at the moment of the question, never copied, so they are always current.',
        },
      ],
      monitorLabel: 'Monitoring',
      monitor:
        'An internal dashboard tracks uptime, server load and which tools get used the most, to decide where to invest next.',
      retroTitle: 'What the pilot taught me',
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
          title: 'Sized for a pilot',
          text: 'One GPU: enough for a small team, slower when many people ask at once. Next: a bigger machine for more capable models, more data sources, other departments.',
        },
        {
          title: 'Assists, does not decide',
          text: 'It finds the data and puts it in front of you, with the source. What to do with it is still up to people.',
        },
        {
          title: 'Only as good as the data',
          text: 'Answers are only as accurate as the data in the systems, and messy data means messy answers.',
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
    kicker: 'Personal · Self-hosting',
    description1:
      'It started with a shared folder my Windows PC and my Mac could both reach, instead of carrying files between them on an external drive. That one NAS folder opened the door to **self-hosted software**, and I never really came back out.',
    description2:
      'Today the rack is a **two-node Proxmox cluster**: an HP EliteDesk 800 G5 with 32GB of RAM and a Lenovo ThinkCentre M910q with 16GB, on 2.5G network cards with a dedicated cluster link. Storage lives on a UniFi UNAS 4 with two mirrored 4TB drives, and a JetKVM gives BIOS access and reboots from anywhere. It all sits in a **3D-printed rack case**, an open design I adapted until it fit.',
    description3:
      'Every service runs in its own **LXC container** (a lightweight Linux box sharing the host kernel): media, photo backup, DNS ad-blocking, passwords, personal finance and Hermes, an AI agent. Around them sits the boring part that keeps it alive: nightly backups, single sign-on with passkeys, Grafana metrics, phone alerts, automatic security patches and remote access over Tailscale, with no port open to the internet.',
    description4:
      'Most of what I know about networking and sysadmin work, I picked up here, one broken config at a time.',
    backCta: '← Back to projects',
    // Powers the service tree in src/homelabDiagram.js. Labels only - no IPs,
    // ports, hostnames or versions (this page is public). Each service name maps
    // to public/icons/services/<slug>.svg by slug (lowercased, spaces to
    // dashes) - add a service here and drop its mark in that folder.
    diagram: {
      hub: 'Proxmox',
      // three columns of cards, top to bottom. Arranged so the columns come out the same height
      // with the same gap between cards: two columns of four cards with 7 services, one of
      // three cards with 8 (a card with one more row weighs about as much as one more card).
      // The last card of the shorter column takes up the last ~20px. Moving a category or
      // adding a service means re-balancing by hand.
      categories: [
        {
          column: 0,
          label: 'Media Library',
          services: ['Jellyfin', 'Navidrome', 'Media Automation'],
        },
        { column: 0, label: 'Photos & Backup', services: ['Immich', 'Proxmox Backup Server'] },
        { column: 0, label: 'Personal Finance', services: ['Actual Budget'] },
        { column: 0, label: 'Dashboard', services: ['Homarr'] },
        { column: 1, label: 'Networking', services: ['Tailscale', 'Caddy', 'Pi-hole'] },
        { column: 1, label: 'Alerts & Updates', services: ['ntfy', 'Diun'] },
        { column: 1, label: 'Infra Tools', services: ['Dockge'] },
        { column: 1, label: 'Agent', services: ['Hermes Agent'] },
        {
          column: 2,
          label: 'Monitoring',
          services: ['Uptime Kuma', 'Grafana', 'Prometheus', 'Beszel', 'Speedtest Tracker'],
        },
        { column: 2, label: 'Security', services: ['Pocket ID', 'Vaultwarden'] },
        { column: 2, label: 'Home Automation', services: ['Home Assistant'] },
      ],
      // which cluster node each service runs on: 1 = HP EliteDesk, 2 = Lenovo ThinkCentre, both
      // when there is an instance on each (from the lab's own inventory, 2026-10-19). Node
      // names only, never hostnames or IDs. Update when a container moves.
      // the legend in the cluster bar
      nodeNames: { 1: 'HP EliteDesk', 2: 'Lenovo ThinkCentre' },
      nodes: {
        Jellyfin: '1',
        Navidrome: '1',
        'Media Automation': '2',
        Tailscale: 'both',
        Caddy: '2',
        'Pi-hole': 'both',
        'Pocket ID': '2',
        Vaultwarden: '2',
        Immich: '1',
        'Proxmox Backup Server': '2',
        'Uptime Kuma': '2',
        Grafana: '2',
        Prometheus: '2',
        Beszel: '1',
        'Speedtest Tracker': '2',
        ntfy: '2',
        Diun: 'both',
        'Home Assistant': '1',
        Homarr: '2',
        'Actual Budget': '2',
        Dockge: '2',
        'Hermes Agent': '1',
      },
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
        'The hypervisor the whole lab runs on. Two machines joined into one cluster and split into containers and VMs, so every service below is isolated from the others and can be backed up or rolled back on its own.',
      Jellyfin:
        'Open-source media server. Streams a personal film and TV library to any device, with no subscription and nothing reporting back to a vendor.',
      Navidrome:
        'Music streaming for a local library. Subsonic-compatible, so any of the existing Subsonic clients works against it without a custom app.',
      'Media Automation':
        'Keeps the library stocked on its own: what is wanted is tracked, sourced and filed without anyone checking by hand.',
      Tailscale:
        'Mesh VPN built on WireGuard. Puts every device on one private network without opening a single port on the router.',
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
      Dockge:
        'Manager for Docker Compose stacks. Edits the compose file and tails the logs from a browser instead of over ssh.',
      Caddy:
        'Reverse proxy with automatic HTTPS. Every service gets its own private address with a real certificate, reachable only inside the tailnet.',
      'Pi-hole':
        'Network-wide DNS with ad and tracker blocking. A primary and a backup instance on different nodes, kept in sync, so the house never loses name resolution.',
      'Pocket ID':
        'Single sign-on with passkeys. One login in front of the hypervisor, backups, dashboards and photos; a small auth proxy covers the apps that cannot speak OIDC on their own.',
      Vaultwarden:
        'Self-hosted password manager, compatible with the Bitwarden apps. The vault lives here, not on a third-party cloud.',
      'Proxmox Backup Server':
        'Deduplicated, incremental backups of every container and VM, every night onto the NAS, with pruning and a weekly integrity check that proves they can actually be restored.',
      'Uptime Kuma':
        'Availability monitor. Checks every service on a short interval and receives a heartbeat from each backup job, so a silent failure still raises an alert.',
      Grafana:
        'Dashboards over the metrics: nodes, cluster, backups, DNS, uptime and connection speed on one screen, with three months of history behind them.',
      Prometheus:
        'Time-series database behind the dashboards. Scrapes the exporters on each node and service and keeps the numbers Grafana draws.',
      'Speedtest Tracker':
        'Runs a connection speed test on a schedule and logs the results, so a slow line shows up as a trend rather than a feeling.',
      ntfy: 'Self-hosted push notifications. Monitors, backups and update checks all report here, and it lands on the phone without a third-party app server.',
      Diun: 'Watches the container images in use and sends a notification when a new version is out. Updates stay a deliberate, manual step.',
      'Hermes Agent':
        'Self-hosted AI agent from Nous Research, reachable over Telegram and Discord instead of a web UI. Builds its own skills from experience and keeps memory across sessions, rather than starting blank every chat.',
    },
  },
  // Internal tools built at Thélios. This page is public and so is the repo:
  // no internal tool names, brands, systems, vendors, paths or real product
  // codes - only what each tool does, in general terms. The mockups in
  // pipeline-projects.html follow the same rule (redrawn, fake data).
  pipelineProjects: {
    kicker: 'Work · Pipeline tools',
    intro1:
      'In the **3D R&D team** at Thélios, a lot of the slow work was not modeling or rendering, it was everything around it: cleaning and naming meshes by hand, building the variants for every colorway, renaming hundreds of renders, assembling presentation decks slide by slide.',
    intro2:
      'None of these tools were planned as a system: each one started from a problem the team kept hitting. They run inside Maya, Unreal Engine and NVIDIA Omniverse, or as standalone Python apps, and the look-dev side is built on open standards: **USD** for the scene and **OpenPBR in MaterialX** for every material.',
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
          'Every model was imported, dressed and rendered by hand, one colorway at a time, with product data cross-checked across separate databases.',
        bullets: [
          'Brings prototypes or single models into the scene from product data, each composed as **USD**',
          'Searches, creates and updates **OpenPBR** materials in **MaterialX**, with thumbnail renders',
          'Batch-renders the selected SKUs with **Omniverse RTX**',
          'Steps through every model and colorway to check each look before it goes out',
        ],
        // qualitative, from what the tool does; swap in a measured number when there is one
        result:
          'A look-dev scene starts from product data: models, materials and renders come in from one panel instead of being set up one at a time.',
        idea: 'Built on two open standards, **USD** and **OpenPBR in MaterialX**, so a material is written once and opens in any compatible tool. Texture links are saved as relative paths, so a material folder can move anywhere in the library.',
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
        problem: 'Every artist prepped meshes their own way, so nothing matched downstream.',
        bullets: [
          'Mesh cleanup in one dockable panel, with automatic left/right naming on mirror',
          'UV presets for lenses and acetate parts, plus a lightmap UV set',
          'Diagnostic materials to check UV direction and part separation at a glance',
          "Exports one checked FBX per part to Unreal, and each SKU's material map from product data as JSON",
        ],
        // qualitative, from what the tool does; swap in a measured number when there is one
        result:
          'Every model leaves Maya cleaned, unwrapped and named the same way, so nothing has to be fixed again before rendering.',
        idea: 'Names come from **product data**, not memory: pick a component in the tree and the selected mesh gets the standard name. Every tool after it can trust them.',
      },
      {
        id: 'unreal',
        name: 'Render automation for Unreal',
        icon: 'unreal-engine.svg',
        highlights: [
          { icon: 'unreal-engine.svg', label: 'Unreal Engine' },
          { icon: 'python.svg', label: 'Python' },
          {
            label: 'Editor Utility Widgets',
            title: 'Custom panels built inside the Unreal editor',
          },
          { label: 'Movie Render Graph' },
        ],
        // one line for the index card, under its Problem label; the full problem is in the chapter
        teaser: 'Every colorway set up and rendered by hand, pass by pass.',
        problem:
          'Every colorway needed its own variant for each render pass, set up by hand, and every frame renamed by hand.',
        bullets: [
          'Imports new models from the shared folders, skipping what is already there',
          'Builds one Blueprint per model, with lighting channels, LODs and an ID material per part',
          'Creates the variants for every pass and colorway from a data table',
          'Copies camera and light keys across sequences, then drives Movie Render Graph',
        ],
        // qualitative, from what the tool does; swap in a measured number when there is one
        result:
          'A new colorway is one click instead of a rebuild, and every render comes out already named.',
        idea: 'Everything is **incremental**: the scripts compare the project with the data table and add only the difference. When the queue finishes, a hook renames every EXR to Model_Colorway.Camera.',
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
          'Seasonal catalogues were pasted together in PowerPoint from three different systems.',
        bullets: [
          'Pick a release and a brand, get a finished deck',
          'Merges product data (PIM), images (DAM) and lifecycle data (PLM) for every SKU',
          'Places a hero image and up to seven variant groups per slide',
          'Gives variant families their own slides and flags prescription-ready models',
        ],
        // qualitative, from what the tool does; swap in a measured number when there is one
        result:
          'A seasonal catalogue is a release and a brand picked from a list, with no copying between systems.',
        idea: 'The layout is a small **engine**, not a fixed template: positions follow how many variant groups land on each slide, and product images are auto-cropped.',
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
        problem: 'Evaluation decks were typed up by hand, one slide per style.',
        bullets: [
          'Finds every style for a release, category and brand, one slide each',
          'Places renders and worn shots in layouts for one to six images, with specs from product data',
          'A voting system on every slide, built with PowerPoint macros, and a final report of the votes, exportable to Excel',
          'Splits any finished deck into 4K PNGs named after each model',
        ],
        // qualitative, from what the tool does; swap in a measured number when there is one
        result:
          'An evaluation deck builds itself from product data, one slide per style, with nothing typed by hand.',
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
      title: 'Turntables',
      text: 'Mixing on vinyl is slow and unforgiving, and that is exactly why I like it.',
    },
    pile_of_vinyl: {
      title: 'Record Crate',
      text: 'An ever-growing crate of records, mostly house, funk and disco, dug out on weekends.',
    },
    mixing_board_01: {
      title: 'DJ Mixer',
      text: 'Where every set comes together. Four of my sets are streaming in the player further down the page. Go find it!',
    },
    mixing_board_03: {
      title: 'CDJs',
      text: 'Vinyl brings warmth and fragility, digital brings range. I like working the line between them.',
    },
    synthesizer: {
      title: 'Music Production',
      text: 'When I find the time, I produce my own tracks in Ableton, digging through synths and plugins for the right sound.',
    },
    knob_39: { title: 'Fine-tuning', text: 'Endless fine-tuning is half the fun.' },
    knob_44: { title: 'Knobs', text: "One more quarter turn, then it's done. Probably." },
    gaming_computer: {
      title: 'Workstation',
      text: "I build my own PCs, and I'm forever chasing what's new in the field.",
    },
    gaming_gpu: {
      title: 'GPU',
      text: 'Renders, games and local AI models all want more of it. Always hunting for the next good deal.',
    },
    integrated_circuit_01: {
      title: 'Electronics',
      text: 'Small hardware projects, mostly for the fun of seeing them work.',
    },
    integrated_circuit_02: {
      title: 'Chips & Boards',
      text: "Microcontrollers and sensors wired into things that didn't need them.",
    },
    transistor_03: {
      title: 'Tinkering',
      text: 'Taking things apart to see how they work. Putting them back together is optional.',
    },
    '3d_printer': {
      title: '3D Printing',
      text: 'From idea to object overnight. The homelab rack case came off this printer.',
    },
    classical_computer_mouse_03: {
      title: 'Mouse',
      text: 'Thousands of clicks a day, between modeling, code and node graphs.',
      link: { href: 'pipeline-projects.html', label: 'See the tools I built' },
    },
    cable_ethernet_coiled: {
      title: 'Networking',
      text: 'VLANs, DNS and a lot of cable management. Also part of the homelab.',
    },
    sunglasses_04: {
      title: 'Eyewear',
      text: 'My day job: at Thélios I build the 3D pipeline and tools behind LVMH eyewear.',
      link: { href: 'vivatech.html', label: 'See the Vivatech project' },
    },
    concert_speaker_02: {
      title: 'Speakers',
      text: 'There is always something playing, at home, at work, on the road.',
    },
    server_console_station: {
      title: 'Homelab',
      text: 'The server rack at home, running everything I self-host.',
      // rendered as a real <a> after the text (src/hero3d.js)
      link: { href: 'homelab.html', label: 'Read the full story' },
    },
    compact_camera: {
      title: 'Photo & Video',
      text: 'I document my trips in photos and short videos.',
    },
    _default: {
      title: 'One of my things',
      text: 'Another piece of the things I spend my time on.',
    },
  },
  // invitation shown above the skills grid until a tile is clicked (.skills-hint,
  // built in main.js)
  skillsHint: {
    title: 'Pick a skill',
    text: 'Click any tool to see what I actually do with it.',
    textTouch: 'Tap any tool to see what I actually do with it.',
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
  // `peaks` files come from tools/peaks.js run on Luca's own local copy of each mp3. A missing
  // peaks fetch falls back to a flat rail (loadPeaks() in setPlayer.js) - fully playable and
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
