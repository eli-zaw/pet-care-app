import type { CreatePetCommand, CreatePetResponseDto, GetPetResponseDto, UpdatePetCommand } from "@/types";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  data: ApiErrorData;
}

const parseJson = async (response: Response): Promise<ApiErrorData> => {
  try {
    return (await response.json()) as ApiErrorData;
  } catch {
    return {};
  }
};

export const createPet = async (command: CreatePetCommand): Promise<CreatePetResponseDto> => {
  const response = await fetch("/api/pets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    throw { status: response.status, data } satisfies ApiError;
  }

  return data as CreatePetResponseDto;
};

export const updatePet = async (petId: string, command: UpdatePetCommand): Promise<GetPetResponseDto> => {
  const response = await fetch(`/api/pets/${petId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    throw { status: response.status, data } satisfies ApiError;
  }

  return data as GetPetResponseDto;
};
