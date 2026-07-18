import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth, API_BASE_URL } from './AuthContext';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [wished, setWished] = useState({});
  const [toast, setToast] = useState({ show: false, msg: '' });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, msg });
    toastTimerRef.current = setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  }, []);

  // Fetch listings from API
  const fetchListings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/listings`);
      setListings(res.data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  }, []);

  // Fetch wishlist for logged-in user
  const fetchWishlist = useCallback(async () => {
    if (!user || user.role !== 'buyer') {
      setWished({});
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/wishlist/${user.id}`);
      const wishedMap = {};
      res.data.forEach(car => {
        wishedMap[car.id] = true;
      });
      setWished(wishedMap);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  }, [user]);

  // Toggle wishlist item
  const toggleWish = useCallback(async (carId, e) => {
    if (e) e.stopPropagation();

    if (!user) {
      showToast('Please sign in to add to wishlist');
      return { loginRequired: true };
    }

    if (user.role !== 'buyer') {
      showToast('Only buyers can add cars to wishlist');
      return { error: true };
    }

    const isWished = wished[carId];
    try {
      if (isWished) {
        await axios.delete(`${API_BASE_URL}/wishlist/${user.id}/${carId}`);
        setWished(prev => {
          const next = { ...prev };
          delete next[carId];
          return next;
        });
        showToast('Removed from wishlist');
      } else {
        await axios.post(`${API_BASE_URL}/wishlist`, { userId: user.id, carId });
        setWished(prev => ({ ...prev, [carId]: true }));
        showToast('Saved to wishlist ♥');
      }
      return { success: true };
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update wishlist');
      return { error: true };
    }
  }, [user, wished, showToast]);

  // Load listings on mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Load wishlist when user changes
  useEffect(() => {
    fetchWishlist();
  }, [user, fetchWishlist]);

  // Periodically refresh listings (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListings();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  return (
    <AppContext.Provider value={{
      listings,
      wished,
      toast,
      showToast,
      toggleWish,
      refreshListings: fetchListings,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </AppContext.Provider>
  );
};
