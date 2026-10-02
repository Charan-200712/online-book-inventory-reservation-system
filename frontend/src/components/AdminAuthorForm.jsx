import React, { useState, useEffect } from 'react';

function AdminAuthorForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    biography: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        biography: initialData.biography || '',
      });
    } else {
      setFormData({
        name: '',
        biography: '',
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
    if (!formData.name.trim()) {
      errors.name = 'Author name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Author name must be at least 2 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      biography: formData.biography.trim() || null,
    });
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="author-modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="author-modal-title" className="modal-title">
            {initialData ? 'Edit Author' : 'Add New Author'}
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
            <label htmlFor="author-form-name">Author Name *</label>
            <input
              id="author-form-name"
              name="name"
              type="text"
              className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
              placeholder="e.g. Donald Knuth"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="author-form-bio">Biography</label>
            <textarea
              id="author-form-bio"
              name="biography"
              rows="4"
              className="form-input"
              placeholder="Author background, academic affiliation, or notable works..."
              value={formData.biography}
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
              {isSubmitting ? 'Saving Author...' : initialData ? 'Update Author' : 'Add Author'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAuthorForm;
