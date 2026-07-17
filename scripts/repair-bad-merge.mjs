import { createClient } from "@supabase/supabase-js";

const COURSE_ID = "a0a8f481-40d9-4af8-88f1-b4746b9255d0";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Модулиудыг нэрлэж, дараа нь тухайн lesson id-уудыг шинэ module_id, position-руу шилжүүлнэ
async function createModule(title, position) {
  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id: COURSE_ID, title, position })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function moveLessons(lessonIds, targetModuleId) {
  for (let i = 0; i < lessonIds.length; i++) {
    const { error } = await supabase
      .from("lessons")
      .update({ module_id: targetModuleId, position: i })
      .eq("id", lessonIds[i]);
    if (error) throw error;
  }
}

async function renameModule(id, title, position) {
  const { error } = await supabase.from("modules").update({ title, position }).eq("id", id);
  if (error) throw error;
}

async function deleteModuleIfEmpty(id) {
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", id);
  if ((count || 0) === 0) {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) throw error;
    console.log("  deleted empty module", id);
  } else {
    console.log("  WARNING: module", id, "still has", count, "lessons, not deleting");
  }
}

async function main() {
  // A) 923091af: keep only the true О-1 lessons (positions 0-5 already correct there),
  //    split out АРИГ ИНТЕРНЭШНЛ (10) and О-11 (10) into new modules.
  const arigId = await createModule("“АРИГ ИНТЕРНЭШНЛ” ХХК: Ажлын байрны тодорхойлолт", 1);
  await moveLessons(
    [
      "4349f70a-ef7c-420a-8013-06a9d68149b6",
      "91ec6a76-647c-46be-9482-663ebdcf1658",
      "f2295581-0052-4e82-b7cb-ea2fc76cc7fe",
      "3522a8e4-f87f-488f-8bb0-154f33a62681",
      "c2be23a4-6513-48ff-a4ff-3fac33608cab",
      "c4cea691-a3fd-4dff-891a-46716cae14e0",
      "f635894c-d98c-4c0d-beaa-953fb8d9da58",
      "e96bac4b-1ad7-4b25-a8f5-85beda430499",
      "4e125c29-d92e-453c-a635-e351c2cd9f8b",
      "c88fd1ff-6bb9-4ebf-962f-522e9891eddf",
    ],
    arigId
  );
  console.log("A1) АРИГ ИНТЕРНЭШНЛ restored:", arigId);

  const o11Id = await createModule("О-11 стандарт: Үйлчлүүлэгчийн гомдол шийдвэрлэлт", 2);
  await moveLessons(
    [
      "86f3fb53-0c8b-4907-920f-292934479af6",
      "36eb4dc5-d446-4529-92bc-54775f2015e7",
      "c52fa894-f766-4dfb-bb87-e5b471ad9777",
      "9c50e86e-01bd-4a56-abf5-5a5633c11b62",
      "68d9fe49-8ac8-4695-92e6-ace9c477f5f7",
      "8c689106-4803-4c44-8224-673eba92b7d9",
      "bae1db6b-78e7-476b-8b1e-6f5ab49e9dd3",
      "d58eb9ee-a87d-4488-a488-98ae2688661a",
      "dc178db5-7753-421f-bad7-47ab1fba73ee",
      "1250b9f5-f4fa-498d-9bb9-da9fddf0a760",
    ],
    o11Id
  );
  console.log("A2) О-11 стандарт restored:", o11Id);
  await renameModule(
    "923091af-dc12-4faa-b008-4da370f99325",
    "О-1 стандарт: Ажилтны гадаад төрх, хувцаслалтын стандарт",
    0
  );
  console.log("A3) О-1 стандарт title/position confirmed");

  // B) a5223b5e: split into 7 modules (О-10, О-8, О-7, О-6, О-5, О-4, О-3)
  const o10Id = await createModule("О-10 стандарт: Сургалтын менежмент", 3);
  await moveLessons(
    [
      "66e704c2-1bb6-4891-ad52-1026e8cc0a12",
      "2d0a1f55-7f72-4ff8-926f-e7552eb14298",
      "7a121ddc-c29a-42a6-9e77-e77ef6189699",
      "c69a610c-a576-4a35-b22d-b0970abb6b53",
      "672d08f4-e665-4935-97e4-2c9cfc48198b",
      "1ba8074a-488b-4b90-a1e2-82e089cb927e",
      "c51dce7e-c259-4a61-af2b-8789459acbe1",
      "0f6c4d5f-f1cf-443e-98e6-231d27c16688",
      "78a84845-e844-44e9-a50f-9478fc3cea02",
      "e47c0b5a-e1e3-4b5c-b689-a1201cb1d6f2",
      "85f9ba10-7633-426b-8f29-cb17a07ca68f",
      "94845cee-ce7e-4a8a-95d5-01d13d71d7da",
      "76d98e5e-b8e0-4263-8061-5a3e04e16fb7",
      "1c881000-4feb-4c1d-9018-1285641ccc75",
    ],
    o10Id
  );
  console.log("B1) О-10 стандарт restored:", o10Id);

  const o8Id = await createModule("О-8 стандарт: Ерөнхий орчин, цэвэрлэгээний стандарт", 4);
  await moveLessons(
    [
      "ce77c207-f752-46df-9e5d-6635b3defc2f",
      "23b04454-a7f0-407b-8266-a8d060e70ce3",
      "e3616f85-473a-4a70-be93-991798f4b5db",
      "fee6d368-48e6-4b65-a312-39fc2b2fa631",
      "769e96a3-194d-418d-84e4-4f33a90bd48b",
      "a868979a-09eb-437b-aa4d-b7c5f639b92c",
      "a343cbbf-6ca6-4d1e-81cd-9caffbf34388",
    ],
    o8Id
  );
  console.log("B2) О-8 стандарт restored:", o8Id);

  const o7Id = await createModule(
    "О-7 Стандарт - Утсан харилцаа, утсаар захиалга авах стандарт",
    5
  );
  await moveLessons(
    [
      "7d756e0d-a6f8-45af-bdcc-e22a9872dabe",
      "47d74026-d452-481c-a354-f36d800db37f",
      "a555aabd-8f7a-47ad-a1de-12a68ed7219b",
      "c35d13c4-b2ed-413f-92b9-e384eb0cdd50",
      "102858d3-c568-4af0-83f2-ca9fd9c14298",
      "47c64667-5e51-4eee-b5e0-8fc835535a73",
      "19b09b5c-896e-4e48-af0a-3cb73aea8230",
    ],
    o7Id
  );
  console.log("B3) О-7 стандарт restored:", o7Id);

  const o6Id = await createModule("О-6 Стандарт: Авч явах бүтээгдэхүүний савлалт", 6);
  await moveLessons(
    [
      "a327e603-79f6-4d9a-be62-da9d56ac52a2",
      "0ad582ba-3ecd-48be-9891-383b70dffd24",
      "7350dccd-be89-487b-906d-85519f74c144",
      "14701d97-5e73-4e26-bb88-fea0b32f9b9e",
      "fd60408b-3a41-4399-b741-c426b559bac7",
    ],
    o6Id
  );
  console.log("B4) О-6 стандарт restored:", o6Id);

  const o5Id = await createModule("О-5 стандарт - Бараа марчендайз стандарт", 7);
  await moveLessons(
    [
      "f6eefd7c-cb49-4e57-807c-92e6af8ec9bf",
      "fd14e074-9110-4a8a-9ecb-92d6a4831c8d",
      "f7d08751-49b4-4be7-9b5f-ab3af2ce52cb",
      "55dd9c3e-3521-465b-ac4a-b68dcdd7d20c",
    ],
    o5Id
  );
  console.log("B5) О-5 стандарт restored:", o5Id);

  const o4Id = await createModule("О-4 Стандарт: Хаах үеийн стандарт", 8);
  await moveLessons(
    [
      "c287044a-3f34-44ab-b0b4-f0ecc686a690",
      "279455bb-ce89-4a2e-b418-7bf3c03571f2",
      "19e07c3f-5852-4652-8b07-c15a8a39cdca",
      "c888c56f-961f-406f-9965-3288de702121",
    ],
    o4Id
  );
  console.log("B6) О-4 стандарт restored:", o4Id);

  const o3Id = await createModule("О-3 Стандарт: Ресторан нээх үеийн үйл ажиллагаа", 9);
  await moveLessons(
    [
      "49751471-1c4b-4bd9-b573-d9f3228e1e54",
      "dd1f4bfc-6f03-4705-82bc-e17cd3c478a8",
      "25356e6b-a6bc-4a31-9bb4-f8e68ee8f918",
      "42ee39b7-d022-442d-b7a8-f6a6dd90c398",
    ],
    o3Id
  );
  console.log("B7) О-3 стандарт restored:", o3Id);
  await deleteModuleIfEmpty("a5223b5e-816f-410f-8e42-6c6fc92e7ac5");

  // C) ef799ba4: split into 4 (Үйлчилгээний журам, Менежерийн, Бүсийн менежерийн, Хөдөлмөрийн)
  const jurmId = await createModule("Үйлчилгээний журам", 10);
  await moveLessons(
    [
      "1942961c-c1da-4ea5-b409-9251874890a7",
      "a46beb07-68f1-4124-b186-5f241166d182",
      "7255d493-a295-408a-b418-776737b21249",
      "cfec6c3a-67ea-4e2f-a038-9918f738b565",
      "93355c99-126e-4d0b-89bf-06aca9ab34a2",
      "37db97d0-a555-4f28-990b-00e9f3f824ed",
      "2aee27a6-d59b-43e2-9ba1-4f9e290f38d8",
      "7a1ce13c-2acb-479f-913d-b9857e659591",
      "eaa815b0-4946-4f68-96f6-2b5ee94bef5f",
      "6a4d33b9-15ab-4e83-8722-c7ea94dd9add",
      "270e3470-7be5-4a29-9398-0f2745e96db9",
      "88e00fce-c846-4200-8f9c-38f7dd02188a",
      "a8140ff5-4d67-4345-98c5-66bed745b068",
      "78a73801-f54e-47dd-8a51-ccb0a9a42230",
      "70581731-8a33-46ff-84ea-df75dc163591",
      "9c7c5c49-0773-40ad-a39d-897935c60dca",
      "c808f71f-828b-4a2f-abbc-a945a1003ae4",
      "9cc4b54f-d9d1-4c38-b547-bf1a2d9f1fde",
      "5b7959ce-fcab-46e0-af4d-71609352e37d",
      "770bb0ee-19e7-4075-bf39-623776054907",
      "f1a177c0-5e48-48d6-991a-5772cf1d8561",
      "9fe69ae6-c9dd-46e3-a96a-b6a0e1e7733e",
      "05eff350-4fc4-4377-a395-32c536027728",
      "a7951328-9f97-4080-b4fa-90118176dbe5",
      "34e64f16-65ad-4d62-bc43-1d6525e2f9c1",
    ],
    jurmId
  );
  console.log("C1) Үйлчилгээний журам restored:", jurmId);

  const menejerId = await createModule("Менежерийн үйл ажиллагааны стандарт", 11);
  await moveLessons(
    [
      "a8e6f3ea-6d33-47fa-9c62-b60c468b1557",
      "f5740f7d-7119-4532-b264-e380f6626839",
      "234ed29a-4cbe-4f45-91a8-44d4b25e59fe",
      "a0da26ed-e291-4144-9d9d-6888568070b0",
      "86cd47d4-b764-4d87-a684-ac805161fbf0",
      "c54abc29-49a8-4cf6-af08-009e9c154a5c",
      "f404e521-871e-4843-9fbc-cd59e13913e8",
      "145595c8-6b5c-4614-accc-c26814bd31ec",
      "def7e5e0-283f-430f-a635-bced967f9184",
      "c6f0d473-a0a4-4019-b420-8e9667053aec",
      "e04bf46d-cb5d-40e1-95e4-5d47fd5836ed",
      "766af3d1-cd77-48b9-951c-e01bc9912d96",
      "197b862d-d4f9-43f1-91e4-c6c1a62c75c5",
      "189f8de2-8659-47a3-a11d-f1185b8d953e",
      "acf22ef6-f788-42a1-9057-00b3886e6dee",
      "2b0fa7a0-1a96-4b2d-9850-b82df599dc6b",
    ],
    menejerId
  );
  console.log("C2) Менежерийн restored:", menejerId);

  const busiinId = await createModule("Бүсийн менежерийн үйл ажиллагааны стандарт", 12);
  await moveLessons(
    [
      "aa0d347c-4399-40e9-83f2-d46028938f7e",
      "086b3fa1-91f8-4300-9f8d-7953398fdbcd",
      "43fb689f-f3e0-45e4-a5b2-86b0309d7393",
      "b9504807-c8f1-4717-9d62-d8fdec1752f6",
      "8a26e07d-f275-49e7-af2c-37d92aa74b77",
      "6767948c-d02b-4466-ae22-8c903db183ed",
      "cf7933bc-d417-4fcc-a283-7cd5880b0c28",
      "31518439-8b33-45ad-95c7-2a8356d05ac8",
      "50801d10-ce3e-441d-a5c8-dc48b1b168cd",
      "4c47ee6a-252f-400f-a31c-e17b54266642",
      "c5965b26-5935-4031-abb1-85637edcff60",
      "83316bde-a6e9-49c4-a18f-3c77b5eb49a1",
      "ccc907d7-54e7-4639-a2f9-ca23d4584ba9",
      "81810b69-ddf9-4d09-9f96-8402498e31bd",
      "3921270b-c361-4f8f-9b2c-2251e3c945a0",
      "e4db7562-4f0e-415d-9163-586bd1e98224",
      "0a498c04-a83b-4288-a675-cfc7b6f2e9bf",
      "3d370864-8f15-4c50-a4e9-38c0cb49a3cd",
      "0955c4b7-1dfd-459a-9944-83a587a5d2cb",
      "094bac7a-4ed5-4106-8242-6f6f0763cc58",
      "ac452a79-9f6a-4f85-bdf4-2a860ba529d2",
    ],
    busiinId
  );
  console.log("C3) Бүсийн менежерийн restored:", busiinId);

  const habeaId = await createModule("Хөдөлмөрийн аюулгүй байдал, эрсдэлийн зааварчилгаа", 13);
  await moveLessons(
    [
      "a5dabb77-d1f1-492e-8a94-ae53a88f50ec",
      "2437d98c-d83b-44a2-b12d-25680fb8076f",
      "ba982727-0518-4a5e-95a9-e3b5a10d49ec",
      "9468777f-3700-4f25-bb35-3c099e71debb",
      "430ca95e-a20e-480b-a3f9-979a2c8f4d07",
      "746be843-4b8e-42ef-bf1f-5734a24a8b26",
      "f968dfba-f379-4550-bdd1-ed43424bc3da",
      "61eeffaa-6548-4557-b800-fe9196123ffa",
      "a802b7ab-5c34-447b-99ba-ac9a8f7155b6",
      "9a222322-f338-45bb-8a07-cf5357af2e7a",
      "ff87d3cb-8478-474a-a116-594c6b10dec9",
      "e0e2748f-16c3-4137-9c27-9c8dca0303a1",
      "3c55fe68-451c-415e-a19c-b1ea88920002",
      "5a94fdd9-8adb-414a-9ce2-9ed75ec2a1ab",
      "6490b114-7ac6-49b8-b5b2-811d604e4c81",
      "9de6ee5d-9880-4d4b-a5f1-d4ca6f5ff1fe",
    ],
    habeaId
  );
  console.log("C4) Хөдөлмөрийн аюулгүй байдал restored:", habeaId);
  await deleteModuleIfEmpty("ef799ba4-132c-4df6-bb52-ecfb5aba97ba");

  // D) c29e23fc: keep only the true О-2 lessons, move the other 8 out to new file1 target
  const o2Keep = [
    "eb769c96-205b-4902-bd06-f783175e0634",
    "97b31063-240e-4015-80cf-cebd4767baa6",
    "96d9c25d-b4e2-4609-a221-4e149cbe7be3",
    "2516b368-6b3d-44e9-9423-03efbbeae9d6",
    "42c6e701-4c48-4691-b25b-e63b081bc2fa",
    "d72036a4-e245-4454-afbb-71ce5b75d83c",
    "a63ea312-3e4f-4365-9c2f-73accb61b524",
    "0c9cd7ba-d840-4995-bdac-27496f9e2177",
    "8452a0ad-b9c6-4adb-b240-04457a0aad76",
    "916ac449-9ae0-4f02-a2d1-f9122d5ced59",
  ];
  await moveLessons(o2Keep, "c29e23fc-a366-4293-a8d7-55f661d7f052");
  await renameModule(
    "c29e23fc-a366-4293-a8d7-55f661d7f052",
    "О-2 стандарт: Үйлчлүүлэгчийг угтах, захиалга, харилцааны стандарт",
    14
  );
  console.log("D) О-2 стандарт restored (position/title fixed)");

  // E) Consolidate new file 1 ("Үйлчилгээний стандарт.pdf") into module 647e1dbd
  const file1ExtraLessons = [
    "607b16f2-3915-4967-aa9a-85163bb20443",
    "7ac98a3d-e56e-4044-b65d-eef890d36611",
    "08c33bcb-f32d-4786-821c-c7b3770d08cf",
    "b57697d5-f484-4f09-8575-23ede264ce14",
    "b01b3eff-d440-4f30-86f3-c782d081e8d9",
    "afc317e4-4215-4552-bed5-d7f6e9a38d5b",
    "d05f669f-41a0-4d75-ae0c-bf46a5058d8c",
    "358ecd71-2b7a-4aa2-b3f1-896802de3d8a",
  ];
  // 647e1dbd already has 7 lessons (positions 0-6); append the 8 extras at positions 7-14
  for (let i = 0; i < file1ExtraLessons.length; i++) {
    const { error } = await supabase
      .from("lessons")
      .update({ module_id: "647e1dbd-c96b-49fc-acde-eed66c9ce85d", position: 7 + i })
      .eq("id", file1ExtraLessons[i]);
    if (error) throw error;
  }
  await renameModule("647e1dbd-c96b-49fc-acde-eed66c9ce85d", "Үйлчилгээний стандарт", 15);
  console.log("E) Үйлчилгээний стандарт consolidated (15 lessons expected)");

  // F) Consolidate new file 2 ("10 стандарт.pdf") into module abe157f0
  const file2ExtraGroups = [
    ["a387bb01-398d-456c-ba52-fefd5fd04220"], // Танилцуулга
    [
      "3338330d-579a-435e-bbf3-76bbaf6206a7",
      "35521b46-e377-484d-b7b4-9aa8545ce95e",
      "aaa18953-272f-4e09-aa9d-65d737e43b48",
      "2856fe68-a264-4a00-b10a-7e33fbacf492",
      "bb37ceff-a930-45e6-8510-c5fa8c056b4e",
    ], // Стандарт 01
    [
      "55e0fef8-5728-4661-86a7-bbd84746f986",
      "9562c640-163b-46fa-addf-e021d6e33722",
      "f7bc36c2-9be8-4ed8-814d-15d642d1fde3",
    ], // Стандарт 02
    [
      "d30db3dc-8f7d-4703-bcb1-2bbbf348d798",
      "e4185f78-65be-4556-9e1f-b94ff66eb9d8",
      "f3e6419b-5731-4da5-95e7-b8a2cd3d1aa8",
      "ec342faf-bc25-40f9-a915-d72d55d95498",
    ], // Стандарт 03
    ["0cb769e2-f5d2-4fdf-94bb-60bc84e67d89", "7e35b795-b7b5-48e3-b365-8ccf743a3d39"], // Стандарт 04
  ];
  const file2Extras = file2ExtraGroups.flat();
  let nextPos = 12; // abe157f0 already has 12 lessons at positions 0-11
  for (const id of file2Extras) {
    const { error } = await supabase
      .from("lessons")
      .update({ module_id: "abe157f0-ba68-4fc4-8cfc-88c1dd9f3ecf", position: nextPos })
      .eq("id", id);
    if (error) throw error;
    nextPos++;
  }
  await renameModule("abe157f0-ba68-4fc4-8cfc-88c1dd9f3ecf", "Үйлчилгээний 10 стандарт", 16);
  console.log("F) Үйлчилгээний 10 стандарт consolidated (27 lessons expected)");

  // Delete now-empty source modules for file2's original fine-grained modules
  for (const id of [
    "b22f3fe7-5233-4481-9add-f6acefc0b471",
    "f815e0f6-1165-41b7-bea0-38dd7bab917e",
    "c8c0fd47-c6e6-42d1-9afb-0ef0da2524f9",
    "2d49722d-9574-40fd-b263-5fd49be5d135",
    "5ce1ed0c-5bdb-4ee0-babb-84bb5e209be8",
  ]) {
    await deleteModuleIfEmpty(id);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
