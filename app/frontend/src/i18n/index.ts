import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
      },
      auth: {
        signIn: 'Sign in to your account',
        signUp: 'Create a new account',
        invalidCredentials: 'Invalid credentials',
        loginSuccess: 'Login successful',
        logoutSuccess: 'Logout successful',
      },
      cases: {
        title: 'Cases',
        new: 'New Case',
        details: 'Case Details',
        history: 'Case History',
        stats: 'Statistics',
        status: 'Status',
        category: 'Category',
        priority: 'Priority',
        applicantName: 'Applicant Name',
        dob: 'Date of Birth',
        phone: 'Phone',
        created: 'Created',
        updated: 'Updated',
      },
      import: {
        title: 'Import Cases',
        upload: 'Upload CSV',
        dragDrop: 'Drag and drop your CSV file here, or click to browse',
        validating: 'Validating data...',
        processing: 'Processing import...',
        success: 'Import completed successfully',
        failed: 'Import failed',
        partial: 'Import completed with errors',
        fixErrors: 'Fix Errors',
        autoFix: 'Auto Fix',
        removeInvalid: 'Remove Invalid Rows',
      },
      validation: {
        required: '{{field}} is required',
        invalid: 'Invalid {{field}}',
        emailFormat: 'Invalid email format',
        phoneFormat: 'Invalid phone format (use E.164)',
        dateFormat: 'Invalid date format',
        dateTooOld: 'Date cannot be before 1900',
        dateFuture: 'Date cannot be in the future',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
