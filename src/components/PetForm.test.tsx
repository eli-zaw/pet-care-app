import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePetForm } from "./hooks/usePetForm";
import type { GetPetResponseDto } from "@/types";

describe("usePetForm", () => {
  it("validates name rules", () => {
    const { result } = renderHook(() => usePetForm({ mode: "create" }));
    const validate = result.current.nameRules.validate as (value: string) => true | string;

    expect(validate("Max")).toBe(true);
    expect(validate("   ")).toBe("Imię jest wymagane");
    expect(validate("A".repeat(51))).toBe("Imię może mieć maksymalnie 50 znaków");
  });

  it("validates species only in create mode", () => {
    const { result: createResult } = renderHook(() => usePetForm({ mode: "create" }));
    const createValidate = createResult.current.speciesRules.validate as (value: string) => true | string;
    expect(createValidate("")).toBe("Gatunek jest wymagany");
    expect(createValidate("dog")).toBe(true);

    const { result: editResult } = renderHook(() => usePetForm({ mode: "edit" }));
    const editValidate = editResult.current.speciesRules.validate as (value: string) => true | string;
    expect(editValidate("")).toBe(true);
  });

  it("tracks unchanged name in edit mode", () => {
    const initialData = {
      id: "pet-1",
      name: "Luna",
      species: "cat",
    } as GetPetResponseDto;

    const { result } = renderHook(() => usePetForm({ mode: "edit", initialData }));
    expect(result.current.isUnchanged).toBe(true);

    act(() => {
      result.current.form.setValue("name", "Max");
    });
    expect(result.current.isUnchanged).toBe(false);
  });
});
