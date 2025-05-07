
import { Activity } from "lucide-react";

interface AuthHeaderProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

const AuthHeader = ({ isLogin, onToggleMode }: AuthHeaderProps) => {
  return (
    <div className="text-center">
      <div className="mx-auto h-12 w-12 bg-movement-purple text-white flex items-center justify-center rounded-lg">
        <Activity className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
        {isLogin ? "Sign in to your account" : "Create a new account"}
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={onToggleMode}
          className="font-medium text-movement-purple hover:text-movement-dark-purple"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
};

export default AuthHeader;
