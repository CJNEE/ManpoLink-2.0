import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';

import logo3pl from '@/images/3pl1.png';
import mobileLogoLogin from '@/images/3pl1.png';

export const LoginScreen = () => {
  const navigate = useNavigate();

  const {
    setUser,
    setToken,
    setIsAuthenticated,
    setEmployee,
  } = useAuth();

  const loginMutation = useLogin();

  const { success, error } = useToast();

  const [username, setUsername] =
    useState<string>('');

  const [password, setPassword] =
    useState<string>('');

  const [showPassword, setShowPassword] =
    useState<boolean>(false);

  const [loginError, setLoginError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isLoading) return;

    setLoginError(null);

    if (!username || !password) {
      setLoginError(
        'Please enter both username and password'
      );
      return;
    }

    try {
      setIsLoading(true);

      const response =
        await loginMutation.mutateAsync({
          username,
          password,
        });

      if (response?.token) {
        localStorage.setItem(
          'access_token',
          response.token
        );

        if (response?.user) {
          localStorage.setItem(
            'currentUser',
            JSON.stringify(response.user)
          );
        }

        if (response?.employee) {
          localStorage.setItem(
            'currentEmployee',
            JSON.stringify(response.employee)
          );
        }

        const userWithRole = response?.user
          ? {
              ...response.user,
              role:
                response.user.role ||
                response.employee?.role,
            }
          : null;

        setToken(response.token);
        setUser(userWithRole);
        setEmployee(response.employee ?? null);
        setIsAuthenticated(true);

        success(
          `Welcome back ${
            response.user?.username || ''
          }`
        );

        const role =
          response.user?.role ||
          response.employee?.role;

        if (role === 'Admin') {
          navigate('/admin', {
            replace: true,
          });
        } else if (role === 'HR') {
          navigate('/hr', {
            replace: true,
          });
        } else if (role === 'Employee') {
          navigate('/employee', {
            replace: true,
          });
        } else {
          navigate('/admin', {
            replace: true,
          });
        }
      }
    } catch (err: unknown) {
      let errorMessage =
        'Login failed. Please try again.';

      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const errorObj = err as {
          response?: {
            data?: {
              error?: string;
              detail?: string;
              non_field_errors?: string[];
            };
          };
        };

        const data = errorObj.response?.data;

        errorMessage =
          data?.error ||
          data?.detail ||
          data?.non_field_errors?.[0] ||
          errorMessage;
      }

      setLoginError(errorMessage);
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#fdf8f8]">
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 overflow-hidden">
        {/* LEFT BG */}
        <div className="absolute left-0 top-0 h-full w-full bg-[#fdf8f8]" />

        {/* RIGHT RED PANEL */}
        <div className="absolute right-0 top-0 hidden h-full w-[58%] overflow-hidden bg-gradient-to-br from-[#ff4040] via-[#f21832] to-[#c4001c] lg:block">
          {/* WAVES */}
          <div className="absolute right-[-120px] top-[-50px] h-[450px] w-[450px] rounded-full border border-white/10" />
          <div className="absolute right-[-80px] top-[-10px] h-[380px] w-[380px] rounded-full border border-white/10" />
          <div className="absolute right-[-40px] top-[30px] h-[310px] w-[310px] rounded-full border border-white/10" />

          {/* BOTTOM WAVES */}
          <div className="absolute bottom-[-180px] left-[-120px] h-[400px] w-[700px] rounded-[100%] bg-black/10 blur-2xl" />

          {/* DOTS */}
          <div className="absolute bottom-10 right-10 grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                />
              )
            )}
          </div>

          {/* FLOATING */}
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
            }}
            className="absolute right-16 top-10 h-16 w-16 rounded-full bg-white/10 blur-sm"
          />

          <motion.div
            animate={{
              y: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
            className="absolute left-16 bottom-16 h-28 w-28 rounded-full bg-white/10 blur-xl"
          />
        </div>

        {/* CENTER WAVE */}
        <div className="absolute left-[45%] top-0 hidden h-full w-[240px] -translate-x-1/2 lg:block">
          <svg
            viewBox="0 0 300 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M130,0 
                C280,180 20,330 170,520
                C320,710 80,860 200,1000
                L0,1000 L0,0 Z"
              fill="#fdf8f8"
            />
          </svg>
        </div>

        {/* LEFT DECOR */}
        <div className="absolute left-[5%] top-[8%] h-[140px] w-[140px] rounded-full bg-red-100/70 blur-2xl" />

        <div className="absolute bottom-[-80px] left-[-80px] h-[260px] w-[260px] rounded-full bg-red-100/70 blur-3xl" />

        {/* LEFT TOP LINES */}
        <svg
          className="absolute left-[12%] top-0 hidden opacity-40 lg:block"
          width="520"
          height="320"
          viewBox="0 0 520 320"
          fill="none"
        >
          <path
            d="M0 0C180 100 120 250 520 320"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
          <path
            d="M0 0C160 80 100 220 500 300"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
          <path
            d="M0 0C140 60 80 200 470 280"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
        </svg>

        {/* DOTS LEFT */}
        <div className="absolute left-[28%] top-[10%] hidden grid-cols-4 gap-4 lg:grid">
          {Array.from({ length: 16 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400"
              />
            )
          )}
        </div>

        <div className="absolute bottom-[14%] left-[24%] hidden grid-cols-4 gap-4 lg:grid">
          {Array.from({ length: 12 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400"
              />
            )
          )}
        </div>

        {/* ================= MOBILE ONLY BG ================= */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff2746] via-[#ff1238] to-[#d00024] lg:hidden" />

        {/* MOBILE TOP WHITE */}
        <div className="absolute left-0 top-0 h-[34%] min-h-[240px] w-full overflow-hidden rounded-b-[55px] bg-[#f7f2f2] lg:hidden">
          {/* CURVED BOTTOM */}
          <svg
            className="absolute bottom-[-1px] left-0 w-full"
            viewBox="0 0 500 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 
              C120,120 260,0 500,70 
              L500,120 
              L0,120 Z"
              fill="#ff1238"
            />
          </svg>

          {/* MOBILE LOGO */}
          <div className="absolute left-1/2 top-[14%] -translate-x-1/2">
            <img
              src={mobileLogoLogin}
              alt="3PL"
              className="w-[140px] object-contain opacity-95"
            />
          </div>

          {/* DOTS */}
          <div className="absolute right-8 top-16 grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-red-400"
                />
              )
            )}
          </div>

          {/* CURVE LINE */}
          <div className="absolute bottom-5 left-1/2 h-[120px] w-[120%] -translate-x-1/2 rounded-[100%] border border-white/20" />
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 lg:px-10">
        <div className="grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
          {/* ================= LEFT ================= */}
          <motion.div
            initial={{
              opacity: 0,
              x: -40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="hidden justify-center lg:flex"
          >
            <img
              src={logo3pl}
              alt="3PL"
              className="w-[430px] object-contain drop-shadow-[0_10px_40px_rgba(255,0,0,0.1)]"
            />
          </motion.div>

          {/* ================= RIGHT ================= */}
          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.9,
            }}
            className="mx-auto w-full max-w-[560px]"
          >
            <div className="rounded-[38px] bg-transparent px-0 py-0 shadow-none">
              {/* ================= DESKTOP UI ================= */}
              <div className="hidden rounded-[38px] bg-transparent lg:block">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
                >
                  <Lock
                    size={34}
                    className="text-white"
                  />
                </motion.div>

                <div className="mt-8 text-center">
                  <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                    Sign In
                  </h1>

                  <p className="mt-4 text-base text-red-100 sm:text-lg">
                    Welcome back! Please login to continue
                  </p>

                  <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-white" />
                </div>

                {loginError && (
                  <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-md">
                    {loginError}
                  </div>
                )}

                <form
                  onSubmit={handleLogin}
                  className="mt-10 space-y-7"
                >
                  {/* USERNAME */}
                  <div>
                    <label className="mb-3 block text-base font-semibold text-white">
                      Username
                    </label>

                    <div className="group relative">
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                      <div className="relative flex h-[74px] items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md">
                        <User
                          size={23}
                          className="mr-4 text-white"
                        />

                        <input
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                            )
                          }
                          placeholder="Enter your username"
                          className="h-full w-full bg-transparent text-lg text-white placeholder:text-red-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-3 block text-base font-semibold text-white">
                      Password
                    </label>

                    <div className="group relative">
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                      <div className="relative flex h-[74px] items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md">
                        <Lock
                          size={23}
                          className="mr-4 text-white"
                        />

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="Enter your password"
                          className="h-full w-full bg-transparent text-lg text-white placeholder:text-red-100 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="text-white"
                        >
                          {showPassword ? (
                            <EyeOff size={24} />
                          ) : (
                            <Eye size={24} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP BUTTON */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    disabled={isLoading}
                    className={`group relative mt-4 flex h-[76px] w-full items-center justify-center overflow-hidden rounded-full text-xl font-bold shadow-[0_12px_35px_rgba(255,255,255,0.25)] transition-all duration-300 ${
                      isLoading
                        ? 'bg-white/80 text-red-400'
                        : 'bg-white text-red-600'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          size={26}
                          className="mr-3 animate-spin"
                        />

                        <span>
                          Logging in...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-4">
                          Login
                        </span>

                        <ArrowRight
                          size={28}
                          className="transition-all duration-300 group-hover:translate-x-2"
                        />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>

              {/* ================= MOBILE UI ================= */}
              <div className="relative flex min-h-screen flex-col justify-center pt-[180px] pb-5 lg:hidden">
                {/* LOCK */}
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/20 bg-white/20 backdrop-blur-xl"
                >
                  <Lock
                    size={26}
                    className="text-white"
                  />
                </motion.div>

                {/* TITLE */}
                <div className="mt-5 text-center">
                  <h1 className="text-[46px] font-black leading-none tracking-tight text-white">
                    Sign In
                  </h1>

                  <p className="mt-2 text-[15px] text-red-100">
                    Welcome back! Please login to continue
                  </p>

                  <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-white" />
                </div>

                {/* ERROR */}
                {loginError && (
                  <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-md">
                    {loginError}
                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="mt-7 space-y-5"
                >
                  {/* USERNAME */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      Username
                    </label>

                    <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_rgba(255,255,255,0.15)]">
                      <div className="flex h-[62px] items-center">
                        <div className="flex h-full w-[62px] items-center justify-center border-r border-red-100 bg-[#fff5f5]">
                          <User
                            size={20}
                            className="text-red-500"
                          />
                        </div>

                        <input
                          type="text"
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                            )
                          }
                          placeholder="Enter your username"
                          className="h-full w-full bg-white px-4 text-[15px] font-medium text-[#222] placeholder:text-gray-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      Password
                    </label>

                    <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_rgba(255,255,255,0.15)]">
                      <div className="flex h-[62px] items-center">
                        <div className="flex h-full w-[62px] items-center justify-center border-r border-red-100 bg-[#fff5f5]">
                          <Lock
                            size={20}
                            className="text-red-500"
                          />
                        </div>

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          placeholder="Enter your password"
                          className="h-full w-full bg-white px-4 text-[15px] font-medium text-[#222] placeholder:text-gray-400 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="mr-4 text-red-500"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MOBILE BUTTON */}
                  <motion.button
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    disabled={isLoading}
                    className={`group mt-2 flex h-[64px] w-full items-center justify-center rounded-full text-[24px] font-black shadow-[0_14px_40px_rgba(255,255,255,0.25)] transition-all duration-300 ${
                      isLoading
                        ? 'bg-white/80 text-red-400'
                        : 'bg-white text-red-600'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          size={24}
                          className="mr-3 animate-spin"
                        />

                        <span>
                          Logging in...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-4">
                          Login
                        </span>

                        <ArrowRight
                          size={28}
                          className="transition-all duration-300 group-active:translate-x-2"
                        />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* FOOTER */}
                <div className="mt-6 text-center">
                  <p className="text-[11px] text-red-100">
                    © 2026{' '}
                    <span className="font-bold text-white">
                      3PL Business Solutions
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};