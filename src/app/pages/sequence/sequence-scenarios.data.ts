/**
 * Escenarios para «Dale el orden»: cada uno tiene 4 pasos en el orden correcto.
 * Los ids de paso deben ser únicos dentro del escenario.
 */

export type SequencePalette = 'leaf' | 'fire' | 'ocean' | 'sun';

export type SequenceStepDef = {
  id: string;
  title: string;
  hint: string;
  palette: SequencePalette;
};

export type SequenceScenarioDef = {
  id: string;
  title: string;
  subtitle: string;
  steps: SequenceStepDef[];
  correctOrder: string[];
  historyTitle: string;
  historyBody: string;
  rewardBlurb: string;
  bonusPoints: number;
};

function assertScenario(s: SequenceScenarioDef): SequenceScenarioDef {
  if (s.steps.length !== 4 || s.correctOrder.length !== 4) {
    throw new Error(`Sequence scenario "${s.id}" must have exactly 4 steps.`);
  }
  const ids = new Set(s.steps.map((x) => x.id));
  if (ids.size !== 4) {
    throw new Error(`Sequence scenario "${s.id}" has duplicate step ids.`);
  }
  for (const id of s.correctOrder) {
    if (!ids.has(id)) {
      throw new Error(`Sequence scenario "${s.id}" correctOrder references unknown id "${id}".`);
    }
  }
  return s;
}

/** Baraja una copia del banco (Fisher–Yates). */
export function shuffleSequenceSteps(steps: SequenceStepDef[]): SequenceStepDef[] {
  const out = [...steps];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const SEQUENCE_SCENARIOS: SequenceScenarioDef[] = [
  assertScenario({
    id: 'cafe-dominicano',
    title: 'Secuencia del café dominicano',
    subtitle:
      'Organiza los pasos para preparar el mejor café del Caribe, desde la mata hasta la taza.',
    steps: [
      { id: 'cafe-grano', title: 'Grano', hint: 'En la mata', palette: 'leaf' },
      { id: 'cafe-tostado', title: 'Tostado', hint: 'Fuego y aroma', palette: 'fire' },
      { id: 'cafe-molido', title: 'Molido', hint: 'Líneas marrones', palette: 'sun' },
      { id: 'cafe-taza', title: 'Taza', hint: 'Listo para beber', palette: 'ocean' },
    ],
    correctOrder: ['cafe-grano', 'cafe-tostado', 'cafe-molido', 'cafe-taza'],
    historyTitle: 'Un toque de historia',
    historyBody:
      'El café llegó a la isla en 1735 y el tostado artesanal sigue siendo parte del sabor criollo.',
    rewardBlurb: 'Completa este reto sin errores para ganar el logro «Barista del Cibao».',
    bonusPoints: 150,
  }),
  assertScenario({
    id: 'sancocho',
    title: 'Pasos para un sancocho criollo',
    subtitle: 'Del sofrito al plato humeante: ordena cómo se arma este clásico dominicano.',
    steps: [
      {
        id: 'sanco-sofrito',
        title: 'Sofrito y sazón',
        hint: 'Aroma base con culantro y ajíes',
        palette: 'leaf',
      },
      {
        id: 'sanco-caldo',
        title: 'Agua, carnes y caldo',
        hint: 'Que hierva y suelte sabor',
        palette: 'fire',
      },
      {
        id: 'sanco-viandas',
        title: 'Viandas y verduras',
        hint: 'Ñame, yautía, plátano…',
        palette: 'sun',
      },
      {
        id: 'sanco-cocinar',
        title: 'Cocinar hasta integrar',
        hint: 'Todo tierno y bien unido',
        palette: 'ocean',
      },
    ],
    correctOrder: ['sanco-sofrito', 'sanco-caldo', 'sanco-viandas', 'sanco-cocinar'],
    historyTitle: 'Sancocho de historia',
    historyBody:
      'Cada familia tiene su receta, pero el orden del caldo y las viandas marca la diferencia entre «bueno» y «de abuela».',
    rewardBlurb: '¡Sazonaste la secuencia! Logro «Cucharón de oro».',
    bonusPoints: 150,
  }),
  assertScenario({
    id: 'presidentes-recientes',
    title: 'Presidentes en orden cronológico',
    subtitle: 'Del más antiguo al más reciente en este tramo reciente de la historia dominicana.',
    steps: [
      {
        id: 'pres-mejia',
        title: 'Hipólito Mejía',
        hint: 'Gobierno 2000–2004',
        palette: 'ocean',
      },
      {
        id: 'pres-leonel',
        title: 'Leonel Fernández',
        hint: 'Gobierno 2004–2012',
        palette: 'leaf',
      },
      {
        id: 'pres-danilo',
        title: 'Danilo Medina',
        hint: 'Gobierno 2012–2020',
        palette: 'sun',
      },
      {
        id: 'pres-abinader',
        title: 'Luis Abinader',
        hint: 'Gobierno desde 2020',
        palette: 'fire',
      },
    ],
    correctOrder: ['pres-mejia', 'pres-leonel', 'pres-danilo', 'pres-abinader'],
    historyTitle: 'Democracia y turnos',
    historyBody:
      'La alternancia y las elecciones marcan el ritmo político reciente; conocer el orden ayuda a entender el debate público.',
    rewardBlurb: '¡Cronología impecable! Logro «Palacio en orden».',
    bonusPoints: 160,
  }),
  assertScenario({
    id: 'carnaval-vega',
    title: 'Etapas del Carnaval de La Vega',
    subtitle: 'Del taller callejero al desfile: cómo se vive la fiesta más grande del país.',
    steps: [
      {
        id: 'vega-mascaras',
        title: 'Máscaras y vestuario',
        hint: 'Diablos cojuelos y fantasía',
        palette: 'fire',
      },
      {
        id: 'vega-ensayos',
        title: 'Ensayos de comparsas',
        hint: 'Ritmo en los barrios',
        palette: 'sun',
      },
      {
        id: 'vega-desfiles',
        title: 'Desfiles en las calles',
        hint: 'Domingo a domingo',
        palette: 'leaf',
      },
      {
        id: 'vega-premios',
        title: 'Premiación y gran cierre',
        hint: 'Reconocimiento y desenlace',
        palette: 'ocean',
      },
    ],
    correctOrder: ['vega-mascaras', 'vega-ensayos', 'vega-desfiles', 'vega-premios'],
    historyTitle: 'Patrimonio vivo',
    historyBody:
      'El Carnaval de La Vega mezcla religión, sátira y música; su calendario gira en torno al domingo de febrero.',
    rewardBlurb: '¡Comparsa aprobada! Logro «Diablo cojuelo».',
    bonusPoints: 155,
  }),
  assertScenario({
    id: 'mangu',
    title: 'Mangú con cebolla',
    subtitle: 'Del plátano hervido al plato dominicano por excelencia.',
    steps: [
      {
        id: 'mangu-hervir',
        title: 'Hervir plátanos',
        hint: 'Verdes, hasta ablandar',
        palette: 'leaf',
      },
      {
        id: 'mangu-machacar',
        title: 'Machacar o pisar',
        hint: 'Textura cremosa',
        palette: 'sun',
      },
      {
        id: 'mangu-mantequilla',
        title: 'Mantequilla y sal',
        hint: 'Sabor y punto',
        palette: 'fire',
      },
      {
        id: 'mangu-cebolla',
        title: 'Cebolla en salmuera',
        hint: 'El toque que lo corona',
        palette: 'ocean',
      },
    ],
    correctOrder: ['mangu-hervir', 'mangu-machacar', 'mangu-mantequilla', 'mangu-cebolla'],
    historyTitle: 'Desayuno de campeones',
    historyBody:
      'Tres golpes o solo mangú: en RD el plátano es religión y la cebolla vinagre es el «amen».',
    rewardBlurb: '¡Pilón en orden! Logro «Desayuno nacional».',
    bonusPoints: 150,
  }),
  assertScenario({
    id: 'merengue-patrimonio',
    title: 'El merengue, paso a paso',
    subtitle: 'De raíz campesina a patrimonio reconocido en el mundo.',
    steps: [
      {
        id: 'mer-origen',
        title: 'Raíces en el campo',
        hint: 'Güira, tambora y acordeón',
        palette: 'leaf',
      },
      {
        id: 'mer-urbano',
        title: 'Orquestas y ciudad',
        hint: 'Salón y baile social',
        palette: 'ocean',
      },
      {
        id: 'mer-simbolo',
        title: 'Símbolo nacional',
        hint: 'Identidad dominicana',
        palette: 'sun',
      },
      {
        id: 'mer-unesco',
        title: 'Patrimonio UNESCO',
        hint: '2016 — reconocimiento global',
        palette: 'fire',
      },
    ],
    correctOrder: ['mer-origen', 'mer-urbano', 'mer-simbolo', 'mer-unesco'],
    historyTitle: 'Ritmo que cruza fronteras',
    historyBody:
      'El merengue sintetiza historia afro, taína y europea; bailarlo es celebrar la mezcla criolla.',
    rewardBlurb: '¡Compás perfecto! Logro «Tambora en orden».',
    bonusPoints: 155,
  }),
  assertScenario({
    id: 'independencia-1844',
    title: 'Hacia la independencia',
    subtitle: 'Momentos clave que llevaron a la República Dominicana libre.',
    steps: [
      {
        id: 'ind-trinitaria',
        title: 'La Trinitaria (1838)',
        hint: 'Sociedad secreta patriótica',
        palette: 'ocean',
      },
      {
        id: 'ind-27-febrero',
        title: '27 de febrero de 1844',
        hint: 'Independencia declarada',
        palette: 'fire',
      },
      {
        id: 'ind-constitucion',
        title: 'Primera Constitución',
        hint: 'Marco legal del nuevo Estado',
        palette: 'sun',
      },
      {
        id: 'ind-republica',
        title: 'Organización republicana',
        hint: 'Estructura del gobierno',
        palette: 'leaf',
      },
    ],
    correctOrder: ['ind-trinitaria', 'ind-27-febrero', 'ind-constitucion', 'ind-republica'],
    historyTitle: 'Patria y memoria',
    historyBody:
      'La independencia fue un proceso: conspiración, proclama y leyes que dieron forma a la nación.',
    rewardBlurb: '¡Libre y en orden! Logro «Trinitario de honor».',
    bonusPoints: 165,
  }),
  assertScenario({
    id: 'habichuelas-dulce',
    title: 'Habichuelas con dulce',
    subtitle: 'Postre cuaresmal: ordena la olla como en Semana Santa.',
    steps: [
      {
        id: 'hab-cocer',
        title: 'Cocinar habichuelas',
        hint: 'Hasta que ablanden',
        palette: 'leaf',
      },
      {
        id: 'hab-leche',
        title: 'Leche y azúcar',
        hint: 'Dulzor cremoso',
        palette: 'sun',
      },
      {
        id: 'hab-especias',
        title: 'Clavo y canela',
        hint: 'Especias al gusto',
        palette: 'fire',
      },
      {
        id: 'hab-servir',
        title: 'Enfriar y servir',
        hint: 'Con galleticas o solo',
        palette: 'ocean',
      },
    ],
    correctOrder: ['hab-cocer', 'hab-leche', 'hab-especias', 'hab-servir'],
    historyTitle: 'Dulce de tradición',
    historyBody:
      'Las habichuelas con dulce unen familia y fe; cada casa defiende su punto de espesor y canela.',
    rewardBlurb: '¡Cuchara lista! Logro «Cuaresma dulce».',
    bonusPoints: 150,
  }),
  assertScenario({
    id: 'cacao',
    title: 'Del cacao dominicano',
    subtitle: 'Del árbol a la tableta: etapas del fruto criollo.',
    steps: [
      {
        id: 'cacao-cosecha',
        title: 'Cosecha de mazorcas',
        hint: 'Madurez justa',
        palette: 'leaf',
      },
      {
        id: 'cacao-fermenta',
        title: 'Fermentación',
        hint: 'Desarrolla sabor',
        palette: 'fire',
      },
      {
        id: 'cacao-secado',
        title: 'Secado al sol',
        hint: 'Granos listos',
        palette: 'sun',
      },
      {
        id: 'cacao-tostado',
        title: 'Tostado y molido',
        hint: 'Para chocolate o bebida',
        palette: 'ocean',
      },
    ],
    correctOrder: ['cacao-cosecha', 'cacao-fermenta', 'cacao-secado', 'cacao-tostado'],
    historyTitle: 'Cacao en Quisqueya',
    historyBody:
      'El cacao ha sido motor rural y ahora apunta a mercados finos con sello dominicano.',
    rewardBlurb: '¡Grano a grano! Logro «Mazorca sabia».',
    bonusPoints: 155,
  }),
  assertScenario({
    id: 'semana-santa',
    title: 'Semana Santa en orden',
    subtitle: 'Los días fuertes de la Semana Mayor, uno tras otro.',
    steps: [
      {
        id: 'ss-ramos',
        title: 'Domingo de Ramos',
        hint: 'Entrada en Jerusalén',
        palette: 'leaf',
      },
      {
        id: 'ss-jueves',
        title: 'Jueves Santo',
        hint: 'Última Cena',
        palette: 'ocean',
      },
      {
        id: 'ss-viernes',
        title: 'Viernes Santo',
        hint: 'Pasión y muerte',
        palette: 'fire',
      },
      {
        id: 'ss-pascua',
        title: 'Domingo de Resurrección',
        hint: 'Pascua, alegría',
        palette: 'sun',
      },
    ],
    correctOrder: ['ss-ramos', 'ss-jueves', 'ss-viernes', 'ss-pascua'],
    historyTitle: 'Fe y calendario',
    historyBody:
      'En RD la Semana Santa mezcla procesiones, playa y tradiciones familiares según la región.',
    rewardBlurb: '¡Procesión en orden! Logro «Semana mayor».',
    bonusPoints: 150,
  }),
  assertScenario({
    id: 'azucar-cana',
    title: 'Del campo: la caña de azúcar',
    subtitle: 'Cómo el jugo de caña se convierte en azúcar (versión simplificada).',
    steps: [
      {
        id: 'az-siembra',
        title: 'Siembra y crecimiento',
        hint: 'La plantación',
        palette: 'leaf',
      },
      {
        id: 'az-corte',
        title: 'Corte de caña',
        hint: 'Zafra y machete',
        palette: 'sun',
      },
      {
        id: 'az-molienda',
        title: 'Molienda y jugo',
        hint: 'Extraer el guarapo dulce',
        palette: 'ocean',
      },
      {
        id: 'az-cristal',
        title: 'Evaporación y cristal',
        hint: 'Del jugo al cristal',
        palette: 'fire',
      },
    ],
    correctOrder: ['az-siembra', 'az-corte', 'az-molienda', 'az-cristal'],
    historyTitle: 'Ingenios y bateyes',
    historyBody:
      'La zafra marcó siglos de historia laboral en RD; hoy el azúcar sigue siendo exportación clave.',
    rewardBlurb: '¡Zafra ordenada! Logro «Caña sabia».',
    bonusPoints: 150,
  }),
];
