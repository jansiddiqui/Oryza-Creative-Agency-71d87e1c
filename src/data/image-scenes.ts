/**
 * Scene briefs for every illustrative image slot: the slot-specific parts of the image prompts
 * (src/lib/image-prompts.ts adds the shared format, colour grade and do-not rules).
 *
 * Trust rules baked in: no text anywhere, nobody looks at the camera, children and patients are never
 * identifiable, nothing is presented as Oryza's team, office, clients or results, and the home/services/
 * platforms/how-it-works scenes contain no people at all.
 *
 * Each slot has a main scene and an alternative scene with the same subject in a different setting, so the
 * slot's alt text stays true whichever one is used.
 */

export interface SceneVariant {
  /** Exact place, time of day, season, architecture, materials, furniture, plants. */
  scene: string;
  /** Ages, clothing, action, expression, gaze, identifiability — or why there are no people. */
  people: string;
  /** Where the subject sits in the frame (first sentence of COMPOSITION). */
  placement: string;
  /** What fills the calm third reserved for text. */
  calm: string;
  /** Camera height and angle. */
  angle: string;
  /** Direction, quality and colour temperature of the light. */
  light: string;
  /** 4–6 small, imperfect, local details. */
  realism: string;
}

export interface SceneBrief {
  /** Which page, and what the image must feel like. */
  purpose: string;
  /** Side kept calm for text. */
  textSide: "left" | "right";
  /** Lens, aperture, shutter, ISO and depth of field. */
  camera: string;
  /** Slot-specific additions to the shared do-not list. */
  negatives: string;
  main: SceneVariant;
  alt: SceneVariant;
}

const NO_PEOPLE = "No people and no hands anywhere in the frame — this is a still life, so nothing suggests a specific team or office.";

export const sceneBriefs: Record<string, SceneBrief> = {
  "home-hero": {
    purpose: "Wide band under the home page headline of a social media agency. It must feel organised, warm and quietly confident — a well-planned month, not a busy office.",
    textSide: "right",
    camera: "50 mm lens, f/4, 1/200 s, ISO 400. Objects sharp, background softly blurred.",
    negatives: "any person or hand; laptops or computer screens; branded stationery; anything that looks like a real company's office",
    main: {
      scene: "A late-winter morning in a home study in Kanpur, Uttar Pradesh. On a warm sheesham-wood table: a paper monthly planner open on blank grid squares, four printed photographs fanned out (landscapes and textures, no faces), a phone on a small tabletop tripod with its screen switched off, a brass paper clip and a glass of milky chai on a steel saucer. A whitewashed wall and a small potted money plant behind.",
      people: NO_PEOPLE,
      placement: "Place the still life left of centre, the planner as the anchor.",
      calm: "plain whitewashed wall",
      angle: "Camera at table height plus 40 cm, looking down at about 30°.",
      light: "Soft daylight through a muslin-curtained window on the left, about 5000 K, gentle shadows to the right.",
      realism: "A faint chai ring on the wood, slightly curled photo corners, a pencil with a worn eraser, fine wood grain and small scratches.",
    },
    alt: {
      scene: "Early afternoon on a low wooden desk beside a window in an old Kanpur house with lime-plastered walls. A spiral paper planner open on an empty weekly grid, a few printed photographs held by a binder clip, a phone on a mini tripod with its screen off, a cotton napkin and chai in a clay kulhad.",
      people: NO_PEOPLE,
      placement: "Place the desk items in the left half, the planner closest to the camera.",
      calm: "soft lime-plaster wall and window light",
      angle: "Camera slightly above desk height, angled down about 20°.",
      light: "Indirect daylight from a north-facing window, about 5500 K, very soft shadows.",
      realism: "A hairline crack in the plaster, a slightly frayed napkin edge, a dog-eared planner page, dust motes in the light.",
    },
  },

  "services-header": {
    purpose: "Header image for the Services page of a social media agency. It shows careful, small-scale content work and must feel practical, calm and crafted.",
    textSide: "left",
    camera: "35 mm lens, f/3.5, 1/250 s, ISO 400. Product sharp, room softly blurred.",
    negatives: "any person or hand; brand names on products or equipment; glowing screens; a large professional studio full of lights",
    main: {
      scene: "Mid-morning in a sunlit spare room in a Kanpur apartment, used for a simple product shoot. A phone on a handheld gimbal stands on a small tripod, screen off. A compact LED panel on a stand is switched off. A foldable round reflector leans against a stool. The product is a plain unbranded ceramic jar on a cream cotton cloth on a wooden crate.",
      people: NO_PEOPLE,
      placement: "Place the setup centre-right, the jar on the cloth as the focus.",
      calm: "pale painted wall and window light",
      angle: "Eye level with the crate, about 90 cm high, straight on.",
      light: "Warm sunlight through a large window on the right, about 5200 K, softened by a sheer curtain, crisp but gentle shadows.",
      realism: "Taped cable along the floor, a scuff on the crate, a slightly creased cloth, a spare battery and lens cloth beside the jar.",
    },
    alt: {
      scene: "Late afternoon in a small handloom workshop in Kanpur after work hours. A folded unbranded cotton stole on a wooden stool, a phone on a small tripod with its screen off, a foldable reflector leaning on a whitewashed wall, a terracotta pot with a snake plant.",
      people: NO_PEOPLE,
      placement: "Place the stool and stole in the centre-right.",
      calm: "whitewashed wall",
      angle: "Camera at stool height, about 60 cm, slightly from the side.",
      light: "Low, warm sun from a side doorway, about 4300 K, long soft shadows on the floor.",
      realism: "Thread ends on the floor, a chipped stool edge, a slightly dusty reflector rim, uneven floor tiles.",
    },
  },

  "platforms-header": {
    purpose: "Header image for a page explaining social media platforms. It must feel personal and everyday, not technical.",
    textSide: "left",
    camera: "50 mm lens, f/2, 1/320 s, ISO 400. Hands and phone sharp, background creamy and blurred.",
    negatives: "any visible screen content, app icons or notification glow; brand marks on the phone; faces",
    main: {
      scene: "A weekday afternoon at a small, modern café in Kanpur. A wooden table by a window, a glass of chai on a steel coaster, a folded paper napkin. Out-of-focus cane chairs and a potted areca palm behind.",
      people: "Only two hands and forearms: a woman in her 30s in a muted olive cotton kurta, holding a plain dark phone with the screen switched off and black. Natural Indian skin tone, natural nails, five fingers on each hand. No face in the frame.",
      placement: "Place the hands and phone in the centre-right.",
      calm: "blurred window light and café wall",
      angle: "Close, slightly above the table at chest height, angled down about 25°.",
      light: "Soft window light from the left, about 5000 K, gentle shadow under the hands.",
      realism: "A little condensation on the chai glass, a few sugar grains on the table, a thin silver ring, slight wear on the phone case edge.",
    },
    alt: {
      scene: "Early evening on a home balcony in Kanpur with potted tulsi and money plants. A plain dark phone with its screen off rests in two hands on top of a closed cloth-bound notebook, on the wide arm of a cane chair.",
      people: "Only two hands and wrists of a man in his 40s in a muted beige shirt cuff; natural Indian skin tone, natural hands with five fingers. No face in the frame.",
      placement: "Place the hands, phone and notebook in the centre-right.",
      calm: "soft green leaves and balcony wall",
      angle: "Close, from slightly above the chair arm, angled down about 30°.",
      light: "Warm last light of the day from the right, about 4000 K, soft shadows; the sun itself is not in the frame.",
      realism: "Woven cane texture, a small leaf on the notebook, a worn cuff edge, a terracotta pot rim in the corner.",
    },
  },

  "how-it-works-header": {
    purpose: "Header image for a page explaining a step-by-step planning process. It must feel orderly, thoughtful and hand-made.",
    textSide: "left",
    camera: "35 mm lens, f/5.6, 1/125 s, ISO 400. Everything on the table sharp.",
    negatives: "any handwriting, printed words or numbers; readable grid labels or dates; computer screens",
    main: {
      scene: "Overhead view of a planning table in a quiet Kanpur workroom on a winter afternoon. A green cutting mat on a wooden table; a printed weekly schedule with an empty grid; a sharpened pencil; six blank index cards pinned to the mat and connected by fine red-brown cotton thread; a steel ruler and a small brass binder clip.",
      people: NO_PEOPLE,
      placement: "Place the schedule and connected cards in the centre-right.",
      calm: "plain wooden table surface",
      angle: "Straight overhead, camera parallel to the table.",
      light: "Soft daylight from a window above-left, about 5000 K, very gentle shadows under the paper edges.",
      realism: "Faint pencil dust, slightly curled card corners, fine cuts on the mat, a pin hole or two, a paper clip slightly off-angle.",
    },
    alt: {
      scene: "Overhead view of a low teak table in a home study in Kanpur. Blank paper calendar pages laid in a row, sticky notes in muted cream and olive with nothing written on them, a wooden ruler, two pencils and a small ball of jute twine.",
      people: NO_PEOPLE,
      placement: "Place the calendar pages and notes in the centre-right.",
      calm: "warm teak surface",
      angle: "Straight overhead.",
      light: "Indirect morning daylight, about 5500 K, soft and even with faint shadows.",
      realism: "Teak grain, a slightly lifted sticky-note corner, pencil shavings, a frayed twine end.",
    },
  },

  "industry-schools-header": {
    purpose: "Header image for a page about social media management for schools. It sits next to a headline, so it must feel calm, warm and uncluttered.",
    textSide: "left",
    camera: "35 mm lens, f/2.8, 1/500 s, ISO 200. Subject sharp, background gently blurred.",
    negatives: "school names or emblems; Western-style school buildings; uniforms with blazers and ties; snow",
    main: {
      scene: "A weekday winter morning around 7:45 am in the courtyard of a well-kept private school in Kanpur, Uttar Pradesh. A female teacher in her early 40s, in a muted green cotton saree with a light cardigan, walks beside a loose line of students aged 9–12 heading to class. Generic uniform: white shirts, dark green trousers or skirts. Two-storey cream-painted brick building with arched verandahs, dark green iron railings and potted plants; a large neem tree shading a swept concrete courtyard.",
      people: "Candid, mid-movement, nobody posing or looking at the camera. Children seen from the side or behind, or small and soft, so no child's face is identifiable. Natural Indian skin tones and texture, natural hands with five fingers.",
      placement: "Place the teacher and students in the centre-right.",
      calm: "soft wall, verandah and greenery",
      angle: "Level horizon, eye-level camera height (about 1.4 m).",
      light: "Soft, low winter-morning sun from the left, about 4500 K, long gentle shadows, dappled light through leaves.",
      realism: "Slightly worn paint, school bag straps, steel water bottles, dry neem leaves on the ground, a chalk-dusted window ledge.",
    },
    alt: {
      scene: "A winter morning inside a bright classroom of a private school in Kanpur. Rows of wooden desks, students aged 10–12 in a generic uniform (white shirts, dark green trousers or skirts) seen from the back, a female teacher in her 30s in a muted ochre salwar suit standing by a tall open window. Pale cream walls, a ceiling fan, a green chalkboard showing only faint erased smudges.",
      people: "Candid, nobody posing or looking at the camera. Children only from behind or softly out of focus; no child's face identifiable. The teacher in profile, mid-sentence. Natural Indian skin tones, natural hands.",
      placement: "Place the teacher and the nearest desks in the centre-right.",
      calm: "pale cream wall and window light",
      angle: "Eye level from the back of the room (about 1.3 m), level horizon.",
      light: "Morning sun through the tall window on the right, about 4800 K, soft light falling across the desks.",
      realism: "Worn desk edges, a pencil box, a steel water bottle on a desk, chalk dust on the ledge, a slightly faded curtain.",
    },
  },

  "industry-hospitals-clinics-header": {
    purpose: "Header image for a page about social media for hospitals and clinics. It must feel clean, reassuring and humane — never clinical or alarming.",
    textSide: "left",
    camera: "35 mm lens, f/2.8, 1/250 s, ISO 400. Doctor sharp, depth softly falling away.",
    negatives: "hospital names or signage; patients in beds; blood, needles, injections or procedures; distress; medical equipment close-ups",
    main: {
      scene: "Late morning in the bright, clean OPD corridor of a modern multi-speciality hospital in Kanpur, Uttar Pradesh, early spring. Light grey vitrified-tile floor, pale cream walls, a wooden handrail, tall windows on one side and a few potted areca palms. A nurses' desk with a plain computer turned away from camera further down the corridor.",
      people: "A male doctor in his 40s in a white coat over a muted blue shirt walks away from the camera, seen from behind. A nurse in a pale green uniform sits at the desk, small and softly out of focus. No patients identifiable; nobody looks at the camera. Natural Indian skin tones.",
      placement: "Place the doctor walking in the centre-right, the corridor leading the eye inward.",
      calm: "pale wall and window light",
      angle: "Eye level (about 1.5 m), level horizon, looking straight down the corridor.",
      light: "Soft daylight from tall windows on the right, about 5500 K, clean but gentle shadows on the floor.",
      realism: "Faint scuffs on the floor near the wall, a folded wheelchair parked neatly in the distance, a hand-sanitiser stand, a slightly uneven window blind.",
    },
    alt: {
      scene: "Early morning in the quiet waiting area of a mid-size clinic in Kanpur before patients arrive. Rows of empty light-wood chairs, a reception desk with a plain counter, pale cream walls, a large window with a potted ficus, a water dispenser in the corner.",
      people: "A receptionist in her 30s in a muted teal uniform arranges files at the desk, seen in soft profile and slightly out of focus. No patients present; nobody looks at the camera.",
      placement: "Place the reception desk and receptionist in the centre-right.",
      calm: "empty chairs and pale wall",
      angle: "Eye level from the waiting area (about 1.4 m), level horizon.",
      light: "Soft morning daylight through the window on the left, about 5200 K, gentle even light.",
      realism: "A stack of unlabelled files, a slightly crooked chair, a small brass bell on the counter, a cleaning-trolley wheel just visible.",
    },
  },

  "industry-doctors-header": {
    purpose: "Header image for a page about personal branding for doctors. It must feel trustworthy, unhurried and kind.",
    textSide: "left",
    camera: "50 mm lens, f/2.2, 1/250 s, ISO 400. Doctor sharp, foreground shoulder softly blurred.",
    negatives: "certificates or degrees with text; prescriptions with writing; needles or procedures; a patient's face",
    main: {
      scene: "A late-morning consultation in a warm, tidy private clinic room in Kanpur, winter. A wooden desk, two cushioned chairs, a cream wall with an empty wooden shelf holding a small plant and a few closed, unlabelled box files, a tall window with a cotton blind.",
      people: "Over-the-shoulder view: a female doctor in her 50s in a muted maroon salwar suit with a white coat and a stethoscope, calmly explaining something with an open hand to a family member whose back and shoulder face the camera. The doctor looks at the family member, never at the camera. Natural Indian skin tones, natural hands with five fingers.",
      placement: "Place the doctor in the centre-right, the family member's shoulder soft in the lower-right foreground.",
      calm: "cream wall and shelf",
      angle: "Seated eye level (about 1.2 m), over the family member's shoulder.",
      light: "Soft window light from the left, about 4800 K, gentle shadows on the face.",
      realism: "A steel tumbler of water on the desk, a slightly creased coat sleeve, reading glasses folded on a closed notebook, a worn chair armrest.",
    },
    alt: {
      scene: "Late afternoon in the sunlit corridor of a small private clinic in Kanpur. Cream walls, a wooden bench, a window with a neem tree outside.",
      people: "A male doctor in his 50s in a white coat with a stethoscope walks slowly beside a middle-aged family member, both seen from behind and slightly to the side, the doctor gesturing gently as he speaks. Nobody faces the camera. Natural Indian skin tones.",
      placement: "Place the two figures in the centre-right, walking away along the corridor.",
      calm: "cream wall and window",
      angle: "Eye level (about 1.5 m), from behind at a slight angle.",
      light: "Warm late sun through the window on the left, about 4200 K, soft long shadows on the floor.",
      realism: "A slightly faded floor mat, a hand-sanitiser bottle on a ledge, a shadow of neem leaves on the wall, a bench with worn varnish.",
    },
  },

  "industry-real-estate-header": {
    purpose: "Header image for a page about social media for real estate. It must feel hopeful, settled and real — a home, not an advertisement.",
    textSide: "left",
    camera: "35 mm lens, f/5.6, 1/250 s, ISO 200. Building and family sharp, sky clean.",
    negatives: "hoardings, banners, builder names or logos; construction safety boards with text; luxury villas or swimming pools",
    main: {
      scene: "Golden hour, about 40 minutes before sunset in early spring, in a growing residential neighbourhood of Kanpur. A newly completed six-storey residential building with cream and light-grey plaster, simple balconies with dark railings, a few balcony plants, a young neem and a paved entrance path with fresh plants. The sun is low and out of frame.",
      people: "A family of three — parents in their 30s and a child of about 6 — seen from behind on the path, looking up at the building, the father's hand on the child's shoulder. Muted everyday clothing, no logos. Nobody faces the camera.",
      placement: "Place the family in the centre-right, the building rising behind them.",
      calm: "soft sky and young trees",
      angle: "Low eye level (about 1.2 m), slight upward angle toward the building.",
      light: "Warm low sunlight from the right, about 3800 K, soft long shadows; the sun itself is not in frame.",
      realism: "A few dry leaves on the path, a newly planted sapling with a bamboo stake, a water tank on the roof, slightly uneven paving.",
    },
    alt: {
      scene: "A clear winter morning in a quiet new residential lane in Kanpur. A short row of newly completed three-storey townhouses with cream walls, wooden doors and small front gardens with potted plants and a low boundary wall.",
      people: "A couple in their 40s seen from behind, walking up the path toward one of the front doors, carrying a cloth bag. Muted clothing, no logos. Nobody faces the camera.",
      placement: "Place the couple and the nearest doorway in the centre-right.",
      calm: "soft sky and boundary wall",
      angle: "Eye level (about 1.5 m), level horizon, from the lane.",
      light: "Clean morning sun from the left, about 5000 K, crisp but soft shadows.",
      realism: "A milk-packet crate by a gate, a slightly dusty car bonnet at the frame edge, a garden hose coiled on the grass, a newly painted gate.",
    },
  },

  "industry-political-leaders-header": {
    purpose: "Header image for a page about social media for local leaders. It must feel like listening and service — respectful, local and calm, not campaigning.",
    textSide: "left",
    camera: "35 mm lens, f/2.8, 1/320 s, ISO 200. Group sharp, background soft.",
    negatives:
      "party flags, party colours, symbols, banners, slogans, posters, stages, microphones, rallies or crowds; saffron, tricolour or blue scarves or bunting; any resemblance to a real politician; religious symbols",
    main: {
      scene: "A winter morning in a residential neighbourhood of Kanpur. A small, informal meeting under a large old peepal tree beside a quiet lane; whitewashed walls and a weathered wooden gate behind; a few plastic chairs on swept earth.",
      people: "A local representative in his 50s in a plain white kurta-pajama, seen from the side and slightly behind, leans forward listening to three elderly residents seated on plastic chairs — a woman in a muted shawl, two men in sweaters. Nobody looks at the camera; faces natural and unposed. Natural Indian skin tones, natural hands.",
      placement: "Place the small group in the centre-right under the tree.",
      calm: "whitewashed wall and tree trunk",
      angle: "Eye level (about 1.4 m), level horizon.",
      light: "Soft morning sun filtered through peepal leaves from the left, about 4600 K, dappled light.",
      realism: "A steel tumbler on a chair arm, a walking stick resting against a chair, dry leaves on the ground, a bicycle leaning against the wall.",
    },
    alt: {
      scene: "Early morning in a narrow residential lane in Kanpur with old brick houses, small wooden doors and potted tulsi on a doorstep.",
      people: "A local representative in his 50s in a plain white kurta-pajama walks slowly beside two elderly residents, all seen from behind; he bends his head slightly to listen. Nobody looks at the camera. Natural Indian skin tones.",
      placement: "Place the three figures in the centre-right, walking away down the lane.",
      calm: "old brick wall",
      angle: "Eye level (about 1.5 m), from behind.",
      light: "Soft early sun along the lane from the right, about 4500 K, gentle shadows.",
      realism: "A milk can by a door, a worn doorstep, a cycle bell glint, a clothesline with plain cloths above.",
    },
  },

  "industry-restaurants-cafes-header": {
    purpose: "Header image for a page about social media for restaurants and cafés. It must feel inviting, warm and appetising, without looking staged.",
    textSide: "left",
    camera: "50 mm lens, f/2, 1/160 s, ISO 800. Food and hands sharp, room in warm blur.",
    negatives: "menu boards, printed menus or receipts with text; branded cups or packaging; identifiable customers' faces",
    main: {
      scene: "Early evening in a warm, modern café in Kanpur, winter. A wooden table with masala chai in small glasses, two crisp kachoris with tamarind chutney on a steel plate and a bowl of aloo-tikki chaat; exposed-brick wall, warm filament bulbs, plants on shelves.",
      people: "A server's hands and forearms (sleeves of a muted olive apron uniform) placing the chaat bowl on the table. Customers in the background only as soft shapes, faces unidentifiable. Nobody looks at the camera. Natural Indian skin tones.",
      placement: "Place the food and the server's hands in the centre-right.",
      calm: "blurred brick wall and warm bulbs",
      angle: "Seated eye level (about 1.1 m), slightly above the table.",
      light: "Warm filament bulbs overhead and to the right, about 2900 K, plus soft fill from a window; gentle, cosy shadows.",
      realism: "Steam from the chai, a few chutney drops on the plate, a folded paper napkin, a slightly chipped glass rim, crumbs.",
    },
    alt: {
      scene: "Late afternoon at a corner window table in a small café in Kanpur. Masala chai in glasses, a samosa on a steel plate, a cane chair, a wooden window frame with plants outside.",
      people: "A server's hand pouring chai from a steel kettle into a glass. No faces in the frame; nobody looks at the camera. Natural Indian skin tone, five fingers.",
      placement: "Place the kettle, glass and plate in the centre-right.",
      calm: "soft window light and plants",
      angle: "Seated eye level, slightly above the table.",
      light: "Warm afternoon sun through the window on the left, about 4300 K, soft shadows.",
      realism: "Chai mid-pour, a tea stain on a coaster, a samosa flake on the table, a cane chair with a frayed strand.",
    },
  },

  "industry-coaching-institutes-header": {
    purpose: "Header image for a page about social media for coaching institutes. It must feel focused, hopeful and serious about learning.",
    textSide: "left",
    camera: "35 mm lens, f/2.8, 1/250 s, ISO 800. Teacher and nearest students sharp.",
    negatives: "readable writing on the board, books or notebooks; exam papers; posters or banners; institute names",
    main: {
      scene: "An evening class in a coaching institute in Kanpur, late autumn. A long room with rows of simple wooden benches, cream walls, a large green board that shows only erased chalk smudges, ceiling fans and a row of windows.",
      people: "Students aged 17–20 in everyday muted clothing seen from behind and the side, writing in notebooks. A male teacher in his 30s in a plain light shirt stands at the board, in profile, mid-explanation. Nobody looks at the camera. Natural Indian skin tones, natural hands.",
      placement: "Place the teacher and the front rows in the centre-right.",
      calm: "cream wall and windows",
      angle: "Eye level from the back of the room (about 1.3 m).",
      light: "Cool white tube light mixed with fading blue-hour window light, balanced to about 4800 K, soft and even.",
      realism: "Chalk dust on the ledge, backpacks hanging from benches, a steel water bottle, pens with chewed caps, a slightly flickering-looking tube light.",
    },
    alt: {
      scene: "A quiet self-study room in a coaching institute in Kanpur, evening. Long wooden tables, desk lamps, cream walls and a window with a dark blue evening sky.",
      people: "Students aged 17–20 study silently, seen from behind and from the side, heads down over notebooks; faces not clearly identifiable. Muted everyday clothing. Nobody looks at the camera.",
      placement: "Place the nearest table and students in the centre-right.",
      calm: "cream wall",
      angle: "Eye level at the end of the table (about 1.2 m).",
      light: "Warm desk lamps, about 3500 K, with soft cool window light; gentle pools of light on the tables.",
      realism: "Stacks of unlabelled books, a highlighter cap, a phone face down, a sweater on a chair back.",
    },
  },

  "industry-retail-showrooms-header": {
    purpose: "Header image for a page about social media for retail shops and showrooms. It must feel welcoming, local and personal.",
    textSide: "left",
    camera: "35 mm lens, f/2.8, 1/250 s, ISO 400. Shopkeeper's hands and fabric sharp.",
    negatives: "shop signs, price tags or brand labels; mall interiors; mannequins",
    main: {
      scene: "Late morning inside a traditional saree and textile shop in a Kanpur market, winter. White cotton mattress-covered seating (gaddi), wooden shelves stacked with folded sarees in muted colours, warm wood panelling.",
      people: "A shopkeeper in his 50s in a cream kurta unfolds a muted green saree with a gold border across the gaddi for a woman customer in her 40s, who is seen from behind in a muted shawl. Nobody looks at the camera. Natural Indian skin tones, natural hands.",
      placement: "Place the unfolding fabric and the shopkeeper in the centre-right.",
      calm: "stacked shelves softly blurred",
      angle: "Seated eye level (about 1.1 m).",
      light: "Warm overhead lights mixed with daylight from the shop entrance on the left, about 4200 K, soft.",
      realism: "A small calculator turned face down, folded tissue paper, a steel glass of tea on the gaddi, slight creases in the cotton sheet.",
    },
    alt: {
      scene: "Early morning in the same kind of Kanpur textile shop before customers arrive: shelves of folded fabrics, a wooden counter, a broom resting by the door.",
      people: "The shopkeeper in his 50s, seen from the side and slightly behind, refolds a stack of muted cotton fabrics on the counter. Nobody looks at the camera.",
      placement: "Place the shopkeeper and counter in the centre-right.",
      calm: "fabric shelves softly blurred",
      angle: "Standing eye level (about 1.5 m).",
      light: "Soft early daylight from the open shutter on the left, about 5000 K.",
      realism: "A half-raised shutter edge, a cloth duster, thread ends on the counter, a slightly faded wall calendar with no readable text.",
    },
  },

  "industry-gyms-salons-header": {
    purpose: "Header image for a page about social media for gyms, salons and spas. It must feel calm, cared-for and premium without luxury excess.",
    textSide: "left",
    camera: "50 mm lens, f/2.2, 1/200 s, ISO 400. Hands and hair sharp, mirror softly blurred.",
    negatives: "faces visible in mirrors; product bottles with labels; revealing clothing; before-and-after imagery",
    main: {
      scene: "Mid-morning in a calm, small salon in Kanpur. A cream wall, a large mirror with a simple wooden frame, a potted plant, a styling chair in olive fabric, a tidy trolley with plain unlabelled bottles and combs.",
      people: "A stylist's hands — a woman in her 30s in a muted black apron — sectioning and combing a client's long dark hair. The client is seen from behind; her face is not visible, not even in the mirror. Natural Indian skin tones, natural hands with five fingers.",
      placement: "Place the hands and hair in the centre-right.",
      calm: "cream wall and soft mirror reflections",
      angle: "Standing eye level (about 1.4 m), slightly behind the chair.",
      light: "Soft daylight from a side window on the left, about 5000 K, with warm mirror lights; gentle shadows.",
      realism: "A few hair clips on the trolley, a towel with slight creases, hair strands on the cape, a water spray bottle without a label.",
    },
    alt: {
      scene: "A quiet spa room in Kanpur, late afternoon: a massage bed with a cream sheet, folded towels, a small brass bowl of water with a floating flower, a wooden side table, a jute rug.",
      people: "A therapist's hands — a woman in a muted sage tunic — arranging folded towels on the bed. No faces in the frame. Natural Indian skin tones.",
      placement: "Place the hands and towels in the centre-right.",
      calm: "cream wall",
      angle: "Eye level with the bed (about 1 m).",
      light: "Warm, soft light from a shaded lamp and a curtained window, about 3600 K.",
      realism: "A slightly creased sheet, a few petals, condensation on the bowl, a woven basket edge.",
    },
  },

  "industry-b2b-manufacturers-header": {
    purpose: "Header image for a page about social media for manufacturers and B2B companies. It must feel skilled, solid and proud of craft.",
    textSide: "left",
    camera: "50 mm lens, f/2.8, 1/250 s, ISO 400. Hands, leather and tools sharp.",
    negatives: "brand logos stamped in leather; readable labels or charts; children; unsafe or dirty conditions",
    main: {
      scene: "Late morning in a leather workshop in Kanpur's industrial area. A sturdy wooden workbench with hand tools — awl, edge beveller, waxed thread, a mallet — and pieces of natural tan leather; a high window and stacked hides in the background.",
      people: "An adult artisan in his 40s, sleeves rolled, hand-stitching a leather bag panel; mostly hands and forearms visible, face out of frame or turned down and soft. Natural Indian skin tones, natural working hands with five fingers.",
      placement: "Place the hands and stitching in the centre-right.",
      calm: "dim workshop wall and stacked hides",
      angle: "Close, at bench height (about 1 m), slightly from the side.",
      light: "Warm side light from a high window on the left, about 4400 K, gentle shadows that show leather texture.",
      realism: "Leather offcuts, small scratches on the bench, a stub of chalk for marking, waxed-thread spools, a worn tool handle.",
    },
    alt: {
      scene: "Mid-morning on the finishing floor of a small Kanpur leather-goods unit. Finished plain tan belts and bags laid out on a long table for checking; tall windows and racks behind.",
      people: "An adult quality inspector in her 30s in a muted grey work coat, seen from the side, running her fingers along a belt's stitching; face soft or turned away. Nobody looks at the camera.",
      placement: "Place the inspector's hands and the table in the centre-right.",
      calm: "racks and window light softly blurred",
      angle: "Eye level (about 1.4 m), slightly from the side.",
      light: "Soft daylight from tall windows on the right, about 5000 K.",
      realism: "A tape measure, plain kraft-paper tags with no writing, a small stack of buckles, a slightly scuffed table edge.",
    },
  },

  "industry-professionals-header": {
    purpose: "Header image for a page about social media for professionals such as chartered accountants, lawyers and consultants. It must feel trustworthy, clear and composed.",
    textSide: "left",
    camera: "50 mm lens, f/2.5, 1/200 s, ISO 400. Consultant sharp, client and shelves soft.",
    negatives: "readable documents, file labels or screens; certificates; scales or gavels; money or cheques",
    main: {
      scene: "Late morning in a small, tidy professional office in Kanpur, winter. A wooden desk with neat papers, a closed laptop, a brass pen stand; behind, wooden shelves with box files whose spines carry no readable labels; a window with a cotton blind.",
      people: "A consultant in her 40s in a muted navy kurta with a light shawl reviews papers with a client across the desk, both seen from the side. The client, a man in his 50s in a beige sweater, is partly out of frame. Nobody looks at the camera.",
      placement: "Place the consultant in the centre-right, the desk leading in from the left.",
      calm: "shelves softly blurred",
      angle: "Seated eye level (about 1.2 m), from the side.",
      light: "Soft daylight from the window on the right, about 5000 K, gentle shadows.",
      realism: "Reading glasses on the papers, a cup of tea with a saucer, a stapler, slightly dog-eared file corners.",
    },
    alt: {
      scene: "Afternoon in a compact meeting room in a Kanpur office: a round wooden table, a glass partition, a potted plant, a whiteboard that is completely clean.",
      people: "A consultant in his 40s in a light shirt explains something with his hands to two clients seen from behind and the side; his laptop screen faces away from the camera. Nobody looks at the camera.",
      placement: "Place the consultant in the centre-right.",
      calm: "clean wall and plant",
      angle: "Seated eye level, from behind the clients' shoulders.",
      light: "Soft daylight through the glass partition on the left, about 5200 K.",
      realism: "Notebooks with closed covers, a water jug with glasses, a slightly crooked chair, a jacket on a chair back.",
    },
  },

  "industry-creators-header": {
    purpose: "Header image for a page about social media for creators and personal brands. It must feel genuine and self-made, not glossy.",
    textSide: "left",
    camera: "35 mm lens, f/2.2, 1/250 s, ISO 400. Creator sharp, room gently blurred.",
    negatives: "a visible phone screen or social media interface; ring-light glare; influencer clichés; branded products",
    main: {
      scene: "Late morning in a sunlit room of a Kanpur apartment: white walls, potted monstera and money plants, a low wooden stool, a woven cotton rug, a small bookshelf with plain spines.",
      people: "A young creator, a woman in her mid-20s in a muted rust cotton shirt, films herself talking with a phone on a tripod; the phone's screen faces away from the camera. She is seen in three-quarter profile from behind, focused on the phone, not looking at our camera. Natural Indian skin tone, natural hands mid-gesture.",
      placement: "Place the creator and tripod in the centre-right.",
      calm: "white wall and plants",
      angle: "Eye level (about 1.3 m), slightly behind and to the side.",
      light: "Soft daylight from a large window on the right, about 5200 K, gentle shadows.",
      realism: "A tangled charging cable, a mug on the stool, a slightly creased rug, a notebook lying open with blank pages.",
    },
    alt: {
      scene: "Early morning on a rooftop in an old Kanpur neighbourhood, with water tanks, potted plants and the hazy city beyond.",
      people: "A young creator, a man in his mid-20s in a muted olive jacket, seen from behind, filming the skyline on a phone on a small tripod; the screen faces away from our camera.",
      placement: "Place the creator and tripod in the centre-right.",
      calm: "hazy sky",
      angle: "Eye level (about 1.5 m), from behind.",
      light: "Soft early sun from the left through light haze, about 4600 K; the sun itself is not in frame.",
      realism: "A water tank with weathered paint, a plastic chair, pigeons on a parapet, a clothesline.",
    },
  },

  "industry-interiors-fashion-jewellery-header": {
    purpose: "Header image for a page about social media for interiors, fashion and jewellery brands. It must feel refined, crafted and warm.",
    textSide: "left",
    camera: "85 mm lens, f/4, 1/160 s, ISO 400. Jewellery sharp, background softly blurred.",
    negatives: "price tags, brand boxes or hallmarks with text; faces; sparkle or star effects; excessive glitter",
    main: {
      scene: "Late afternoon in a jeweller's display room in Kanpur: a handcrafted gold necklace and a pair of jhumka earrings resting on folded cream silk on a dark wooden display tray; a velvet stand and soft wooden panelling behind.",
      people: "Only one hand — a woman jeweller in her 40s, a muted maroon sleeve — gently adjusting the necklace. Natural Indian skin tone, natural nails, five fingers. No face in the frame.",
      placement: "Place the jewellery and hand in the centre-right.",
      calm: "dark wood panelling softly blurred",
      angle: "Close, slightly above the tray (about 40 cm), angled down 30°.",
      light: "Warm, soft directional light from the left, about 3800 K, matching soft gold highlights, gentle shadows.",
      realism: "Fine creases in the silk, tiny scratches on the tray, a jeweller's loupe lying nearby, slight natural variation in the hand-made gold.",
    },
    alt: {
      scene: "Mid-morning in an interiors and fashion showroom in Kanpur: a handloom dupatta with a fine zari border draped over a carved sheesham chair, beside a cream cushion and a brass lamp.",
      people: "Only one hand smoothing the dupatta's border; natural Indian skin tone, five fingers. No face in the frame.",
      placement: "Place the chair and draped dupatta in the centre-right.",
      calm: "plain cream wall",
      angle: "Eye level with the chair seat (about 70 cm), slightly from the side.",
      light: "Soft daylight from a window on the left, about 4800 K, with a warm glow on the zari.",
      realism: "A loose thread on the fabric edge, carved-wood dust in the grooves, a slight dent in the cushion, a worn brass patina.",
    },
  },

  "contact-studio": {
    purpose: "Small image beside the contact details on the Contact page. It must feel welcoming, calm and easy — a quiet invitation to talk, never an office, studio or team.",
    textSide: "right",
    camera: "50 mm lens, f/3.2, 1/200 s, ISO 400. Objects sharp, window softly blurred.",
    negatives: "any person or hand; office desks, monitors or branded items; anything that looks like a real company's office, studio or team; a lit phone screen",
    main: {
      scene: "A quiet late afternoon in early spring beside a window in an old house in Kanpur, Uttar Pradesh. On a small wooden table: a plain dark phone lying face up with its screen switched off, a closed cloth-bound notebook with a pencil resting on it, and a glass of masala chai on a steel coaster. A cotton curtain hangs at the window; a potted tulsi plant stands on the sill.",
      people: "No people and no hands anywhere in the frame — a quiet still life that invites a conversation without suggesting anyone's office or team.",
      placement: "Place the phone, notebook and chai together in the centre-left.",
      calm: "soft curtain and window light",
      angle: "Camera at table height plus 30 cm, angled down about 25°.",
      light: "Warm low sun through the window from the right, about 4300 K, long soft shadows across the table.",
      realism: "Steam rising from the chai, a small tea stain on the coaster, a slightly frayed curtain hem, fine dust on the sill, a worn notebook corner.",
    },
    alt: {
      scene: "Early morning on a quiet street corner in an old Kanpur neighbourhood, late winter. A small tea stall's wooden bench, a few clay kulhads on a ledge, a bicycle parked against a whitewashed wall, an old neem tree, and nearby shop shutters still half closed.",
      people: "Nobody in the foreground; at most one distant passer-by seen from behind, small and softly out of focus. Nobody faces the camera.",
      placement: "Place the bench, kulhads and bicycle in the centre-left.",
      calm: "whitewashed wall",
      angle: "Eye level (about 1.4 m), level horizon.",
      light: "Soft early sun from the right, about 4600 K, gentle long shadows across the street.",
      realism: "Chipped kulhad rims, a coiled water pipe, dry neem leaves on the ground, worn bench edges, a faded wall with no lettering.",
    },
  },
};
