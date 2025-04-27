export const validateSignUpForm = (formData: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const errors: string[] = [];

  // Name validation
  if (!formData.name.trim()) {
    errors.push("Name is required");
  } else if (formData.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push("Please enter a valid email address");
  }

  // Password validation
  if (!formData.password) {
    errors.push("Password is required");
  } else if (formData.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  } else if (!/\d/.test(formData.password)) {
    errors.push("Password must contain at least one number");
  } else if (!/[a-zA-Z]/.test(formData.password)) {
    errors.push("Password must contain at least one letter");
  }

  // Role validation
  if (!formData.role) {
    errors.push("Please select a role");
  }

  return errors;
};