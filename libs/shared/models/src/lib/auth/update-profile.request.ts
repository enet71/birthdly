// `PATCH /api/me`: only the fields present change; `null` clears a field.
export interface UpdateProfileRequest {
  displayName?: string | null;
  birthDate?: string | null;
}
