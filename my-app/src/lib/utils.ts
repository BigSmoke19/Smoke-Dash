

export function extractApiError(error: any): string {
  // axios-style error
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // fetch / custom API error
  if (error?.message) {
    return error.message;
  }

  // fallback
  return "Something went wrong";
}
