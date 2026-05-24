import { useEffect, useState } from "react";
import PreferredDoctorSelector from "../components/PreferredDoctorSelector";

export default function Settings() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem("settings") || "{}").notifications ?? true
  );

  const [name, setName] = useState(storedUser?.name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const savePreferences = () => {
    localStorage.setItem("settings", JSON.stringify({ notifications }));
    alert("Preferences saved");
  };

  const resetPreferences = () => {
    setNotifications(true);
    localStorage.setItem("settings", JSON.stringify({ notifications: true }));
    alert("Preferences reset");
  };

  const updateProfile = async () => {
    if (!token) return alert("Login required");
    if (!name?.trim() && !avatarFile) return alert("No changes to save");

    setUpdatingProfile(true);
    try {
      const form = new FormData();
      if (name?.trim()) form.append("name", name.trim());
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
          preferredDoctor: data.preferredDoctor || storedUser?.preferredDoctor || null
        })
      );

      window.dispatchEvent(new Event("profileUpdated"));
      alert("Profile updated");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="h-13" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Manage your profile and essential app preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Update your display name and profile picture.</p>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                {storedUser?.avatar ? (
                  <img src={storedUser.avatar} alt="avatar" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-teal-200" />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-2xl font-bold">
                    {(storedUser?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="w-full space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Display Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none ring-teal-300 transition focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-700 outline-none ring-teal-300 transition focus:ring file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  />
                </label>

                {storedUser?.role === "patient" && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preferred Doctor</h3>
                    <p className="mb-3 mt-1 text-xs text-slate-500 dark:text-slate-400">Optional: choose a preferred doctor for faster booking.</p>
                    <PreferredDoctorSelector token={token} />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={updateProfile}
                disabled={updatingProfile}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingProfile ? "Saving..." : "Update Profile"}
              </button>
              <button
                onClick={() => {
                  setName(storedUser?.name || "");
                  setAvatarFile(null);
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                Reset
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Email</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100 break-all">{storedUser?.email || "-"}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Role</div>
                  <div className="font-semibold capitalize text-slate-800 dark:text-slate-100">{storedUser?.role || "-"}</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select your preferred app theme.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-xl px-3 py-2 font-semibold transition ${theme === "light" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-xl px-3 py-2 font-semibold transition ${theme === "dark" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Dark
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preferences</h2>
              <label className="mt-4 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-4 w-4 accent-teal-600"
                />
                Enable notifications
              </label>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={savePreferences}
                  className="rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Save
                </button>
                <button
                  onClick={resetPreferences}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
