export interface UserProfile {
  readonly id?: string;
  readonly email: string;
  readonly name: string;
  readonly photoUrl?: string | null;
  readonly onboardingCompleted?: boolean;
}
