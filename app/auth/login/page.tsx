import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-4">
              <a
                href="/auth/forgot-password"
                className="w-full flex justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </a>
              <a
                href="/auth/register"
                className="w-full flex justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create a new account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
