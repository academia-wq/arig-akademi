export type MysteryShopperQuestion = {
  number: number;
  section: string;
  text: string;
  note?: string;
  maxScore: number;
  /** true = "Тийм" хариулт нь муу нөхцөл (бохир, гэмтэлтэй г.м) илэрхийлж, "Үгүй" нь дээд оноог авна */
  inverted: boolean;
  /** "core" = бүх салбарт хамаарна. "outdoor"/"restroom" = зөвхөн тухайн зай бүхий салбарт харуулна. */
  zone: "core" | "outdoor" | "restroom";
};

export const MYSTERY_SHOPPER_SECTIONS = [
  "Гаднах цэвэрлэгээ",
  "Мэндчилгээ, угталт",
  "Эерэг хандлага",
  "Мэргэжлийн ур чадвар",
  "Гадаад дүр төрх",
  "Бүтээгдэхүүний чанар",
  "Үйлчилгээний танхим",
  "Ариун цэврийн өрөө",
  "Үдэлт",
] as const;

export const MYSTERY_SHOPPER_QUESTIONS: MysteryShopperQuestion[] = [
  {
    number: 1,
    section: "Гаднах цэвэрлэгээ",
    text: "Рестораны гаднах орчин (шал, довжоо, шат), лого, гэрэлтүүлэг, террас, хаалга, хаалганы бариул бохир, хагарч цуурсан, гэмтэлтэй байсан эсэх",
    maxScore: 4,
    inverted: true,
    zone: "outdoor",
  },
  {
    number: 2,
    section: "Мэндчилгээ, угталт",
    text: "Ажилтан таныг ороход тань руу анхаарч «Сайн байна уу, Ариг Аня» гэсэн стандарт мэндчилгээгээр угтсан уу?",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 3,
    section: "Эерэг хандлага",
    text: "Харилцан ярианы явцад танд эерэг сэтгэгдэл төрүүлсэн үү?",
    maxScore: 4,
    inverted: false,
    zone: "core",
  },
  {
    number: 4,
    section: "Мэргэжлийн ур чадвар",
    text: "Найрсаг, өөртөө итгэлтэй дуу хоолойны өнгөөр харилцсан уу?",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 5,
    section: "Мэргэжлийн ур чадвар",
    text: "Тайлбарлаж байгаа бүтээгдэхүүнээ өөрөө сайн мэдэж тайлбарласан уу?",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 6,
    section: "Мэргэжлийн ур чадвар",
    text: "Танд зөвлөгөө өгч байхдаа үл тоосон байдал гаргасан уу?",
    note: "Гар утсаа оролдох, орхиж явах, өөр ажилтантай хувийн яриа ярих гэх мэт.",
    maxScore: 2,
    inverted: true,
    zone: "core",
  },
  {
    number: 7,
    section: "Мэргэжлийн ур чадвар",
    text: "Таны захиалахыг хүссэн бүх бүтээгдэхүүн гарч байсан уу? Үгүй бол яагаад гэдгийг тайлбарласан уу?",
    maxScore: 1,
    inverted: false,
    zone: "core",
  },
  {
    number: 8,
    section: "Мэргэжлийн ур чадвар",
    text: "Захиалсан бүтээгдэхүүн 15 минутын дотор ирсэн, эсвэл хоцрох тохиолдолд хүлээгдэх хугацааг мэдэгдсэн эсэх",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 9,
    section: "Мэргэжлийн ур чадвар",
    text: "Таны захиалга бүрэн, зөв байсан эсэх",
    note: "Зургаар баталгаажуулна уу.",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 10,
    section: "Мэргэжлийн ур чадвар",
    text: "Захиалга ирэх үед хоол болон уух зүйлсийн нэршлийг хэлэн «САЙХАН ХООЛЛООРОЙ» гэх үйлчилгээний үгийг хэлсэн эсэх",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 11,
    section: "Мэргэжлийн ур чадвар",
    text: "Хоол идэхэд хэрэгцээтэй хэрэгслийг бүрэн авч ирж өгсөн эсэх",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 12,
    section: "Гадаад дүр төрх",
    text: "Ажилтан амны хаалт, энгэрийн тэмдэг зүүсэн, хувцаслалт цэвэр, үзэмжтэй байсан уу?",
    maxScore: 6,
    inverted: false,
    zone: "core",
  },
  {
    number: 13,
    section: "Гадаад дүр төрх",
    text: "Ажилтны гадаад төрх (нүүрний будалт, үсний янзалгаа) стандартад нийцсэн байсан уу?",
    note: "Эмэгтэй ажилтан нүүрний хэлбэрт тохирсон цэвэрхэн будалттай, үсээ духаа ил гарган цэвэр үзэмжтэй янзалсан байх.",
    maxScore: 4,
    inverted: false,
    zone: "core",
  },
  {
    number: 14,
    section: "Бүтээгдэхүүний чанар",
    text: "Таны хоол халуун ирсэн эсэх",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 15,
    section: "Бүтээгдэхүүний чанар",
    text: "Захиалсан хоол хоолны цэсний зурагтай, мөн таны хүссэн онцгой шаардлагын дагуу ирсэн эсэх",
    note: "Үгүй бол тэмдэглэлд тайлбарлана уу.",
    maxScore: 4,
    inverted: false,
    zone: "core",
  },
  {
    number: 16,
    section: "Үйлчилгээний танхим",
    text: "Гал тогооны хэсэг эмх цэгцтэй, цэвэр, ажилтан малгай өмссөн, үс нь бүрэн хучигдсан байсан уу?",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
  {
    number: 17,
    section: "Үйлчилгээний танхим",
    text: "Танхимын шал, ширээ, сандал, гэрэл гэх мэт нийт байдал бохир, эвдэрч гэмтсэн эсэх",
    maxScore: 3,
    inverted: true,
    zone: "core",
  },
  {
    number: 18,
    section: "Ариун цэврийн өрөө",
    text: "Ариун цэврийн өрөө тухгүй үнэртэй, тоног төхөөрөмж (суултуур, шал, угаалтуур, толь) бохир, эсвэл цаас/саван дутуу байсан эсэх",
    maxScore: 5,
    inverted: true,
    zone: "restroom",
  },
  {
    number: 19,
    section: "Үдэлт",
    text: "Үйлчилгээний төгсгөлд тод «Баярлалаа, дахин ирээрэй» гэж стандарт үг хэлсэн үү?",
    maxScore: 2,
    inverted: false,
    zone: "core",
  },
];

export const MAX_TOTAL_SCORE = MYSTERY_SHOPPER_QUESTIONS.reduce((sum, q) => sum + q.maxScore, 0);

export function calculateQuestionScore(question: MysteryShopperQuestion, answer: boolean): number {
  const positiveAnswer = question.inverted ? !answer : answer;
  return positiveAnswer ? question.maxScore : 0;
}

/** hasOutdoorAndRestroom = false бол "outdoor"/"restroom" бүсийн асуултуудыг хасна (жишээ нь худалдааны төвийн салбар). */
export function getApplicableQuestions(hasOutdoorAndRestroom: boolean): MysteryShopperQuestion[] {
  return hasOutdoorAndRestroom
    ? MYSTERY_SHOPPER_QUESTIONS
    : MYSTERY_SHOPPER_QUESTIONS.filter((q) => q.zone === "core");
}

export function getMaxScoreFor(hasOutdoorAndRestroom: boolean): number {
  return getApplicableQuestions(hasOutdoorAndRestroom).reduce((sum, q) => sum + q.maxScore, 0);
}

export function questionsBySection(
  hasOutdoorAndRestroom: boolean = true
): { section: string; questions: MysteryShopperQuestion[] }[] {
  const applicable = getApplicableQuestions(hasOutdoorAndRestroom);
  return MYSTERY_SHOPPER_SECTIONS.map((section) => ({
    section,
    questions: applicable.filter((q) => q.section === section),
  })).filter((s) => s.questions.length > 0);
}
