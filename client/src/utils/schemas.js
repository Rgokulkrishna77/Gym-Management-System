import * as yup from 'yup';

// Reusable Yup rules (the server validates again with Joi)
export const phoneRule = yup.string().trim()
  .required('Phone is required')
  .matches(/^[0-9+ -]{7,15}$/, 'Enter a valid phone number (7-15 digits)');

export const emailRule = yup.string().trim()
  .email('Enter a valid email address')
  .required('Email is required');

export const passwordRule = yup.string()
  .required('Password is required')
  .min(8, 'Use at least 8 characters')
  .matches(/[A-Za-z]/, 'Include at least one letter')
  .matches(/\d/, 'Include at least one number');

export const planIdRule = yup.number()
  .typeError('Please select a plan')
  .positive('Please select a plan')
  .required('Please select a plan');

export const memberBase = {
  name: yup.string().trim().min(2, 'Name is too short').max(100).required('Name is required'),
  phone: phoneRule,
  email: emailRule,
  address: yup.string().trim().min(3, 'Address is too short').max(255).required('Address is required'),
  age: yup.number()
    .typeError('Age must be a number')
    .integer('Age must be a whole number')
    .min(12, 'Minimum age is 12')
    .max(100, 'Maximum age is 100')
    .required('Age is required'),
};
