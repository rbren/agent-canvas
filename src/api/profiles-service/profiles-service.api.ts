import { openHands } from "../open-hands-axios";

export interface LlmProfileSummary {
  name: string;
  model: string | null;
  base_url: string | null;
  api_key_set: boolean;
}

export interface ProfileListResponse {
  profiles: LlmProfileSummary[];
  /** Name of the currently active profile, or null if none is active. */
  active_profile: string | null;
}

export interface ProfileDetailResponse {
  name: string;
  config: Record<string, unknown>;
  api_key_set: boolean;
}

/**
 * Secret exposure mode for X-Expose-Secrets header on profile endpoints.
 *
 * - undefined: Returns nulled api_key with api_key_set indicator
 * - "encrypted": Returns cipher-encrypted values (safe for frontend to round-trip)
 * - "plaintext": Returns raw secret values (backend use only!)
 */
export type ProfileExposeSecretsMode = "encrypted" | "plaintext" | undefined;

export interface SaveLlmProfileRequest {
  /**
   * LLM configuration to save. If omitted, the backend will snapshot
   * the current agent_settings.llm from the settings store.
   */
  llm?: {
    model: string;
    base_url?: string | null;
    api_key?: string | null;
  } & Record<string, unknown>;
  include_secrets?: boolean;
}

export interface ProfileMutationResponse {
  name: string;
  message: string;
}

export interface ActivateProfileResponse {
  name: string;
  message: string;
  model: string | null;
}

class ProfilesService {
  static async listProfiles(): Promise<ProfileListResponse> {
    const { data } = await openHands.get<ProfileListResponse>("/api/profiles");
    return data;
  }

  static async getProfile(
    name: string,
    exposeSecrets?: ProfileExposeSecretsMode,
  ): Promise<ProfileDetailResponse> {
    const headers: Record<string, string> = {};
    if (exposeSecrets) {
      headers["X-Expose-Secrets"] = exposeSecrets;
    }
    const { data } = await openHands.get<ProfileDetailResponse>(
      `/api/profiles/${encodeURIComponent(name)}`,
      { headers },
    );
    return data;
  }

  static async saveProfile(
    name: string,
    request: SaveLlmProfileRequest,
  ): Promise<ProfileMutationResponse> {
    const { data } = await openHands.post<ProfileMutationResponse>(
      `/api/profiles/${encodeURIComponent(name)}`,
      request,
    );
    return data;
  }

  static async deleteProfile(name: string): Promise<ProfileMutationResponse> {
    const { data } = await openHands.delete<ProfileMutationResponse>(
      `/api/profiles/${encodeURIComponent(name)}`,
    );
    return data;
  }

  static async renameProfile(
    name: string,
    newName: string,
  ): Promise<ProfileMutationResponse> {
    const { data } = await openHands.post<ProfileMutationResponse>(
      `/api/profiles/${encodeURIComponent(name)}/rename`,
      { new_name: newName },
    );
    return data;
  }

  static async activateProfile(name: string): Promise<ActivateProfileResponse> {
    const { data } = await openHands.post<ActivateProfileResponse>(
      `/api/profiles/${encodeURIComponent(name)}/activate`,
    );
    return data;
  }
}

export default ProfilesService;
