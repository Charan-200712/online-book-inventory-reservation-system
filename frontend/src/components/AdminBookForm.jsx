import React, { useState, useEffect } from 'react';

function AdminBookForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  authors = [],
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    author_id: '',
    category: '',
    total_copies: 1,
    description: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        isbn: initialData.isbn || '',
        author_id: initialData.author_id ? String(initialData.author_id) : '',
        category: initialData.category || '',
        total_copies: initialData.total_copies !== undefined ? initialData.total_copies : 1,
        description: initialData.description || '',
      });
    } else {
      setFormData({
        title: '',
        isbn: '',
        author_id: '',
        category: '',
        total_copies: 1,
        description: '',
      });
    }
    setFieldErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';
    if (!formData.isbn.trim()) errors.isbn = 'ISBN is required.';
    if (!formData.author_id) errors.author_id = 'Please select an author.';
    if (!formData.category.trim()) errors.category = 'Category is required.';
    if (
      formData.total_copies === '' ||
      isNaN(Number(formData.total_copies)) ||
      Number(formData.total_copies) < 0
    ) {
      errors.total_copies = 'Total copies must be a non-negative number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: formData.title.trim(),
      isbn: formData.isbn.trim(),
      author_id: Number(formData.author_id),
      category: formData.category.trim(),
      total_copies: parseInt(formData.total_copies, 10),
      description: formData.description.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="book-modal-title">
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="book-modal-title" className="modal-title">
            {initialData ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          <div className="form-group">
            <label htmlFor="book-form-title">Book Title *</label>
            <input
              id="book-form-title"
              name="title"
              type="text"
              className={`form-input ${fieldErrors.title ? 'input-error' : ''}`}
              placeholder="e.g. Design Patterns"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {fieldErrors.title && <span className="field-error-msg">{fieldErrors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="book-form-isbn">ISBN *</label>
              <input
                id="book-form-isbn"
                name="isbn"
                type="text"
                className={`form-input ${fieldErrors.isbn ? 'input-error' : ''}`}
                placeholder="e.g. 978-0201633610"
                value={formData.isbn}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.isbn && <span className="field-error-msg">{fieldErrors.isbn}</span>}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="book-form-author">Author *</label>
              <select
                id="book-form-author"
                name="author_id"
                className={`form-select ${fieldErrors.author_id ? 'input-error' : ''}`}
                value={formData.author_id}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              >
                <option value="">Select Author...</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              {fieldErrors.author_id && (
                <span className="field-error-msg">{fieldErrors.author_id}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="book-form-category">Category *</label>
              <input
                id="book-form-category"
                name="category"
                type="text"
                className={`form-input ${fieldErrors.category ? 'input-error' : ''}`}
                placeholder="e.g. Software Engineering"
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.category && (
                <span className="field-error-msg">{fieldErrors.category}</span>
              )}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="book-form-copies">Total Copies *</label>
              <input
                id="book-form-copies"
                name="total_copies"
                type="number"
                min="0"
                className={`form-input ${fieldErrors.total_copies ? 'input-error' : ''}`}
                value={formData.total_copies}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.total_copies && (
                <span className="field-error-msg">{fieldErrors.total_copies}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="book-form-desc">Description</label>
            <textarea
              id="book-form-desc"
              name="description"
              rows="3"
              className="form-input"
              placeholder="Brief summary or subject overview..."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Book...' : initialData ? 'Update Book' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminBookForm;
