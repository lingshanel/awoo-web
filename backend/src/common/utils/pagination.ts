export function getSkip(page = 1, limit = 20) {
  return (page - 1) * limit;
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
