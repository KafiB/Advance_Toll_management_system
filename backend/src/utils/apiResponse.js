// ─────────────────────────────────────────────────────
//  apiResponse.js
//  A utility that standardizes every JSON response
//  sent from our API.
//
//  Without this, every developer writes responses
//  differently:
//    res.json({ data: user })
//    res.json({ result: user })
//    res.json({ user: user })
//
//  With this, EVERY response looks the same:
//    { success: true, message: "...", data: {...} }
//  This is how US-based production APIs are built.
// ─────────────────────────────────────────────────────

class ApiResponse {
  // ───────────────────────────────────────────────────
  //  success()
  //  Use this when everything went well
  //
  //  Example:
  //  ApiResponse.success(res, "User created", user, 201)
  //
  //  Sends:
  //  {
  //    "success": true,
  //    "message": "User created",
  //    "data": { ...user }
  //  }
  // ───────────────────────────────────────────────────
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
    };

    // Only include data field if data was actually provided
    // We don't want { data: null } in our responses
    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  // ───────────────────────────────────────────────────
  //  error()
  //  Use this when something went wrong
  //
  //  Example:
  //  ApiResponse.error(res, "Vehicle not found", 404)
  //
  //  Sends:
  //  {
  //    "success": false,
  //    "message": "Vehicle not found"
  //  }
  // ───────────────────────────────────────────────────
  static error(res, message, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // ───────────────────────────────────────────────────
  //  paginated()
  //  Use this when returning a list with pagination
  //  Example: list of all transactions, all vehicles
  //
  //  Sends:
  //  {
  //    "success": true,
  //    "message": "Vehicles fetched",
  //    "count": 10,
  //    "pagination": { page: 1, limit: 10, total: 100 },
  //    "data": [ ...vehicles ]
  //  }
  // ───────────────────────────────────────────────────
  static paginated(res, message, data, count, pagination) {
    return res.status(200).json({
      success: true,
      message,
      count,        // how many results in THIS page
      pagination,   // page number, limit, total records
      data,
    });
  }
}

module.exports = ApiResponse;