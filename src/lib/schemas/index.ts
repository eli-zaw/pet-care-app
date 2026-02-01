import { z } from "zod";

export const CreatePetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Imię zwierzęcia jest wymagane")
    .max(50, "Imię zwierzęcia nie może być dłuższe niż 50 znaków"),
  species: z.enum(["dog", "cat", "other"], {
    errorMap: () => ({ message: "Gatunek musi być jednym z: dog, cat, other" }),
  }),
});

export * from "./auth";
