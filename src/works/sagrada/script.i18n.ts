// THE CLIENT IS NOT IN A HURRY — the foreign-language prints.
//
// The shooting script (script.ts) stays in English and owns the timing. Here
// every subtitle is keyed by the beat it plays on (`Line.at`), so the prints
// can't drift out of sync; the test beside this file checks that each line
// has exactly one translation in each print.
//
// The poster and the title cards are the picture's own artwork and stay as
// they were shot; in these prints each card gets a yellow subtitle instead.

import { CHAPTERS, type Line } from "./script";
import type { Lang } from "./lang";

export type Print = Exclude<Lang, "en">;

export const SUBS: Record<Print, Record<number, string>> = {
  ca: {
    // — pròleg —
    1.4: "Aquest és el cel de Barcelona, cap a l'any 1881.",
    2.45: "No ha canviat gaire des d'aleshores. Gairebé tot el que hi ha a sota, sí.",
    3.5: "Aquestes són dues gavines. No són importants per a la història, però hi eren, i semblava de mala educació deixar-les fora.",
    5.2: "A sota hi ha el Poblet, un llogaret de Sant Martí de Provençals, just fora dels límits de la ciutat.",
    6.25: "Hortes, vinyes, unes quantes masies i una bòbila que fumeja tranquil·lament tota sola.",
    7.3: "El senyor Cerdà ja havia dibuixat els carrers de la ciutat nova damunt d'aquests camps. Els carrers, simplement, encara no havien arribat.",

    // — I. El llibreter —
    9.5: "Josep Maria Bocabella era llibreter, editor de revistes devotes i un home amb una idea més aviat grossa.",
    10.55: "Havia fundat una associació de devots de sant Josep i es va proposar construir-los un temple pagat amb donatius i res més.",
    11.6: "El 1881 l'associació va comprar aquest camp: una illa sencera de la ciutat futura, per 172.000 pessetes.",
    12.65: "En aquell moment quedava considerablement lluny de qualsevol cosa.",

    // — II. La primera pedra —
    14.7: "El 19 de març de 1882. Sant Josep. Es col·loca la primera pedra, amb la cerimònia que pertoca.",
    15.75: "L'arquitecte, Francisco de Paula del Villar, va proposar una cosa assenyada, simètrica i neogòtica.",
    16.8: "Després, ell i la junta no es van posar d'acord sobre el cost de la pedra. En menys d'un any, havia dimitit.",
    17.85: "Es va trobar un substitut. Tenia trenta-un anys, i tenia opinions.",

    // — III. El jove de Reus —
    20.0: "Antoni Gaudí va acabar la cripta més o menys com estava previst. Tot el que va venir després s'ho va prendre com una cosa personal.",
    21.05: "Dissenyava amb cordills i saquets de pes, penjats cap per avall, i deixava que la gravetat fes els comptes.",
    22.1: "Girades del dret, les corbes s'aguantaven soles.",
    23.15: "Quan li preguntaven quan estaria acabat, diuen que responia:",
    24.2: "El meu client no té pressa.",
    25.25: "El client, tothom ho entenia, era Déu.",
    26.3: "Mentrestant, la ciutat per fi va arribar. El 1897, Sant Martí —Poblet inclòs— va passar a ser Barcelona.",
    27.35: "Va créixer la façana del Naixement, esculpida tan densament que la podien llegir com un llibre els qui no sabien llegir.",
    28.4: "El 1925 es va acabar el campanar de Sant Bernabé. Va ser l'únic que Gaudí arribaria a veure.",

    // — IV. El tramvia —
    30.7: "El 7 de juny de 1926, un home gran va ser atropellat per un tramvia a la Gran Via.",
    31.75: "No duia documents i anava vestit amb senzillesa. El van prendre per un captaire.",
    32.8: "Era l'arquitecte. Va morir tres dies després, als setanta-tres anys, i el van enterrar a la cripta.",
    33.85: "L'edifici va continuar sense ell. Al capdavall, li havien dit que no hi havia pressa.",

    // — V. Trossos —
    36.0: "El juliol de 1936, els primers dies de la Guerra Civil, van calar foc a la cripta i van saquejar el taller.",
    37.05: "Plànols i fotografies van cremar. Les maquetes de guix van quedar fetes miques.",
    38.1: "Després, hi va haver qui va passar dècades tornant a encaixar els trossos, que també és una forma de devoció.",
    39.15: "El 1954 van començar les obres de la façana de la Passió: descarnada, angulosa i incòmoda a propòsit, com volia Gaudí.",
    40.3: "Les seves quatre torres es van acabar el 1976. A aquelles altures, el ritme ja no sorprenia ningú.",

    // — VI. Les màquines —
    42.5: "Després van arribar els ordinadors, que per fi podien fer els comptes que Gaudí havia fet amb cordills.",
    43.55: "Un programari pensat per a avions va resultar que se'n sortia molt bé amb les catedrals.",
    44.6: "El 2010 es va acabar la nau, i el papa Benet XVI la va consagrar com a basílica.",
    45.65: "El 2020 una pandèmia va aturar les grues. Era la primera pausa des de la guerra.",
    46.7: "El 2021 es va encendre una estrella a la torre de la Mare de Déu. El 2023, els quatre evangelistes la van atrapar.",
    47.75: "El 20 de febrer de 2026, la torre de Jesucrist va arribar a la seva alçada definitiva: 172,5 metres.",
    48.8: "L'església més alta del món i, tot i així, expressament més baixa que la muntanya de Montjuïc. L'obra de l'home, pensava Gaudí, no havia de superar la de Déu.",

    // — VII. El deu de juny —
    51.0: "El 10 de juny de 2026. Cent anys justos de la mort de Gaudí.",
    52.05: "El papa Lleó XIV va venir a beneir la torre acabada. Unes 120.000 persones van venir a veure-ho.",
    53.1: "Va dir que la seva creu era un far obert a la Mediterrània.",
    54.15: "I aleshores, com és costum a Barcelona cada vegada que s'acaba qualsevol cosa…",
    58.2: "En rigor, no està acabada. Encara falta la façana de la Glòria.",
    59.3: "El client continua sense pressa.",
  },

  es: {
    // — prólogo —
    1.4: "Este es el cielo de Barcelona, hacia 1881.",
    2.45: "No ha cambiado mucho desde entonces. Casi todo lo que hay debajo, sí.",
    3.5: "Estas son dos gaviotas. No son importantes para la historia, pero estaban allí, y parecía de mala educación dejarlas fuera.",
    5.2: "Debajo está el Poblet, una aldea de Sant Martí de Provençals, justo fuera de los límites de la ciudad.",
    6.25: "Huertas, viñedos, unas cuantas masías y una tejería que humea tranquilamente para sí.",
    7.3: "El señor Cerdà ya había dibujado las calles de la ciudad nueva sobre estos campos. Las calles, sencillamente, aún no habían llegado.",

    // — I. El librero —
    9.5: "Josep Maria Bocabella era librero, editor de revistas devotas y un hombre con una idea más bien grande.",
    10.55: "Había fundado una asociación de devotos de san José y se propuso construirles un templo pagado con donativos y nada más.",
    11.6: "En 1881 la asociación compró este campo: una manzana entera de la futura ciudad, por 172.000 pesetas.",
    12.65: "En aquel momento quedaba considerablemente lejos de cualquier cosa.",

    // — II. La primera piedra —
    14.7: "El 19 de marzo de 1882. San José. Se coloca la primera piedra, con la ceremonia que corresponde.",
    15.75: "El arquitecto, Francisco de Paula del Villar, propuso algo sensato, simétrico y neogótico.",
    16.8: "Luego, él y la junta discreparon sobre el coste de la piedra. En menos de un año, había dimitido.",
    17.85: "Se encontró un sustituto. Tenía treinta y un años, y tenía opiniones.",

    // — III. El joven de Reus —
    20.0: "Antoni Gaudí terminó la cripta más o menos como estaba previsto. Todo lo demás se lo tomó como algo personal.",
    21.05: "Diseñaba con cordeles y saquitos de peso, colgados boca abajo, y dejaba que la gravedad hiciera las cuentas.",
    22.1: "Puestas del derecho, las curvas se sostenían solas.",
    23.15: "Cuando le preguntaban cuándo estaría terminado, dicen que respondía:",
    24.2: "Mi cliente no tiene prisa.",
    25.25: "El cliente, se daba por entendido, era Dios.",
    26.3: "Mientras tanto, la ciudad por fin llegó. En 1897, Sant Martí —Poblet incluido— pasó a ser Barcelona.",
    27.35: "Se alzó la fachada del Nacimiento, esculpida con tal densidad que podían leerla como un libro quienes no sabían leer.",
    28.4: "En 1925 se terminó el campanario de San Bernabé. Fue el único que Gaudí llegaría a ver.",

    // — IV. El tranvía —
    30.7: "El 7 de junio de 1926, un anciano fue atropellado por un tranvía en la Gran Via.",
    31.75: "No llevaba documentación e iba vestido con sencillez. Lo tomaron por un mendigo.",
    32.8: "Era el arquitecto. Murió tres días después, a los setenta y tres años, y fue enterrado en la cripta.",
    33.85: "El edificio siguió sin él. Al fin y al cabo, le habían dicho que no había prisa.",

    // — V. Pedazos —
    36.0: "En julio de 1936, en los primeros días de la Guerra Civil, se prendió fuego a la cripta y se saqueó el taller.",
    37.05: "Ardieron planos y fotografías. Las maquetas de yeso quedaron hechas añicos.",
    38.1: "Después, hubo quien pasó décadas volviendo a encajar los pedazos, que también es una forma de devoción.",
    39.15: "En 1954 empezaron las obras de la fachada de la Pasión: descarnada, angulosa y deliberadamente incómoda, como quería Gaudí.",
    40.3: "Sus cuatro torres se terminaron en 1976. A esas alturas, el ritmo ya no sorprendía a nadie.",

    // — VI. Las máquinas —
    42.5: "Luego llegaron los ordenadores, que por fin podían hacer las cuentas que Gaudí había hecho con cordeles.",
    43.55: "Un software pensado para aviones resultó que se le daban muy bien las catedrales.",
    44.6: "En 2010 se terminó la nave, y el papa Benedicto XVI la consagró como basílica.",
    45.65: "En 2020 una pandemia paró las grúas. Era la primera pausa desde la guerra.",
    46.7: "En 2021 se encendió una estrella en la torre de la Virgen María. En 2023, los cuatro evangelistas la alcanzaron.",
    47.75: "El 20 de febrero de 2026, la torre de Jesucristo alcanzó su altura definitiva: 172,5 metros.",
    48.8: "La iglesia más alta del mundo y, aun así, a propósito más baja que la montaña de Montjuïc. La obra del hombre, pensaba Gaudí, no debía superar la de Dios.",

    // — VII. El diez de junio —
    51.0: "El 10 de junio de 2026. Cien años exactos desde la muerte de Gaudí.",
    52.05: "El papa León XIV vino a bendecir la torre terminada. Unas 120.000 personas vinieron a verlo.",
    53.1: "Dijo que su cruz era un faro abierto al Mediterráneo.",
    54.15: "Y entonces, como es costumbre en Barcelona cada vez que se termina cualquier cosa…",
    58.2: "En rigor, no está terminada. Aún falta la fachada de la Gloria.",
    59.3: "El cliente sigue sin prisa.",
  },
};

/** A subtitle in the chosen print. */
export function lineText(l: Line, lang: Lang) {
  return lang === "en" ? l.text : (SUBS[lang][l.at] ?? l.text);
}

// ---------------------------------------------------------------------------
// Chapter titles, for the slate, the reel, the transcript and the card subs.
// ---------------------------------------------------------------------------

export interface ChapterText {
  word: string;
  title: string;
  years: string;
}

export const CHAPTER_TEXT: Record<Lang, ChapterText[]> = {
  en: CHAPTERS.map(({ word, title, years }) => ({ word, title, years })),
  ca: [
    { word: "Capítol primer", title: "El llibreter", years: "1866 — 1881" },
    { word: "Capítol segon", title: "La primera pedra", years: "1882 — 1883" },
    { word: "Capítol tercer", title: "El jove de Reus", years: "1883 — 1926" },
    { word: "Capítol quart", title: "El tramvia", years: "Juny de 1926" },
    { word: "Capítol cinquè", title: "Trossos", years: "1936 — 1976" },
    { word: "Capítol sisè", title: "Les màquines", years: "1976 — 2026" },
    { word: "Capítol setè", title: "El deu de juny", years: "2026" },
  ],
  es: [
    { word: "Capítulo primero", title: "El librero", years: "1866 — 1881" },
    { word: "Capítulo segundo", title: "La primera piedra", years: "1882 — 1883" },
    { word: "Capítulo tercero", title: "El joven de Reus", years: "1883 — 1926" },
    { word: "Capítulo cuarto", title: "El tranvía", years: "Junio de 1926" },
    { word: "Capítulo quinto", title: "Pedazos", years: "1936 — 1976" },
    { word: "Capítulo sexto", title: "Las máquinas", years: "1976 — 2026" },
    { word: "Capítulo séptimo", title: "El diez de junio", years: "2026" },
  ],
};

// ---------------------------------------------------------------------------
// The director's notes, in red marker.
// ---------------------------------------------------------------------------

export type NoteText = Record<
  | "gulls"
  | "cerda"
  | "cerdaSmall"
  | "plot"
  | "flip"
  | "barnabas"
  | "glue"
  | "pause"
  | "tower"
  | "montjuic"
  | "lighthouse",
  string
>;

export const NOTE_TEXT: Record<Lang, NoteText> = {
  en: {
    gulls: "not important.",
    cerda: "the future city",
    cerdaSmall: "(on paper)",
    plot: "172,000 ptas.",
    flip: "upside down!",
    barnabas: "St Barnabas ✓",
    glue: "+ glue + patience",
    pause: "PAUSED",
    tower: "172.5 m",
    montjuic: "still higher",
    lighthouse: "a lighthouse",
  },
  ca: {
    gulls: "irrellevants.",
    cerda: "la ciutat futura",
    cerdaSmall: "(sobre el paper)",
    plot: "172.000 ptes.",
    flip: "cap per avall!",
    barnabas: "Sant Bernabé ✓",
    glue: "+ cola + paciència",
    pause: "PAUSA",
    tower: "172,5 m",
    montjuic: "encara més alta",
    lighthouse: "un far",
  },
  es: {
    gulls: "irrelevantes.",
    cerda: "la ciudad futura",
    cerdaSmall: "(sobre el papel)",
    plot: "172.000 ptas.",
    flip: "¡boca abajo!",
    barnabas: "San Bernabé ✓",
    glue: "+ cola + paciencia",
    pause: "PAUSA",
    tower: "172,5 m",
    montjuic: "aún más alta",
    lighthouse: "un faro",
  },
};

// ---------------------------------------------------------------------------
// Everything else with words on it: the letterbox, the sound, the end.
// ---------------------------------------------------------------------------

export interface UiText {
  programme: string;
  prologue: string;
  fin: string;
  chapter: (numeral: string) => string;
  reel: string;
  subtitles: string;
  original: string;
  sound: { on: string; off: string; titleOn: string; titleOff: string; invite: string; yes: string; no: string; about: string };
  end: {
    forNow: string;
    by: string;
    stagehand: string;
    photography: string;
    photographyNote: string;
    gulls: string;
    themselves: string;
    note: string;
    again: string;
    programme: string;
    theatre: string;
  };
  transcript: { title: string; blurb: string };
}

export const UI: Record<Lang, UiText> = {
  en: {
    programme: "Programme",
    prologue: "Prologue",
    fin: "Fin",
    chapter: (n) => `Chapter ${n}`,
    reel: "Chapters",
    subtitles: "Subtitles",
    original: "Català",
    sound: {
      on: "Sound",
      off: "Sound off",
      titleOn: "Mute the picture",
      titleOff: "Play the picture's sound",
      invite: "this picture is a talkie. well, a whistlie.",
      yes: "sound on ♪",
      no: "silent, please",
      about: "About the sound",
    },
    end: {
      forNow: "(for now)",
      by: "A picture by",
      stagehand: "Assistant stagehand",
      photography: "Photography",
      photographyNote: "None. Every frame is painted in your browser.",
      gulls: "The gulls",
      themselves: "Themselves",
      note: "Dates after the Basílica de la Sagrada Família and the press of June 2026. Heights and distances have been politely rearranged for the camera; the city has been simplified, with apologies to it.",
      again: "Watch again",
      programme: "The programme",
      theatre: "Across the road, the theatre",
    },
    transcript: {
      title: "The Client Is Not in a Hurry — a short history of a very long building",
      blurb: "A scroll-driven picture about the Sagrada Família, in seven chapters.",
    },
  },
  ca: {
    programme: "Programa",
    prologue: "Pròleg",
    fin: "Fi",
    chapter: (n) => `Capítol ${n}`,
    reel: "Capítols",
    subtitles: "Subtítols",
    original: "Original",
    sound: {
      on: "So",
      off: "Sense so",
      titleOn: "Silenciar la pel·lícula",
      titleOff: "Activar el so de la pel·lícula",
      invite: "aquesta pel·lícula és sonora. bé, xiulada.",
      yes: "amb so ♪",
      no: "muda, si us plau",
      about: "Sobre el so",
    },
    end: {
      forNow: "(de moment)",
      by: "Una pel·lícula de",
      stagehand: "Ajudant de tramoia",
      photography: "Fotografia",
      photographyNote: "Cap. Cada fotograma es pinta al teu navegador.",
      gulls: "Les gavines",
      themselves: "Elles mateixes",
      note: "Dates segons la Basílica de la Sagrada Família i la premsa de juny de 2026. Alçades i distàncies s'han reordenat educadament per a la càmera; la ciutat s'ha simplificat, amb les nostres disculpes.",
      again: "Tornar-la a veure",
      programme: "El programa",
      theatre: "A l'altra banda del carrer, el teatre",
    },
    transcript: {
      title: "El client no té pressa — una breu història d'un edifici molt llarg",
      blurb: "Una pel·lícula sobre la Sagrada Família que avança amb el scroll, en set capítols.",
    },
  },
  es: {
    programme: "Programa",
    prologue: "Prólogo",
    fin: "Fin",
    chapter: (n) => `Capítulo ${n}`,
    reel: "Capítulos",
    subtitles: "Subtítulos",
    original: "Catalán",
    sound: {
      on: "Sonido",
      off: "Sin sonido",
      titleOn: "Silenciar la película",
      titleOff: "Activar el sonido de la película",
      invite: "esta película es sonora. bueno, silbada.",
      yes: "con sonido ♪",
      no: "muda, por favor",
      about: "Sobre el sonido",
    },
    end: {
      forNow: "(por ahora)",
      by: "Una película de",
      stagehand: "Ayudante de tramoya",
      photography: "Fotografía",
      photographyNote: "Ninguna. Cada fotograma se pinta en tu navegador.",
      gulls: "Las gaviotas",
      themselves: "Ellas mismas",
      note: "Fechas según la Basílica de la Sagrada Família y la prensa de junio de 2026. Alturas y distancias se han reordenado educadamente para la cámara; la ciudad se ha simplificado, con nuestras disculpas.",
      again: "Volver a verla",
      programme: "El programa",
      theatre: "Al otro lado de la calle, el teatro",
    },
    transcript: {
      title: "El cliente no tiene prisa — una breve historia de un edificio muy largo",
      blurb: "Una película sobre la Sagrada Família que avanza con el scroll, en siete capítulos.",
    },
  },
};
