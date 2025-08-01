export interface StatusError extends Error {
  status?: number;
}

export const formatErrorResponse = (status: number, errorMessage?: string): StatusError => {
  const error = new Error(errorMessage || "An unexpected error occurred") as StatusError;
  error.status = status;
  return error;
};