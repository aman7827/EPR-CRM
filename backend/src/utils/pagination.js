/**
 * Parse and sanitize pagination query parameters
 */
export const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = (query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
  };
};

/**
 * Format pagination metadata object
 */
export const formatPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total: parseInt(total || '0', 10),
    totalPages,
  };
};
