import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, resolvedFirebaseConfig, handleFirestoreError, OperationType } from '../firebase';
import { AdminRole, AdminUser } from '../types';

/**
 * Email Master Admin utama.
 * PENTING: nilai ini harus SAMA dengan yang tertulis di firestore.rules.
 * Akunnya dibuat sekali lewat Firebase Console > Authentication > Users > Add user.
 * Password TIDAK disimpan di kode maupun di Firestore — dikelola Firebase Authentication.
 */
export const MASTER_ADMIN_EMAIL = 'admin@sosentono.ai.studio';

interface AuthContextType {
  currentAdmin: AdminUser | null;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  adminRole: AdminRole | null;
  loading: boolean;
  adminsList: AdminUser[];
  authError: string | null;
  clearAuthError: () => void;
  login: (emailInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerAdmin: (emailInput: string, passwordInput: string, displayNameInput: string, role: AdminRole) => Promise<void>;
  updateAdminPassword: (adminId: string, newPasswordInput: string) => Promise<void>;
  sendAdminPasswordReset: (email: string) => Promise<void>;
  updateAdminRole: (adminId: string, newRole: AdminRole) => Promise<void>;
  removeAdmin: (adminId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isMasterEmail = (email?: string | null) =>
  !!email && email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

function toAdminUser(id: string, data: Record<string, any>): AdminUser {
  const email = (data.email || '').toLowerCase();
  return {
    id,
    username: email || id,
    email: email || undefined,
    displayName: data.displayName || email || id,
    role: data.role === 'master_admin' || isMasterEmail(email) ? 'master_admin' : 'admin',
    addedBy: data.addedBy || 'Master Admin',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt,
  };
}

function authErrorMessage(err: any): string {
  const code: string = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email admin atau password salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.';
    case 'auth/operation-not-allowed':
      return 'Login Email/Password belum diaktifkan di Firebase Console (Authentication > Sign-in method).';
    case 'auth/email-already-in-use':
      return 'Email ini sudah punya akun. Gunakan email lain.';
    case 'auth/weak-password':
      return 'Password minimal 6 karakter.';
    case 'auth/requires-recent-login':
      return 'Demi keamanan, keluar lalu masuk lagi sebelum mengganti password.';
    default:
      return err?.message || 'Terjadi kesalahan. Coba lagi.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  /**
   * Menentukan apakah akun Firebase yang sedang masuk adalah admin.
   * Admin = punya dokumen admins/{uid}. Master Admin utama dikenali dari emailnya
   * dan dokumennya dibuat otomatis saat pertama kali masuk.
   */
  const resolveAdmin = async (user: User): Promise<AdminUser | null> => {
    const ref = doc(db, 'admins', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return toAdminUser(user.uid, snap.data());
    }
    if (isMasterEmail(user.email)) {
      const now = new Date().toISOString();
      const data = {
        email: MASTER_ADMIN_EMAIL,
        displayName: 'Master Admin Trah',
        role: 'master_admin' as AdminRole,
        addedBy: 'Sistem',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, data);
      return toAdminUser(user.uid, data);
    }
    return null;
  };

  // 1. Ikuti sesi Firebase Authentication (tersimpan aman oleh Firebase, bukan localStorage buatan sendiri)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentAdmin(null);
        setAdminsList([]);
        setLoading(false);
        return;
      }
      try {
        const admin = await resolveAdmin(user);
        if (admin) {
          setCurrentAdmin(admin);
        } else {
          // Akun ada tapi bukan admin (mis. aksesnya sudah dicabut)
          setCurrentAdmin(null);
          setAuthError('Akun ini tidak terdaftar sebagai admin. Hubungi Master Admin.');
          await firebaseSignOut(auth);
        }
      } catch (err) {
        console.warn('Gagal memeriksa status admin:', err);
        setCurrentAdmin(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Daftar admin hanya dimuat ketika sudah masuk sebagai admin (aturan Firestore melarang tamu membacanya)
  useEffect(() => {
    if (!currentAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const list: AdminUser[] = [];
        snapshot.forEach((docSnap) => list.push(toAdminUser(docSnap.id, docSnap.data())));
        list.sort((a, b) => {
          if (a.role === 'master_admin' && b.role !== 'master_admin') return -1;
          if (a.role !== 'master_admin' && b.role === 'master_admin') return 1;
          return (a.email || a.username).localeCompare(b.email || b.username);
        });
        setAdminsList(list);

        const self = list.find((a) => a.id === currentAdmin.id);
        if (self && (self.role !== currentAdmin.role || self.displayName !== currentAdmin.displayName)) {
          setCurrentAdmin(self);
        }
      },
      (error) => {
        console.warn('Admins listener note:', error.message);
      }
    );
    return () => unsub();
  }, [currentAdmin?.id]);

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    setAuthError(null);
    const email = emailInput.trim().toLowerCase();
    if (!email || !passwordInput) {
      setAuthError('Silakan masukkan email admin dan password.');
      return false;
    }
    if (!email.includes('@')) {
      setAuthError('Masukkan alamat email admin yang lengkap (bukan username).');
      return false;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, passwordInput);
      const admin = await resolveAdmin(cred.user);
      if (!admin) {
        await firebaseSignOut(auth);
        setAuthError('Akun ini tidak terdaftar sebagai admin. Hubungi Master Admin.');
        return false;
      }
      setCurrentAdmin(admin);
      return true;
    } catch (err) {
      setAuthError(authErrorMessage(err));
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setCurrentAdmin(null);
    setAdminsList([]);
    setAuthError(null);
  };

  /**
   * Master Admin: mendaftarkan admin baru.
   * Akun dibuat lewat instance Firebase kedua supaya sesi Master Admin tidak tergantikan.
   */
  const registerAdmin = async (
    emailInput: string,
    passwordInput: string,
    displayNameInput: string,
    role: AdminRole
  ) => {
    if (currentAdmin?.role !== 'master_admin') {
      throw new Error('Hanya Master Admin yang memiliki wewenang untuk mendaftarkan admin baru.');
    }

    const email = emailInput.trim().toLowerCase();
    const displayName = displayNameInput.trim() || email;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Masukkan alamat email yang valid untuk admin baru (contoh: budi@gmail.com).');
    }
    if (!passwordInput || passwordInput.length < 6) {
      throw new Error('Password minimal 6 karakter.');
    }
    if (adminsList.some((a) => a.email === email)) {
      throw new Error(`Email "${email}" sudah terdaftar sebagai admin.`);
    }

    const secondaryApp = initializeApp(resolvedFirebaseConfig, `daftar-admin-${Date.now()}`);
    let newUid: string;
    try {
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, passwordInput);
      newUid = cred.user.uid;
      await firebaseSignOut(secondaryAuth);
    } catch (err) {
      throw new Error(authErrorMessage(err));
    } finally {
      deleteApp(secondaryApp).catch(() => undefined);
    }

    const now = new Date().toISOString();
    try {
      await setDoc(doc(db, 'admins', newUid), {
        email,
        displayName,
        role,
        addedBy: currentAdmin.displayName || currentAdmin.email || 'Master Admin',
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${newUid}`);
    }
  };

  /**
   * Ganti password — hanya untuk akun sendiri. Password admin lain direset lewat email.
   */
  const updateAdminPassword = async (adminId: string, newPasswordInput: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== adminId) {
      throw new Error('Password admin lain tidak bisa diganti langsung. Gunakan tombol "Kirim Email Reset".');
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }
    try {
      await updatePassword(auth.currentUser, newPasswordInput);
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
  };

  const sendAdminPasswordReset = async (email: string) => {
    if (currentAdmin?.role !== 'master_admin') {
      throw new Error('Hanya Master Admin yang dapat mengirim email reset password.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
  };

  const updateAdminRole = async (adminId: string, newRole: AdminRole) => {
    if (currentAdmin?.role !== 'master_admin') {
      throw new Error('Hanya Master Admin yang dapat mengubah hak akses admin.');
    }
    const target = adminsList.find((a) => a.id === adminId);
    if (isMasterEmail(target?.email)) {
      throw new Error('Peran Master Admin Utama tidak dapat diubah.');
    }
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admins/${adminId}`);
    }
  };

  /**
   * Mencabut akses admin: dokumen admins/{uid} dihapus sehingga akun itu
   * langsung kehilangan hak tulis (aturan Firestore memeriksa dokumen ini).
   */
  const removeAdmin = async (adminId: string) => {
    if (currentAdmin?.role !== 'master_admin') {
      throw new Error('Hanya Master Admin yang dapat mencabut akses admin.');
    }
    const target = adminsList.find((a) => a.id === adminId);
    if (isMasterEmail(target?.email)) {
      throw new Error('Akun Master Admin Utama tidak dapat dihapus.');
    }
    if (currentAdmin.id === adminId) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri.');
    }
    try {
      await deleteDoc(doc(db, 'admins', adminId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
    }
  };

  const isAdmin = !!currentAdmin;
  const isMasterAdmin = currentAdmin?.role === 'master_admin';
  const adminRole = currentAdmin?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentAdmin,
        isAdmin,
        isMasterAdmin,
        adminRole,
        loading,
        adminsList,
        authError,
        clearAuthError,
        login,
        logout,
        registerAdmin,
        updateAdminPassword,
        sendAdminPasswordReset,
        updateAdminRole,
        removeAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
