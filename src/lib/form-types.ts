export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const initialFormState: FormState = { status: "idle" };

/* ------- auth ------- */
export type SignInState = {
  status: "idle" | "error";
  message?: string;
};

export const signInInitial: SignInState = { status: "idle" };

/* ------- admin publish (blogs / testimonials) ------- */
export type PublishState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const publishInitial: PublishState = { status: "idle" };
