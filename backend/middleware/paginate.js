// ============ PAGINATION HELPER ============
// Adds ?page=1&limit=50 support to any array response
// Usage: res.json(paginate(items, req))

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Paginate an array based on req.query.page and req.query.limit
 * Returns { data, pagination } if page param is present, otherwise returns raw array (backward compat)
 */
function paginate(items, req) {
  const page = parseInt(req.query.page);
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

  // If no page param, return raw array for backward compatibility
  if (!page || page < 1) return items;

  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages
    }
  };
}

module.exports = paginate;
