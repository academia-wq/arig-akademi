import { z } from "zod/v4";

const personSchema = z.object({
  name: z.string(),
  focus: z.string(),
});

const domainLeadSchema = z.object({
  domain: z.string(),
  role: z.string(),
  name: z.string(),
});

const branchItemSchema = z.object({
  label: z.string(),
  sub: z.string(),
});

const branchSchema = z.object({
  title: z.string(),
  items: z.array(branchItemSchema),
});

const materialPanelSchema = z.object({
  key: z.string(),
  title: z.string(),
  color: z.enum(["ochre", "juniper"]),
  branches: z.array(branchSchema),
});

export const academyStructureSchema = z.object({
  owner: z.object({ name: z.string(), role: z.string() }),
  deadline: z.string(),
  output: z.string(),
  regionalManagers: z.array(personSchema),
  domainLeads: z.array(domainLeadSchema),
  materials: z.array(materialPanelSchema),
});

export type AcademyStructure = z.infer<typeof academyStructureSchema>;
export type MaterialPanel = z.infer<typeof materialPanelSchema>;
export type Branch = z.infer<typeof branchSchema>;

export const ACADEMY_STRUCTURE_ID = "00000000-0000-0000-0000-000000000001";
