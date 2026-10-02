const authorService = require('../services/author.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Controller: Create author (Admin only)
 * POST /api/authors
 */
const createAuthor = asyncHandler(async (req, res) => {
  const author = await authorService.createAuthor(req.body);
  return res.status(201).json({
    success: true,
    message: 'Author created successfully',
    author
  });
});

/**
 * Controller: Get all authors
 * GET /api/authors
 */
const getAllAuthors = asyncHandler(async (req, res) => {
  const authors = await authorService.getAllAuthors();
  return res.status(200).json({
    success: true,
    count: authors.length,
    authors
  });
});

/**
 * Controller: Get author by ID
 * GET /api/authors/:id
 */
const getAuthorById = asyncHandler(async (req, res) => {
  const author = await authorService.getAuthorById(req.params.id);
  return res.status(200).json({
    success: true,
    author
  });
});

/**
 * Controller: Update author (Admin only)
 * PUT /api/authors/:id
 */
const updateAuthor = asyncHandler(async (req, res) => {
  const author = await authorService.updateAuthor(req.params.id, req.body);
  return res.status(200).json({
    success: true,
    message: 'Author updated successfully',
    author
  });
});

/**
 * Controller: Delete author (Admin only)
 * DELETE /api/authors/:id
 */
const deleteAuthor = asyncHandler(async (req, res) => {
  const result = await authorService.deleteAuthor(req.params.id);
  return ApiResponse.success(res, result.message);
});

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor
};
